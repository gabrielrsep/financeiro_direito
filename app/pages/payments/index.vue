<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight, X, Calendar, User, Undo2, Trash2 } from 'lucide-vue-next'
import ClientSelectionModal from '~/components/ClientSelectionModal.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { formatCurrency, formatDate } from '~/utils/formatters'

useHead({
    title: 'Lei & $ - Histórico de Pagamentos'
})

interface Client {
    id: number
    name: string
    document: string
}

interface Payment {
    id: number
    value_paid: number
    payment_date: string
    status: string
    client_name: string
    process_number: string
    created_at: string
}

interface ApiResponse {
    success: boolean
    data: Payment[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

const page = ref(1)
const limit = ref(10)
const startDate = ref('')
const endDate = ref('')
const selectedClientId = ref<string>('')
const selectedClientName = ref('')
const status = ref('Pendente')

const isClientModalOpen = ref(false)
const showConfirmDelete = ref(false)
const paymentToDelete = ref<number | null>(null)
const isDeleting = ref(false)

const queryParams = computed(() => {
    const params: any = {
        page: page.value,
        limit: limit.value
    }
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    if (selectedClientId.value) params.clientId = selectedClientId.value
    if (status.value) params.status = status.value
    return params
})

const { data, refresh } = await useFetch<ApiResponse>('/api/payments/history', {
    params: queryParams,
    watch: [page] // Auto refresh on page change
})

const payments = computed(() => data.value?.data || [])
const total = computed(() => data.value?.meta?.total || 0)
const totalPages = computed(() => data.value?.meta?.totalPages || 1)

// Watch filters to reset page
watch([startDate, endDate, selectedClientId, status], () => {
    page.value = 1
    refresh() // Explicit refresh for filters
})

const openClientModal = () => {
    isClientModalOpen.value = true
}

const onClientSelected = (client: Client) => {
    selectedClientId.value = client.id.toString()
    selectedClientName.value = client.name
}

const clearClientFilter = () => {
    selectedClientId.value = ''
    selectedClientName.value = ''
}

const clearFilters = () => {
    startDate.value = ''
    endDate.value = ''
    clearClientFilter()
    status.value = ''
}

const handleDeleteClick = (id: number) => {
    paymentToDelete.value = id
    showConfirmDelete.value = true
}

const confirmDelete = async () => {
    if (!paymentToDelete.value) return

    isDeleting.value = true
    try {
        await $fetch('/api/payments', {
            method: 'DELETE',
            body: { id: paymentToDelete.value }
        })
        
        // Show success toast (TODO: Use a proper toast system if available, but for now refresh is key)
        // Since we don't have a global toast function exposed here easily without looking deeper, 
        // effectively the UI update is the most important.
        
        refresh()
        showConfirmDelete.value = false
        paymentToDelete.value = null
    } catch (error) {
        console.error('Failed to delete payment:', error)
        // Ideally show error toast
    } finally {
        isDeleting.value = false
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Histórico de Pagamentos</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Visualize todos os pagamentos recebidos.</p>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors space-y-4">
            <div class="flex flex-wrap items-center gap-4">
                
                <!-- Date Range -->
                <div class="flex items-center space-x-2">
                    <div class="relative">
                         <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar class="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="date" v-model="startDate" 
                            class="pl-10 flex h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white"
                            placeholder="Data Inicial" />
                    </div>
                    <span class="text-slate-400">-</span>
                    <div class="relative">
                         <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar class="h-4 w-4 text-slate-400" />
                        </div>
                        <input type="date" v-model="endDate" 
                            class="pl-10 flex h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white"
                            placeholder="Data Final" />
                    </div>
                </div>

                <!-- Client Filter -->
                <div class="relative flex items-center">
                    <button @click="openClientModal" 
                        class="flex items-center h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent text-sm shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white min-w-[200px] justify-between">
                        <span v-if="selectedClientName" class="truncate max-w-[180px]">{{ selectedClientName }}</span>
                        <span v-else class="text-slate-500 dark:text-slate-400 flex items-center">
                            <User class="h-4 w-4 mr-2" />
                            Filtrar por Cliente
                        </span>
                    </button>
                    <button v-if="selectedClientId" @click="clearClientFilter" class="ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X class="h-4 w-4" />
                    </button>
                </div>

                <!-- Status Filter -->
                <div class="relative">
                    <select v-model="status" 
                        class="flex h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white min-w-[150px]">
                        <option value="">Todos os Status</option>
                        <option value="Pago">Pago</option>
                        <option value="Pendente">Pendente</option>
                    </select>
                </div>

                <!-- Clear Filters -->
                <button v-if="startDate || endDate || selectedClientId || status" @click="clearFilters" 
                    class="text-sm text-red-500 hover:text-red-700 font-medium transition-colors flex items-center ml-auto md:ml-0">
                    <X class="h-4 w-4 mr-1" />
                    Limpar Filtros
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
            <div class="w-full overflow-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th class="h-10 px-4 align-middle">Data</th>
                            <th class="h-10 px-4 align-middle">Cliente</th>
                            <th class="h-10 px-4 align-middle">Processo</th>
                            <th class="h-10 px-4 align-middle">Valor</th>
                            <th class="h-10 px-4 align-middle">Status</th>
                            <th class="h-10 px-4 align-middle w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr v-for="payment in payments" :key="payment.id"
                            class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400">
                                {{ formatDate(payment.payment_date) }}
                            </td>
                            <td class="p-4 align-middle text-slate-900 dark:text-white font-medium">
                                {{ payment.client_name }}
                            </td>
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400">
                                {{ payment.process_number || '-' }}
                            </td>
                            <td class="p-4 align-middle text-slate-900 dark:text-white font-medium">
                                {{ formatCurrency(payment.value_paid) }}
                            </td>
                            <td class="p-4 align-middle">
                                <span :class="{
                                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': payment.status === 'Pago',
                                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400': payment.status === 'Pendente'
                                }" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors">
                                    {{ payment.status }}
                                </span>
                            </td>
                            <td class="p-4 align-middle text-right">
                                <button @click="handleDeleteClick(payment.id)" 
                                    class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    :title="payment.status === 'Pendente' ? 'Excluir Pagamento' : 'Desfazer Pagamento'">
                                    <Trash2 v-if="payment.status === 'Pendente'" class="h-4 w-4" />
                                    <Undo2 v-else class="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                        <tr v-if="payments.length === 0">
                            <td colspan="6" class="h-24 text-center text-slate-500 dark:text-slate-400">
                                Nenhum pagamento encontrado.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6 rounded-lg shadow-sm transition-colors" v-if="total > 0">
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-slate-700 dark:text-slate-300">
                        Mostrando <span class="font-medium text-slate-900 dark:text-white">{{ (page - 1) * limit + 1 }}</span> até <span class="font-medium text-slate-900 dark:text-white">{{ Math.min(page * limit, total) }}</span> de <span class="font-medium text-slate-900 dark:text-white">{{ total }}</span> resultados
                    </p>
                </div>
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

        <ClientSelectionModal 
            :isOpen="isClientModalOpen" 
            @close="isClientModalOpen = false" 
            @select="onClientSelected" 
        />

        <ConfirmModal
            :isOpen="showConfirmDelete"
            title="Desfazer Pagamento"
            message="Tem certeza que deseja desfazer este pagamento? Esta ação removerá o registro permanentemente do histórico."
            confirmLabel="Sim, desfazer"
            cancelLabel="Cancelar"
            variant="danger"
            @close="showConfirmDelete = false"
            @confirm="confirmDelete"
        />
    </div>
</template>
