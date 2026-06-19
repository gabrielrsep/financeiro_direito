interface Payment {
    id?: number
    type: 'charge' | 'payment'
    value_paid: number
    payment_date?: string
    movement_date?: string
    process_id?: number
    client_id?: number
    service_id?: number
    description?: string
}