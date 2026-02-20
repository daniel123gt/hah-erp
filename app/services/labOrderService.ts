import supabase from "~/utils/supabase";
import { procedureService } from "~/services/procedureService";

const TOMA_DE_MUESTRA_NAME = "toma de muestra";
const RECARGO_FALLBACK = 120;

export interface LabExamOrderItem {
  id: string; // ID del item de la orden
  exam_id: string;
  exam_code: string;
  exam_name: string;
  price: number;
  status: 'Pendiente' | 'En toma de muestra' | 'En Proceso' | 'Completado' | 'Cancelado';
}

export type LabOrderPaymentMethod = 'yape' | 'plin' | 'transfer_deposito' | 'tarjeta_link_pos' | 'efectivo';
export type LabOrderPaymentStatus = 'Pendiente de pago' | 'Pagado';

export interface LabExamOrder {
  id: string;
  patient_id: string;
  order_date: string;
  /** Fecha programada para la toma de muestra (laboratorios de hoy, próximas citas) */
  sample_date?: string | null;
  physician_name?: string;
  priority: 'urgente' | 'normal' | 'programada';
  observations?: string;
  total_amount: number;
  status: 'Pendiente' | 'En toma de muestra' | 'En Proceso' | 'Completado' | 'Cancelado';
  payment_method?: LabOrderPaymentMethod | null;
  payment_status?: LabOrderPaymentStatus | null;
  /** Número de referencia u operación del pago (sustento) */
  payment_reference?: string | null;
  result_pdf_url?: string;
  result_date?: string;
  result_notes?: string;
  items: LabExamOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateLabOrderData {
  patient_id: string;
  order_date: string;
  /** Fecha programada para la toma de muestra */
  sample_date?: string | null;
  physician_name?: string;
  priority?: 'urgente' | 'normal' | 'programada';
  observations?: string;
  exam_ids: string[];
}

export const labOrderService = {
  async createOrder(data: CreateLabOrderData): Promise<LabExamOrder> {
    try {
      // Primero, obtener los exámenes seleccionados para calcular el total
      const { data: exams, error: examsError } = await supabase
        .from('laboratory_exams')
        .select('id, codigo, nombre, precio')
        .in('id', data.exam_ids);

      if (examsError) throw examsError;
      if (!exams || exams.length === 0) {
        throw new Error('No se encontraron los exámenes seleccionados');
      }

      // Calcular el total (precio al cliente con recargo = procedimiento "Toma de muestra" del catálogo)
      const parsePrice = (precio: string) =>
        parseFloat(precio.replace('S/', '').replace(',', '').trim()) || 0;

      const tomaMuestra = await procedureService.getProcedureByName(TOMA_DE_MUESTRA_NAME);
      const RECARGO_TOTAL = tomaMuestra?.base_price_soles ?? RECARGO_FALLBACK;
      const recargoUnitario = exams.length > 0 ? RECARGO_TOTAL / exams.length : 0;
      
      const totalAmount = exams.reduce((acc, exam) => {
        const precio = parsePrice(exam.precio);
        return acc + (precio * 1.2) + recargoUnitario;
      }, 0);

      // Crear la orden principal
      const { data: order, error: orderError } = await supabase
        .from('lab_exam_orders')
        .insert([
          {
            patient_id: data.patient_id,
            order_date: data.order_date,
            sample_date: data.sample_date || null,
            physician_name: data.physician_name || null,
            priority: data.priority || 'normal',
            observations: data.observations || null,
            total_amount: totalAmount,
            status: 'Pendiente'
          }
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear los items de la orden
      const items = exams.map(exam => {
        const precio = parsePrice(exam.precio);
        return {
          order_id: order.id,
          exam_id: exam.id,
          exam_code: exam.codigo,
          exam_name: exam.nombre,
          price: precio * 1.2 + recargoUnitario,
          status: 'Pendiente'
        };
      });

      const { error: itemsError } = await supabase
        .from('lab_exam_order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Obtener la orden completa con items
      const orderWithItems = await this.getOrderById(order.id);
      
      return orderWithItems;
    } catch (error: any) {
      console.error('Error al crear orden:', error);
      throw new Error(error?.message || 'Error al crear la orden de exámenes');
    }
  },

  async getOrderById(orderId: string): Promise<LabExamOrder> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('lab_exam_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from('lab_exam_order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      return {
        ...order,
        items: (items || []).map(item => ({
          id: item.id,
          exam_id: item.exam_id,
          exam_code: item.exam_code,
          exam_name: item.exam_name,
          price: item.price,
          status: item.status,
        }))
      } as LabExamOrder;
    } catch (error: any) {
      console.error('Error al obtener orden:', error);
      throw new Error(error?.message || 'Error al obtener la orden');
    }
  },

  async getOrdersByPatient(patientId: string): Promise<LabExamOrder[]> {
    try {
      const { data: orders, error } = await supabase
        .from('lab_exam_orders')
        .select('*')
        .eq('patient_id', patientId)
        .order('order_date', { ascending: false });

      if (error) throw error;

      // Obtener items para cada orden
      const ordersWithItems = await Promise.all(
        (orders || []).map(async (order) => {
          const { data: items } = await supabase
            .from('lab_exam_order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            items: (items || []).map(item => ({
              exam_id: item.exam_id,
              exam_code: item.exam_code,
              exam_name: item.exam_name,
              price: item.price,
              status: item.status,
              result_pdf_url: item.result_pdf_url || undefined,
              result_date: item.result_date || undefined,
              result_notes: item.result_notes || undefined
            }))
          } as LabExamOrder;
        })
      );

      return ordersWithItems;
    } catch (error: any) {
      console.error('Error al obtener órdenes:', error);
      throw new Error(error?.message || 'Error al obtener las órdenes');
    }
  },

