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

interface Process {
    id: number
    client_id: number
    process_number: string
    tribunal: string
    target: string
    description: string
    status: string
    value_charged: string
    payment_method: string
}