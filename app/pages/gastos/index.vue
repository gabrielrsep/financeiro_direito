<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, ChevronLeft, ChevronRight, DollarSign, Wallet, CalendarDays, Trash2 } from 'lucide-vue-next'
import PaymentModal from '../../components/PaymentModal.vue'
import ConfirmModal from '../../components/ConfirmModal.vue'
import { useToast } from '../../components/AppToast.vue'

interface Process {
    id: number
    client_id: number
    client_name: string
    process_number: string
    value_charged: number
    total_paid: number
}

interface ApiResponse {
    success: boolean
    data: Process[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

useHead({
    title: 'Lei & $ - Contas a Receber'
})

const page = ref(1)
const limit = ref(10)
const searchQuery = ref('')

const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: searchQuery.value
}))

const { data, refresh: refreshGastos } = await useFetch<ApiResponse>('/api/gastos', {
    params: queryParams
})

// Scheduled Payments Section State
const scheduledMonth = ref(new Date().getMonth() + 1)
const scheduledYear = ref(new Date().getFullYear())

const scheduledQueryParams = computed(() => ({
    month: scheduledMonth.value,
    year: scheduledYear.value,
    search: searchQuery.value
}))

const { data: scheduledData, refresh: refreshScheduled } = await useFetch<any>('/api/gastos/scheduled', {
    params: scheduledQueryParams
})

const scheduledItems = computed(() => scheduledData.value?.data || [])

const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
]

const years = computed(() => {
    const currentYear = new Date().getFullYear()
    return [currentYear - 1, currentYear, currentYear + 1]
})

const items = computed(() => data.value?.data || [])
const total = computed(() => data.value?.meta?.total || 0)
const totalPages = computed(() => data.value?.meta?.totalPages || 1)

let searchTimeout: NodeJS.Timeout
watch(searchQuery, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        page.value = 1
    }, 300)
})

const toast = useToast()
const isPaymentModalOpen = ref(false)
const selectedProcess = ref<Process | null>(null)
const selectedPaymentId = ref<number | null>(null)
const selectedPaymentValue = ref<number>(0)

const openPaymentModal = (process: any, paymentId: number | null = null, paymentValue: number = 0) => {
    selectedProcess.value = {
        id: process.id || process.process_id,
        client_id: process.client_id,
        client_name: process.client_name,
        process_number: process.process_number,
        value_charged: process.value_charged,
        total_paid: process.total_paid
    }
    selectedPaymentId.value = paymentId
    selectedPaymentValue.value = paymentValue || getRemainingValue(selectedProcess.value)
    isPaymentModalOpen.value = true
}

const onPaymentSaved = () => {
    refreshGastos()
    refreshScheduled()
    toast.success('Pagamento registrado com sucesso')
}

const isDeleteModalOpen = ref(false)
const paymentToDelete = ref<number | null>(null)

const confirmDeletePayment = (paymentId: number) => {
    paymentToDelete.value = paymentId
    isDeleteModalOpen.value = true
}

const deletePayment = async () => {
    if (!paymentToDelete.value) return

    try {
        await $fetch('/api/payments', {
            method: 'DELETE',
            body: { id: paymentToDelete.value }
        })
        refreshGastos()
        refreshScheduled()
        toast.success('Pagamento agendado removido com sucesso')
    } catch (error) {
        console.error('Erro ao remover pagamento:', error)
        toast.error('Erro ao remover pagamento')
    } finally {
        isDeleteModalOpen.value = false
        paymentToDelete.value = null
    }
}