  async getAllOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<{ data: LabExamOrder[]; total: number }> {
    try {
      const { page = 1, limit = 50, status } = options;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('lab_exam_orders')
        .select('*', { count: 'exact' })
        .order('order_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: orders, error, count } = await query;

      if (error) throw error;

      // Obtener valoración completa para cada orden
      const ordersWithItems = await Promise.all(
        (orders || []).map(async (order) => {
          const { data: items } = await supabase
            .from('lab_exam_order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            items: (items || []).map(item => ({
              exam_id: item.exam_id,
              exam_code: item.exam_code,
              exam_name: item.exam_name,
              price: item.price,
              status: item.status,
              result_pdf_url: item.result_pdf_url || undefined,
              result_date: item.result_date || undefined,
              result_notes: item.result_notes || undefined
            }))
          } as LabExamOrder;
        })
      );

      return {
        data: ordersWithItems,
        total: count || 0
      };
    } catch (error: any) {
      console.error('Error al obtener órdenes:', error);
      throw new Error(error?.message || 'Error al obtener las órdenes');
    }
  },

  async updateOrderStatus(orderId: string, status: LabExamOrder['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('lab_exam_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error al actualizar orden:', error);
      throw new Error(error?.message || 'Error al actualizar el estado de la orden');
    }
  },

  async updateOrderSampleDate(orderId: string, sample_date: string | null): Promise<void> {
    try {
      const { error } = await supabase
        .from('lab_exam_orders')
        .update({ sample_date, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error al actualizar fecha de toma de muestra:', error);
      throw new Error(error?.message || 'Error al actualizar la fecha de toma de muestra');
    }
  },

  async updateOrderPayment(
    orderId: string,
    data: {
      payment_method?: LabOrderPaymentMethod | null;
      payment_status?: LabOrderPaymentStatus | null;
      payment_reference?: string | null;
    }
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (data.payment_method !== undefined) updateData.payment_method = data.payment_method;
      if (data.payment_status !== undefined) updateData.payment_status = data.payment_status;
      if (data.payment_reference !== undefined) updateData.payment_reference = data.payment_reference;
      const { error } = await supabase
        .from('lab_exam_orders')
        .update(updateData)
        .eq('id', orderId);
      if (error) throw error;
    } catch (error: any) {
      console.error('Error al actualizar pago:', error);
      throw new Error(error?.message || 'Error al actualizar el pago de la orden');
    }
  },

  async updateOrderResult(orderId: string, data: {
    result_pdf_url?: string;
    result_date?: string;
    result_notes?: string;
    status?: 'Pendiente' | 'En toma de muestra' | 'En Proceso' | 'Completado' | 'Cancelado';
  }): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (data.result_pdf_url !== undefined) updateData.result_pdf_url = data.result_pdf_url;
      if (data.result_date !== undefined) updateData.result_date = data.result_date;
      if (data.result_notes !== undefined) updateData.result_notes = data.result_notes;
      if (data.status !== undefined) updateData.status = data.status;

      const { error } = await supabase
        .from('lab_exam_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error al actualizar resultado:', error);
      throw new Error(error?.message || 'Error al actualizar el resultado de la orden');
    }
  },

  async deleteOrderResult(orderId: string): Promise<void> {
    try {
      // Primero obtener la orden para eliminar el archivo del storage si existe
      const { data: order, error: fetchError } = await supabase
        .from('lab_exam_orders')
        .select('result_pdf_url')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Si hay un PDF, eliminarlo del storage
      if (order?.result_pdf_url) {
        // Extraer el path del URL (ej: https://xxx.supabase.co/storage/v1/object/public/bucket/path/file.pdf)
        const urlParts = order.result_pdf_url.split('/');
        const bucketAndPath = urlParts.slice(urlParts.indexOf('object') + 2).join('/');
        const bucket = bucketAndPath.split('/')[0];
        const filePath = bucketAndPath.split('/').slice(1).join('/');

        try {
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);
          
          if (deleteError) {
            console.warn('Error al eliminar archivo del storage:', deleteError);
            // No lanzamos error, solo registramos
          }
        } catch (storageError) {
          console.warn('Error al eliminar archivo del storage:', storageError);
        }
      }

      // Limpiar los campos del resultado en la base de datos
      const { error } = await supabase
        .from('lab_exam_orders')
        .update({
          result_pdf_url: null,
          result_date: null,
          result_notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error al eliminar resultado:', error);
      throw new Error(error?.message || 'Error al eliminar el resultado');
    }
  },

  async addExamsToOrder(orderId: string, examIds: string[]): Promise<LabExamOrder> {
    try {
      // Obtener la orden actual
      const currentOrder = await this.getOrderById(orderId);
      
      // Obtener los exámenes a agregar
      const { data: exams, error: examsError } = await supabase
        .from('laboratory_exams')
        .select('id, codigo, nombre, precio')
        .in('id', examIds);

      if (examsError) throw examsError;
      if (!exams || exams.length === 0) {
        throw new Error('No se encontraron los exámenes seleccionados');
      }

      // Verificar que los exámenes no estén ya en la orden
      const existingExamIds = currentOrder.items.map(item => item.exam_id);
      const newExams = exams.filter(exam => !existingExamIds.includes(exam.id));

      if (newExams.length === 0) {
        throw new Error('Todos los exámenes seleccionados ya están en la orden');
      }

      // Calcular precios (mismo cálculo que en createOrder)
      const parsePrice = (precio: string) =>
        parseFloat(precio.replace('S/', '').replace(',', '').trim()) || 0;

      const tomaMuestra = await procedureService.getProcedureByName(TOMA_DE_MUESTRA_NAME);
      const RECARGO_TOTAL = tomaMuestra?.base_price_soles ?? RECARGO_FALLBACK;
      const totalItems = currentOrder.items.length + newExams.length;
      const recargoUnitario = totalItems > 0 ? RECARGO_TOTAL / totalItems : 0;

      // Crear items nuevos
      const newItems = newExams.map(exam => {
        const precio = parsePrice(exam.precio);
        return {
          order_id: orderId,
          exam_id: exam.id,
          exam_code: exam.codigo,
          exam_name: exam.nombre,
          price: precio * 1.2 + recargoUnitario,
          status: 'Pendiente'
        };
      });

      // Obtener todos los exámenes (existentes + nuevos) para recalcular precios
      const allExamIds = [...existingExamIds, ...newExams.map(e => e.id)];
      const { data: allExams } = await supabase
        .from('laboratory_exams')
        .select('id, precio')
        .in('id', allExamIds);

      // Recalcular precios de items existentes con el nuevo recargo unitario
      const updatedExistingItems = currentOrder.items.map(item => {
        // Obtener el precio original del examen
        const exam = allExams?.find(e => e.id === item.exam_id);
        if (!exam) return item;
        
        const precio = parsePrice(exam.precio);
        return {
          ...item,
          price: precio * 1.2 + recargoUnitario
        };
      });

      // Insertar nuevos items
      const { error: itemsError } = await supabase
        .from('lab_exam_order_items')
        .insert(newItems);

      if (itemsError) throw itemsError;

      // Actualizar items existentes con nuevos precios
      for (const item of updatedExistingItems) {
        const { error: updateError } = await supabase
          .from('lab_exam_order_items')
          .update({ price: item.price })
          .eq('id', item.id);
        
        if (updateError) {
          console.warn('Error al actualizar precio del item:', updateError);
        }
      }

      // Recalcular total
      const newTotal = [...updatedExistingItems, ...newItems.map(item => ({
        id: '',
        exam_id: item.exam_id,
        exam_code: item.exam_code,
        exam_name: item.exam_name,
        price: item.price,
        status: item.status as any
      }))].reduce((sum, item) => sum + item.price, 0);

      // Actualizar total de la orden
      const { error: orderUpdateError } = await supabase
        .from('lab_exam_orders')
        .update({ 
          total_amount: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (orderUpdateError) throw orderUpdateError;

      // Retornar la orden actualizada
      return await this.getOrderById(orderId);
    } catch (error: any) {
      console.error('Error al agregar exámenes:', error);
      throw new Error(error?.message || 'Error al agregar exámenes a la orden');
    }
  },

  async removeExamFromOrder(orderId: string, itemId: string): Promise<LabExamOrder> {
    try {
      // Obtener la orden actual
      const currentOrder = await this.getOrderById(orderId);
      
      // Eliminar el item
      const { error: deleteError } = await supabase
        .from('lab_exam_order_items')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      // Si no quedan items, eliminar la orden o mantenerla con total 0
      const remainingItems = currentOrder.items.filter(item => item.id !== itemId);
      
      if (remainingItems.length === 0) {
        // Si no quedan items, actualizar el total a 0
        const { error: orderUpdateError } = await supabase
          .from('lab_exam_orders')
          .update({ 
            total_amount: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (orderUpdateError) throw orderUpdateError;
      } else {
        // Recalcular precios de items restantes con nuevo recargo unitario
        const tomaMuestra = await procedureService.getProcedureByName(TOMA_DE_MUESTRA_NAME);
        const RECARGO_TOTAL = tomaMuestra?.base_price_soles ?? RECARGO_FALLBACK;
        const recargoUnitario = remainingItems.length > 0 ? RECARGO_TOTAL / remainingItems.length : 0;

        // Obtener los exámenes para recalcular precios
        const examIds = remainingItems.map(item => item.exam_id);
        const { data: exams } = await supabase
          .from('laboratory_exams')
          .select('id, precio')
          .in('id', examIds);

        const parsePrice = (precio: string) =>
          parseFloat(precio.replace('S/', '').replace(',', '').trim()) || 0;

        // Actualizar precios de items restantes
        for (const item of remainingItems) {
          const exam = exams?.find(e => e.id === item.exam_id);
          if (!exam) continue;
          
          const precio = parsePrice(exam.precio);
          const newPrice = precio * 1.2 + recargoUnitario;

          const { error: updateError } = await supabase
            .from('lab_exam_order_items')
            .update({ price: newPrice })
            .eq('id', item.id);
          
          if (updateError) {
            console.warn('Error al actualizar precio del item:', updateError);
          }
        }

        // Recalcular total
        const { data: updatedItems } = await supabase
          .from('lab_exam_order_items')
          .select('price')
          .eq('order_id', orderId);

        const newTotal = (updatedItems || []).reduce((sum, item) => sum + item.price, 0);

        // Actualizar total de la orden
        const { error: orderUpdateError } = await supabase
          .from('lab_exam_orders')
          .update({ 
            total_amount: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (orderUpdateError) throw orderUpdateError;
      }

      // Retornar la orden actualizada
      return await this.getOrderById(orderId);
    } catch (error: any) {
      console.error('Error al eliminar examen:', error);
      throw new Error(error?.message || 'Error al eliminar examen de la orden');
    }
  },

  /** Órdenes con fecha de toma de muestra = date (o order_date si sample_date es null, para compatibilidad). */
  async getOrdersForSampleDate(sampleDate: string): Promise<LabExamOrder[]> {
    try {
      const { data: bySample, error: e1 } = await supabase
        .from('lab_exam_orders')
        .select('*')
        .eq('sample_date', sampleDate)
        .order('created_at', { ascending: false });
      if (e1) throw e1;
      const { data: byOrderDate, error: e2 } = await supabase
        .from('lab_exam_orders')
        .select('*')
        .is('sample_date', null)
        .eq('order_date', sampleDate)
        .order('created_at', { ascending: false });
      if (e2) throw e2;
      const idsBySample = new Set((bySample ?? []).map((r) => r.id));
      const merged = [...(bySample ?? []), ...(byOrderDate ?? []).filter((r) => !idsBySample.has(r.id))];
      const ordersWithItems = await Promise.all(
        merged.map(async (order) => {
          const { data: items } = await supabase
            .from('lab_exam_order_items')
            .select('*')
            .eq('order_id', order.id);
          return {
            ...order,
            items: (items ?? []).map((item) => ({
              id: item.id,
              exam_id: item.exam_id,
              exam_code: item.exam_code,
              exam_name: item.exam_name,
              price: item.price,
              status: item.status,
            })),
          };
        })
      );
      return ordersWithItems as LabExamOrder[];
    } catch (error: any) {
      console.error('Error al obtener órdenes por fecha de toma:', error);
      return [];
    }
  },

  /** Órdenes con fecha de toma de muestra (o order_date si sample_date es null) en el rango [fromDate, toDate]. */
  async getOrdersForSampleDateRange(fromDate: string, toDate: string): Promise<LabExamOrder[]> {
    try {
      const { data: bySample, error: e1 } = await supabase
        .from('lab_exam_orders')
        .select('*')
        .gte('sample_date', fromDate)
        .lte('sample_date', toDate)
        .order('sample_date', { ascending: true })
        .order('created_at', { ascending: false });
      if (e1) throw e1;
      const { data: byOrderDate, error: e2 } = await supabase
        .from('lab_exam_orders')
        .select('*')
        .is('sample_date', null)
        .gte('order_date', fromDate)
        .lte('order_date', toDate)
        .order('order_date', { ascending: true })
        .order('created_at', { ascending: false });
      if (e2) throw e2;
      const idsBySample = new Set((bySample ?? []).map((r) => r.id));
      const merged = [...(bySample ?? []), ...(byOrderDate ?? []).filter((r) => !idsBySample.has(r.id))];
      const ordersWithItems = await Promise.all(
        merged.map(async (order) => {
          const { data: items } = await supabase
            .from('lab_exam_order_items')
            .select('*')
            .eq('order_id', order.id);
          return {
            ...order,
            items: (items ?? []).map((item) => ({
              id: item.id,
              exam_id: item.exam_id,
              exam_code: item.exam_code,
              exam_name: item.exam_name,
              price: item.price,
              status: item.status,
            })),
          };
        })
      );
      return ordersWithItems as LabExamOrder[];
    } catch (error: any) {
      console.error('Error al obtener órdenes por rango de fecha de toma:', error);
      return [];
    }
  },

  /**
   * Reporte de laboratorio por BD: órdenes pagadas en el rango con utilidad calculada
   * (ingreso - costo exámenes - costo procedimiento Toma de muestra).
   */
  async getReportLaboratorio(fromDate: string, toDate: string): Promise<{
    totals: { total_orders: number; total_revenue: number; total_exams: number; total_cost: number; total_utility: number };
    rows: Array<{ id: string; order_date: string; physician_name: string | null; patient_name: string | null; status: string; n_items: number; total_amount: number; cost: number; utility: number }>;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_report_laboratorio', {
        p_from: fromDate,
        p_to: toDate,
      });
      if (error) throw error;
      const raw = (data as { totals?: unknown; rows?: unknown }) ?? {};
      const totals = (raw.totals as Record<string, number>) ?? {};
      const rows = (raw.rows as Array<Record<string, unknown>>) ?? [];
      return {
        totals: {
          total_orders: Number(totals.total_orders ?? 0),
          total_revenue: Number(totals.total_revenue ?? 0),
          total_exams: Number(totals.total_exams ?? 0),
          total_cost: Number(totals.total_cost ?? 0),
          total_utility: Number(totals.total_utility ?? 0),
        },
        rows: rows.map((r) => ({
          id: String(r.id ?? ''),
          order_date: String(r.order_date ?? ''),
          physician_name: r.physician_name != null ? String(r.physician_name) : null,
          patient_name: r.patient_name != null ? String(r.patient_name) : null,
          status: String(r.status ?? ''),
          n_items: Number(r.n_items ?? 0),
          total_amount: Number(r.total_amount ?? 0),
          cost: Number(r.cost ?? 0),
          utility: Number(r.utility ?? 0),
        })),
      };
    } catch (e) {
      console.error('Error al obtener reporte de laboratorio por BD:', e);
      return {
        totals: { total_orders: 0, total_revenue: 0, total_exams: 0, total_cost: 0, total_utility: 0 },
        rows: [],
      };
    }
  },

  /** Ingresos totales de órdenes con order_date en el rango y payment_status = 'Pagado'. */
  async getMonthlyRevenue(fromDate: string, toDate: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('lab_exam_orders')
        .select('total_amount')
        .gte('order_date', fromDate)
        .lte('order_date', toDate)
        .eq('payment_status', 'Pagado');
      if (error) throw error;
      return (data ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
    } catch (error: any) {
      console.error('Error al obtener ingresos de laboratorio:', error);
      return 0;
    }
  },
};

export default labOrderService;

