import supabase from "~/utils/supabase";

export interface LabExamOrderItem {
  id: string; // ID del item de la orden
  exam_id: string;
  exam_code: string;
  exam_name: string;
  price: number;
  status: 'Pendiente' | 'En Proceso' | 'Completado' | 'Cancelado';
}

export interface LabExamOrder {
  id: string;
  patient_id: string;
  order_date: string;
  physician_name?: string;
  priority: 'urgente' | 'normal' | 'programada';
  observations?: string;
  total_amount: number;
  status: 'Pendiente' | 'En Proceso' | 'Completado' | 'Cancelado';
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

      // Calcular el total (precio al cliente con recargo)
      const parsePrice = (precio: string) =>
        parseFloat(precio.replace('S/', '').replace(',', '').trim()) || 0;

      const RECARGO_TOTAL = 120;
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

  async updateOrderResult(orderId: string, data: {
    result_pdf_url?: string;
    result_date?: string;
    result_notes?: string;
    status?: 'Pendiente' | 'En Proceso' | 'Completado' | 'Cancelado';
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
  }
};

export default labOrderService;