const isExpired = (date: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(date)
    return dueDate < today
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const getRemainingValue = (process: Process) => {
    return Math.max(0, process.value_charged - process.total_paid)
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Contas a Receber</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Gerencie os pagamentos pendentes de processos parcelados.</p>
            </div>
            <div class="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-full transition-colors">
                <Wallet class="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
        </div>

        <!-- Actions Bar -->
        <div class="flex items-center space-x-2 bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div class="relative w-full max-w-sm">
                <Search class="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <input v-model="searchQuery" placeholder="Buscar por número ou cliente..."
                    class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 pl-8 text-slate-900 dark:text-white" />
            </div>
        </div>

        <!-- Table -->
        <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
            <div class="w-full overflow-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th class="h-10 px-4 align-middle">Número do Processo</th>
                            <th class="h-10 px-4 align-middle">Cliente</th>
                            <th class="h-10 px-4 align-middle">Valor Total</th>
                            <th class="h-10 px-4 align-middle text-green-700 dark:text-green-400">Valor Pago</th>
                            <th class="h-10 px-4 align-middle text-amber-700 dark:text-amber-400">Saldo Devedor</th>
                            <th class="h-10 px-4 align-middle text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr v-for="process in items" :key="process.id"
                            class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td class="p-4 align-middle font-medium text-slate-900 dark:text-white">{{ process.process_number }}</td>
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ process.client_name }}</td>
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ formatCurrency(process.value_charged) }}</td>
                            <td class="p-4 align-middle text-green-600 dark:text-green-400 font-medium">{{ formatCurrency(process.total_paid) }}</td>
                            <td class="p-4 align-middle text-amber-600 dark:text-amber-400 font-bold">
                                {{ formatCurrency(getRemainingValue(process)) }}
                            </td>
                            <td class="p-4 align-middle text-right">
                                <button @click="openPaymentModal(process)"
                                    :disabled="getRemainingValue(process) <= 0"
                                    class="inline-flex items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200 dark:border-emerald-800">
                                    <DollarSign class="mr-1 h-3 w-3" /> Receber
                                </button>
                            </td>
                        </tr>
                        <tr v-if="items.length === 0">
                            <td colspan="6" class="h-24 text-center text-slate-500 dark:text-slate-400">
                                Nenhum processo com pagamento pendente encontrado.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6 rounded-lg shadow-sm transition-colors">
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-slate-700 dark:text-slate-300">
                        Mostrando <span class="font-medium text-slate-900 dark:text-white">{{ (page - 1) * limit + 1 }}</span> até <span class="font-medium text-slate-900 dark:text-white">{{ Math.min(page * limit, total) }}</span> de <span class="font-medium text-slate-900 dark:text-white">{{ total }}</span> resultados
                    </p>
                </div>
                <div>
                    <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button @click="page--" :disabled="page <= 1" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors">
                            <span class="sr-only">Anterior</span>
                            <ChevronLeft class="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button @click="page++" :disabled="page >= totalPages" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors">
                            <span class="sr-only">Próximo</span>
                            <ChevronRight class="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>

        <!-- Scheduled Payments Section -->
        <div class="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <CalendarDays class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Pagamentos Agendados</h2>
                </div>
                <div class="flex items-center space-x-2">
                    <select v-model="scheduledMonth" 
                        class="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-white">
                        <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
                    </select>
                    <select v-model="scheduledYear" 
                        class="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-slate-300 text-slate-900 dark:text-white">
                        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                    </select>
                </div>
            </div>

            <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
                <div class="w-full overflow-auto">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th class="h-10 px-4 align-middle">Vencimento</th>
                                <th class="h-10 px-4 align-middle">Número do Processo</th>
                                <th class="h-10 px-4 align-middle">Cliente</th>
                                <th class="h-10 px-4 align-middle">Valor da Parcela</th>
                                <th class="h-10 px-4 align-middle text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            <tr v-for="item in scheduledItems" :key="item.payment_id"
                                class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td class="p-4 align-middle text-slate-600 dark:text-slate-400">
                                    {{ new Date(item.due_date).toLocaleDateString('pt-BR') }}
                                </td>
                                <td class="p-4 align-middle font-medium text-slate-900 dark:text-white">{{ item.process_number }}</td>
                                <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ item.client_name }}</td>
                                <td class="p-4 align-middle text-amber-600 dark:text-amber-400 font-bold">
                                    {{ formatCurrency(item.value_due) }}
                                </td>
                                <td class="p-4 align-middle text-right flex justify-end space-x-2">
                                    <button @click="openPaymentModal(item, item.payment_id, item.value_due)"
                                        class="inline-flex items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors focus:ring-2 focus:ring-emerald-500 border border-emerald-200 dark:border-emerald-800">
                                        <DollarSign class="mr-1 h-3 w-3" /> Receber
                                    </button>
                                    <button v-if="!isExpired(item.due_date)"
                                        @click="confirmDeletePayment(item.payment_id)"
                                        class="inline-flex items-center justify-center rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors focus:ring-2 focus:ring-red-500 border border-red-200 dark:border-red-800"
                                        title="Remover agendamento">
                                        <Trash2 class="h-3 w-3" />
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="scheduledItems.length === 0">
                                <td colspan="5" class="h-24 text-center text-slate-500 dark:text-slate-400">
                                    Nenhum pagamento agendado para este período.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <PaymentModal 
            :isOpen="isPaymentModalOpen"
            :processId="selectedProcess?.id || null"
            :paymentId="selectedPaymentId"
            :processNumber="selectedProcess?.process_number || ''"
            :clientName="selectedProcess?.client_name || ''"
            :remainingValue="selectedPaymentValue"
            @close="isPaymentModalOpen = false"
            @saved="onPaymentSaved"
        />

        <ConfirmModal 
            :isOpen="isDeleteModalOpen"
            title="Remover Agendamento"
            message="Tem certeza que deseja remover este pagamento agendado? Esta ação não poderá ser desfeita."
            confirmLabel="Remover"
            variant="danger"
            @close="isDeleteModalOpen = false"
            @confirm="deletePayment"
        />
    </div>
</template>
