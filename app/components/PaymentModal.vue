<script setup lang="ts">
import { ref } from 'vue'
import { X, DollarSign, Calendar } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

interface Props {
  isOpen: boolean
  processId: number | null
  clientId?: number | undefined
  processNumber: string
  clientName: string
  remainingValue: number
  paymentId?: number | null
}

const toastStore = useToastStore()

const props = defineProps<Props>()
const emit = defineEmits(['close', 'saved'])

const valuePaid = ref<number>(0)
const paymentDate = ref(new Date().toISOString().split('T')[0])

const closeModal = () => {
    valuePaid.value = 0
    emit('close')
}

// Pre-fill value if editing a payment
watch(() => props.isOpen, (isOpen) => {
    if (isOpen && props.paymentId) {
        valuePaid.value = props.remainingValue
    }
})

const savePayment = async () => {
    if (!props.processId && !props.clientId) return
    if (valuePaid.value <= 0) {
        toastStore.error('O valor pago deve ser maior que zero')
        return
    }

    if (valuePaid.value > props.remainingValue) {
        toastStore.error('O valor pago não pode ser maior que o saldo devedor')
        return
    }

    try {
        await $fetch('/api/payments', {
            method: 'POST',
            body: {
                id: props.paymentId,
                process_id: props.processId,
                client_id: props.clientId,
                value_paid: valuePaid.value,
                payment_date: paymentDate.value,
                status: 'Pago'
            }
        })
        emit('saved')
        closeModal()
    } catch (error) {
        console.error('Erro ao salvar pagamento:', error)
        toastStore.error('Erro ao salvar pagamento', true)
    }
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
</script>

<template>
    <div v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        @click.self="closeModal">
        <div class="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
            <div class="flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex justify-between items-center">
                    <h3 class="font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-white">
                        Adicionar Pagamento
                    </h3>
                    <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <X class="h-4 w-4" />
                    </button>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    <span v-if="processNumber">Processo: {{ processNumber }} | </span>Cliente: {{ clientName }}
                </p>
                <p class="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Saldo Devedor: {{ formatCurrency(remainingValue) }}
                </p>
            </div>

            <div class="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                <div class="grid gap-2">
                    <label for="value_paid" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Valor Pago
                    </label>
                    <div class="relative">
                        <DollarSign class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input id="value_paid" type="number" step="0.01" v-model="valuePaid"
                            class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white" 
                            placeholder="0,00" />
                    </div>
                </div>
                <div class="grid gap-2">
                    <label for="payment_date" class="text-sm font-medium leading-none text-slate-900 dark:text-white">
                        Data do Pagamento
                    </label>
                    <div class="relative">
                        <Calendar class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input id="payment_date" type="date" v-model="paymentDate"
                            class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white" />
                    </div>
                </div>
            </div>

            <div class="flex items-center p-6 pt-0 justify-end space-x-2">
                <button @click="closeModal"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-4 py-2 text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors">
                    Cancelar
                </button>
                <button @click="savePayment"
                    class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 h-9 px-4 py-2 shadow-sm transition-colors">
                    Confirmar Pagamento
                </button>
            </div>
        </div>
    </div>
</template>
