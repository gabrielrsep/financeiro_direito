export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR')
}
