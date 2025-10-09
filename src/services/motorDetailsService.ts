import { supabase } from '../lib/supabase'

export interface MotorDetailsItem {
  item_id: string
  item_description: string
  work_group: string | null
  price: number
  quantity: number
  document_number: string | null
  item_status: string
}

export interface MotorDetails {
  motor_id: string
  motor_service_description: string
  position_in_reception: number
  reception_number: string | null
  reception_date: string
  counterparty_name: string
  subdivision_name: string | null
  motor_inventory_number: string | null
  items: MotorDetailsItem[]
}

export const getMotorDetails = async (motorId: string): Promise<MotorDetails | null> => {
  const { data, error } = await supabase
    .from('accepted_motors')
    .select(`
      id,
      motor_service_description,
      position_in_reception,
      motor_inventory_number,
      receptions!inner (
        reception_number,
        reception_date,
        counterparties!inner (
          name
        )
      ),
      subdivisions (
        name
      ),
      reception_items!inner (
        id,
        item_description,
        work_group,
        price,
        quantity,
        upd_documents (
          document_number,
          status
        )
      )
    `)
    .eq('id', motorId)
    .single()

  if (error) {
    throw new Error(`Ошибка загрузки данных о двигателе: ${error.message}`)
  }

  if (!data) {
    return null
  }

  const reception = Array.isArray(data.receptions) ? data.receptions[0] : data.receptions
  const counterparty = Array.isArray(reception?.counterparties)
    ? reception.counterparties[0]
    : reception?.counterparties
  const subdivision = Array.isArray(data.subdivisions)
    ? data.subdivisions[0]
    : data.subdivisions

  const items: MotorDetailsItem[] = (Array.isArray(data.reception_items)
    ? data.reception_items
    : [data.reception_items]
  ).map((item: any) => {
    const updDoc = Array.isArray(item.upd_documents)
      ? item.upd_documents[0]
      : item.upd_documents

    return {
      item_id: item.id,
      item_description: item.item_description,
      work_group: item.work_group,
      price: item.price,
      quantity: item.quantity,
      document_number: updDoc?.document_number || null,
      item_status: updDoc?.status || 'В работе',
    }
  })

  return {
    motor_id: data.id,
    motor_service_description: data.motor_service_description,
    position_in_reception: data.position_in_reception,
    motor_inventory_number: data.motor_inventory_number,
    reception_number: reception?.reception_number || null,
    reception_date: reception?.reception_date || '',
    counterparty_name: counterparty?.name || '',
    subdivision_name: subdivision?.name || null,
    items,
  }
}
