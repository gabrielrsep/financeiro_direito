export const getStatusClass = (status: string) => {
    switch (status) {
        case 'Concluido': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        case 'Ativo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        case 'Arquivado': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
}

export const formatPaymentMethod = (method: string) => {
    switch (method) {
        case 'cartao': return 'Cartão de Crédito'
        case 'dinheiro': return 'Dinheiro'
        case 'pix': return 'Pix'
        case 'em_conta': return 'Parcelado Pelo Escritório'
        default: return method
    }
}

export const formatPaymentDetails = (details: string) => {
    const [downPayment, installments] = details.split('+')
    const installmentsInfo = installments ? installments.split('x') : []
    
    const installmentsInfoText = installmentsInfo.length === 2 ? `${installmentsInfo[0]}x de    ${formatCurrency(Number(installmentsInfo[1]))}` : 'Sem parcelamento'

    if(downPayment === '0') {
        return installmentsInfoText 
    }
    return `${formatCurrency(Number(downPayment))} + ${installmentsInfoText}`
}