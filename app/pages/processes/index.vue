<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-vue-next'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToastStore } from '~/stores/toast'
import { formatCurrency } from '~/utils/formatters'

interface Process {
    id?: number
    client_id: number | null
    client_name?: string // Added by join in API
    process_number: string
    tribunal: string
    target: string
    description: string
    status: string
    value_charged: number
    payment_method: string
    em_conta_details?: string
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
    title: 'Processos'
})

const page = ref(1)
const limit = ref(10)
const searchQuery = ref('')
const showArchived = ref(false)

const queryParams = computed(() => ({
  page: page.value,
  limit: limit.value,
  search: searchQuery.value,
  showArchived: showArchived.value
}))

const { data, refresh: refreshProcesses } = await useFetch<ApiResponse>('/api/processes', {
    params: queryParams
})

const processes = computed(() => data.value?.data || [])
const total = computed(() => data.value?.meta?.total || 0)
const totalPages = computed(() => data.value?.meta?.totalPages || 1)

let searchTimeout: NodeJS.Timeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
  }, 300)
})

watch(showArchived, () => {
  page.value = 1
})

const toastStore = useToastStore()
const router = useRouter()

const isDeleteModalOpen = ref(false)
const processToDeleteId = ref<number | null>(null)

const deleteProcess = (id: number | undefined) => {
    if (!id) return
    processToDeleteId.value = id
    isDeleteModalOpen.value = true
}

const confirmDeleteProcess = async () => {
    if (!processToDeleteId.value) return
    try {
        await $fetch(`/api/processes/${processToDeleteId.value}`, { method: 'DELETE' as any })
        await refreshProcesses()
        toastStore.success('Processo excluído com sucesso')
    } catch (error) {
        toastStore.error('Erro ao excluir processo')
    } finally {
        isDeleteModalOpen.value = false
        processToDeleteId.value = null
    }
}
</script>>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Processos</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Gerencie os processos jurídicos do escritório.</p>
            </div>
            <button @click="router.push('/processes/new')"
                class="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
                <Plus class="mr-2 h-4 w-4" /> Novo Processo
            </button>
        </div>

        <!-- Actions Bar -->
        <div class="flex items-center space-x-2 bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div class="relative w-full max-w-sm">
                <Search class="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <input v-model="searchQuery" placeholder="Buscar por número ou cliente..."
                    class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 pl-8 text-slate-900 dark:text-white" />
            </div>

            <div class="flex items-center space-x-2 ml-4">
                <input 
                    type="checkbox" 
                    id="showArchived" 
                    v-model="showArchived"
                    class="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-transparent transition-colors"
                />
                <label for="showArchived" class="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Mostrar arquivados
                </label>
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
                            <th class="h-10 px-4 align-middle">Valor Cobrado</th>
                            <th class="h-10 px-4 align-middle text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                        <tr v-for="process in processes" :key="process.id"
                            class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td class="p-4 align-middle font-medium text-slate-900 dark:text-white">
                                <NuxtLink :to="`/processes/${process.id}`" class="hover:underline text-blue-600 dark:text-blue-400">
                                    {{ process.process_number }}
                                </NuxtLink>
                            </td>
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ process.client_name }}</td>
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ formatCurrency(process.value_charged) }}</td>
                            <td class="p-4 align-middle text-right space-x-2">
                                <NuxtLink :to="`/processes/${process.id}`"
                                    class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white h-8 w-8 text-slate-500 dark:text-slate-400">
                                    <Eye class="h-4 w-4" />
                                </NuxtLink>
                                <button @click="router.push(`/processes/${process.id}/edit`)"
                                    class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white h-8 w-8 text-slate-500 dark:text-slate-400">
                                    <Pencil class="h-4 w-4" />
                                </button>
                                <button @click="deleteProcess(process.id)"
                                    class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 h-8 w-8 text-red-500">
                                    <Trash2 class="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                        <tr v-if="processes.length === 0">
                            <td colspan="6" class="h-24 text-center text-slate-500 dark:text-slate-400">
                                Nenhum processo encontrado.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6 rounded-lg shadow-sm transition-colors">
            <div class="flex flex-1 justify-between sm:hidden">
                <button @click="page--" :disabled="page <= 1" class="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">Anterior</button>
                <button @click="page++" :disabled="page >= totalPages" class="relative ml-3 inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">Próximo</button>
            </div>
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

        <ConfirmModal 
            :isOpen="isDeleteModalOpen"
            title="Excluir Processo"
            message="Tem certeza que deseja excluir este processo? Esta ação não poderá ser desfeita."
            confirmLabel="Excluir"
            variant="danger"
            @close="isDeleteModalOpen = false"
            @confirm="confirmDeleteProcess"
        />
    </div>
</template>
