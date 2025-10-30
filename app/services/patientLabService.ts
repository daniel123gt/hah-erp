import supabase from "~/utils/supabase";
import { type LabExamOrder } from "./labOrderService";

/**
 * Servicio para que los pacientes vean SOLO sus órdenes de laboratorio
 * RLS en Supabase garantiza que solo vean sus propios datos
 */
export const patientLabService = {
  /**
   * Obtiene todas las órdenes del paciente autenticado
   */
  async getMyOrders(): Promise<LabExamOrder[]> {
    try {
      // Obtener el email del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('Usuario no autenticado');
      }

      // Buscar el paciente por email
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (patientError || !patient) {
        throw new Error('Paciente no encontrado');
      }

      // Obtener las órdenes del paciente (RLS asegura que solo vea las suyas)
      const { data: orders, error: ordersError } = await supabase
        .from('lab_exam_orders')
        .select('*')
        .eq('patient_id', patient.id)
        .order('order_date', { ascending: false });

      if (ordersError) throw ordersError;

      // Obtener los items de cada orden
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
            }))
          } as LabExamOrder;
        })
      );

      return ordersWithItems;
    } catch (error: any) {
      console.error('Error al obtener órdenes del paciente:', error);
      throw new Error(error?.message || 'Error al obtener tus órdenes');
    }
  },

  /**
   * Obtiene una orden específica del paciente
   */
  async getMyOrderById(orderId: string): Promise<LabExamOrder | null> {
    try {
      const orders = await this.getMyOrders();
      return orders.find(order => order.id === orderId) || null;
    } catch (error: any) {
      console.error('Error al obtener orden:', error);
      throw new Error(error?.message || 'Error al obtener la orden');
    }
  },

  /**
   * Obtiene la información del paciente autenticado
   */
  async getMyProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('Usuario no autenticado');
      }

      const { data: patient, error } = await supabase
        .from('patients')
        .select('id, nombre, apellido_paterno, apellido_materno, email, dni')
        .eq('email', user.email)
        .single();

      if (error) throw error;
      return patient;
    } catch (error: any) {
      console.error('Error al obtener perfil:', error);
      throw new Error(error?.message || 'Error al obtener tu perfil');
    }
  }
};

