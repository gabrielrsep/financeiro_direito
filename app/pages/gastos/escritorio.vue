<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, ChevronLeft, ChevronRight, Building2, Plus, Trash2, CheckCircle2, Repeat } from 'lucide-vue-next'
import OfficeExpenseModal from '../../components/OfficeExpenseModal.vue'
import { useToast } from '../../components/AppToast.vue'

interface OfficeExpense {
    id: number
    description: string
    amount: number
    due_date: string
    status: string
    is_recurrent: number
}

interface ApiResponse<T> {
    success: boolean
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

useHead({
    title: 'Lei & $ - Gastos do Escritório'
})

const page = ref(1)
const limit = ref(10)
const searchQuery = ref('')

const queryParams = computed(() => ({
    page: page.value,
    limit: limit.value,
    search: searchQuery.value
}))

const { data, refresh: refreshExpenses } = await useFetch<ApiResponse<OfficeExpense>>('/api/office-expenses', {
    params: queryParams
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
const isModalOpen = ref(false)
const selectedExpense = ref<OfficeExpense | null>(null)

const openModal = (expense: OfficeExpense | null = null) => {
    selectedExpense.value = expense
    isModalOpen.value = true
}

const onSaved = () => {
    refreshExpenses()
    toast.success(selectedExpense.value ? 'Gasto atualizado com sucesso' : 'Gasto registrado com sucesso')
}

const markAsPaid = async (expense: OfficeExpense) => {
    try {
        await $fetch(`/api/office-expenses/${expense.id}`, {
            method: 'PATCH',
            body: { status: 'Pago' }
        })
        refreshExpenses()
        toast.success('Gasto marcado como pago')
    } catch (error) {
        toast.error('Erro ao atualizar status')
    }
}

const deleteExpense = async (expense: OfficeExpense) => {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) return

    try {
        await $fetch(`/api/office-expenses/${expense.id}`, {
            method: 'DELETE'
        })
        refreshExpenses()
        toast.success('Gasto excluído com sucesso')
    } catch (error) {
        toast.error('Erro ao excluir gasto')
    }
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}
</script>

<template>
    <div class="space-y-6">
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gastos do Escritório</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Acompanhe e gerencie as despesas administrativas.</p>
            </div>
            <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full transition-colors">
                <Building2 class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
        </div>

        <div class="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div class="relative w-full max-w-sm">
                <Search class="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <input v-model="searchQuery" placeholder="Buscar por descrição..."
                    class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 pl-8 text-slate-900 dark:text-white" />
            </div>
            <button @click="openModal()"
                class="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                <Plus class="mr-2 h-4 w-4" /> Novo Gasto
            </button>
        </div>

        <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
            <div class="w-full overflow-auto">
                <table class="w-full text-sm text-left">
                    <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th class="h-10 px-4 align-middle">Descrição</th>
                            <th class="h-10 px-4 align-middle">Valor</th>
                            <th class="h-10 px-4 align-middle">Vencimento</th>
                            <th class="h-10 px-4 align-middle">Status</th>
                            <th class="h-10 px-4 align-middle text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr v-for="expense in items" :key="expense.id"
                            class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td class="p-4 align-middle font-medium text-slate-900 dark:text-white transition-colors text-left">
                                <button @click="openModal(expense)" class="hover:underline flex items-center">
                                    {{ expense.description }}
                                    <span v-if="expense.is_recurrent" title="Gasto Recorrente" class="ml-2 text-blue-500/70">
                                        <Repeat class="h-3.5 w-3.5" />
                                    </span>
                                </button>
                            </td>
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400 transition-colors">{{ formatCurrency(expense.amount) }}</td>
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400 transition-colors">{{ formatDate(expense.due_date) }}</td>
                            <td class="p-4 align-middle">
                                <span :class="[
                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
                                    expense.status === 'Pago' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                                ]">
                                    {{ expense.status }}
                                </span>
                            </td>
                            <td class="p-4 align-middle text-right space-x-2">
                                <button v-if="expense.status !== 'Pago'"
                                    @click="markAsPaid(expense)"
                                    title="Marcar como pago"
                                    class="inline-flex items-center justify-center rounded-md text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 h-8 w-8 transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/50">
                                    <CheckCircle2 class="h-4 w-4" />
                                </button>
                                <button @click="deleteExpense(expense)"
                                    title="Excluir"
                                    class="inline-flex items-center justify-center rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 h-8 w-8 transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50">
                                    <Trash2 class="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                        <tr v-if="items.length === 0">
                            <td colspan="5" class="h-24 text-center text-slate-500 dark:text-slate-400">
                                Nenhum gasto do escritório encontrado.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6 rounded-lg shadow-sm transition-colors">
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-slate-700 dark:text-slate-300 transition-colors">
                        Mostrando <span class="font-medium text-slate-900 dark:text-white">{{ (page - 1) * limit + 1 }}</span> até <span class="font-medium text-slate-900 dark:text-white">{{ Math.min(page * limit, total) }}</span> de <span class="font-medium text-slate-900 dark:text-white">{{ total }}</span> resultados
                    </p>
                </div>
                <div>
                    <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button @click="page--" :disabled="page <= 1" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors">
                            <ChevronLeft class="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button @click="page++" :disabled="page >= totalPages" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors">
                            <ChevronRight class="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>

        <OfficeExpenseModal
            :isOpen="isModalOpen"
            :expense="selectedExpense"
            @close="isModalOpen = false"
            @saved="onSaved"
        />
    </div>
</template>
