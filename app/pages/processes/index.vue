<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, Eye } from 'lucide-vue-next'
import ClientSelectionModal from '~/components/ClientSelectionModal.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToastStore } from '~/stores/toast'
import { formatCurrency } from '~/utils/formatters'

interface Client {
    id: number
    name: string
    document: string
}

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
    installments?: {
        count: number
        down_payment: number
        first_due_date: string
    }
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

const isDialogOpen = ref(false)
const isEditing = ref(false)
const isClientModalOpen = ref(false)
const selectedClientName = ref('') // To display selected customer name in form

const currentProcess = ref<Process>({
    id: undefined,
    client_id: null,
    process_number: '',
    tribunal: '',
    target: '',
    description: '',
    status: 'Ativo',
    value_charged: 0,
    payment_method: '',
})

watch(() => currentProcess.value.payment_method, (newMethod) => {
    if (newMethod !== 'em_conta') {
        currentProcess.value.installments = undefined
    } else if (!currentProcess.value.installments) {
        currentProcess.value.installments = {
            count: 1,
            down_payment: 0,
            first_due_date: new Date().toISOString().split('T')[0]!// Default to today
        }
    }
})

const openCreateModal = () => {
    isEditing.value = false
    selectedClientName.value = ''
    currentProcess.value = {
        id: undefined,
        client_id: null,
        process_number: '',
        tribunal: '',
        target: '',
        description: '',
        status: 'Ativo',
        value_charged: 0,
        payment_method: '',
        em_conta_details: ''
    }
    isDialogOpen.value = true
}

const openEditModal = (process: Process) => {
    isEditing.value = true
    isDialogOpen.value = true
    selectedClientName.value = process.client_name || ''
    currentProcess.value = process
}

const closeModal = () => {
    isDialogOpen.value = false
}

const openClientModal = () => {
    isClientModalOpen.value = true
    selectedClientName.value = ''
}

const onClientSelected = (client: Client) => {
    currentProcess.value.client_id = client.id
    selectedClientName.value = client.name
    // isClientModalOpen is closed by the component event usually, but we can double check
}

const saveProcess = async () => {
    try {
        if (!currentProcess.value.client_id) {
            toastStore.error('Selecione um cliente')
            return
        }
        if (isEditing.value && currentProcess.value.id) {
            await $fetch(`/api/processes/${currentProcess.value.id}`, {
                method: 'PUT',
                body: currentProcess.value
            })
            toastStore.success('Processo atualizado com sucesso')
        } else {
            await $fetch('/api/processes', {
                method: 'POST',
                body: currentProcess.value
            })
            toastStore.success('Processo criado com sucesso')
        }
        await refreshProcesses()
        closeModal()
    } catch (error: any) {
        toastStore.error(error.data?.message || error.message || 'Erro ao salvar processo')
    }
}

const deleteProcess = (id: number | undefined) => {
    if (!id) return
    processToDeleteId.value = id
    isDeleteModalOpen.value = true
}

const isDeleteModalOpen = ref(false)
const processToDeleteId = ref<number | null>(null)

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


</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Processos</h1>
                <p class="text-slate-500 dark:text-slate-400 mt-1">Gerencie os processos jurídicos do escritório.</p>
            </div>
            <button @click="openCreateModal"
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
                            <th class="h-10 px-4 align-middle">Tribunal</th>
                            <th class="h-10 px-4 align-middle">Status</th>
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
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ process.tribunal }}</td>
                            <td class="p-4 align-middle">
                                <span :class="{
                                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': process.status === 'Concluido',
                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': process.status === 'Ativo',
                                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400': process.status === 'Arquivado'
                                }" class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors">
                                    {{ process.status }}
                                </span>
                            </td>
                            <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ formatCurrency(process.value_charged) }}</td>
                            <td class="p-4 align-middle text-right space-x-2">
                                <NuxtLink :to="`/processes/${process.id}`"
                                    class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white h-8 w-8 text-slate-500 dark:text-slate-400">
                                    <Eye class="h-4 w-4" />
                                </NuxtLink>
                                <button @click="openEditModal(process)"
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

        <!-- Modal Backdrop -->
        <div v-if="isDialogOpen"
            class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            @click.self="closeModal">
            <!-- Modal Content -->
            <div
                class="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <div class="flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-white">
                            {{ isEditing ? 'Editar Processo' : 'Novo Processo' }}
                        </h3>
                        <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <X class="h-4 w-4" />
                        </button>
                    </div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                        {{ isEditing ? 'Atualize os detalhes do processo abaixo.' : 'Registre um novo processo no sistema.' }}
                    </p>
                </div>

                <div class="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain">
                    <div class="grid gap-2">
                        <label class="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">
                            Cliente
                        </label>
                        <div class="flex space-x-2">
                             <div class="flex-1 flex h-9 w-full items-center rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm">
                                 <span v-if="selectedClientName" class="text-slate-900 dark:text-white">{{ selectedClientName }}</span>
                                 <span v-else class="text-slate-400">Selecione um cliente...</span>
                             </div>
                             <button @click="openClientModal" type="button" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-slate-300 dark:border-slate-700 bg-transparent shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 h-9 w-9 text-slate-900 dark:text-white">
                                 <Search class="h-4 w-4" />
                             </button>
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <label for="process_number"
                            class="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Número
                            do Processo</label>
                        <input id="process_number" v-model="currentProcess.process_number"
                            class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white" />
                    </div>
                    <div class="grid gap-2">
                        <label for="tribunal"
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Tribunal</label>
                        <input id="tribunal" v-model="currentProcess.tribunal"
                            class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white" />
                    </div>
                    <div class="grid gap-2">
                        <label for="target"
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Contra Parte</label>
                        <input id="target" v-model="currentProcess.target"
                            class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white" />
                    </div>
                    <div class="grid gap-2">
                        <label for="status"
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Status</label>
                        <select id="status" v-model="currentProcess.status"
                            class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white">
                            <option value="Ativo">Ativo</option>
                            <option value="Concluido">Concluido</option>
                            <option value="Arquivado">Arquivado</option>
                        </select>
                    </div>
                    <div class="grid gap-2">
                        <label for="value_charged"
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Valor
                            Cobrado</label>
                        <input id="value_charged" type="number" v-model="currentProcess.value_charged"
                            class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white" />
                    </div>
                    <div v-if="!isEditing" class="grid gap-2">
                        <label for="payment_method" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">
                            Forma de Pagamento
                        </label>
                        <select 
                            id="payment_method" 
                            v-model="currentProcess.payment_method"
                            class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white"
                        >
                            <option value="em_conta">Parcelado Pelo Escritório</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="pix">PIX</option>
                            <option value="cartao">Cartão de Crédito</option>
                        </select>
                    </div>
                    <div v-else class="grid gap-2">
                        <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">
                            Forma de Pagamento
                        </label>
                        <div class="p-3 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <p class="text-sm text-slate-900 dark:text-white font-medium">
                                {{ formatPaymentMethod(currentProcess.payment_method) }}
                            </p>
                        </div>
                    </div>

                    <span v-if="currentProcess.payment_method === 'em_conta' && currentProcess.em_conta_details" class="block mt-2 text-sm text-slate-700 dark:text-slate-300 font-bold">
                        {{ formatPaymentDetails(currentProcess.em_conta_details) }}
                    </span>

                    <div class="grid gap-2">
                        <label for="description"
                            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Descrição</label>
                        <textarea id="description" v-model="currentProcess.description" rows="3"
                            class="flex w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white"></textarea>
                    </div>
                </div>

                <div class="flex items-center p-6 pt-0 justify-end space-x-2">
                    <button @click="closeModal"
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white h-9 px-4 py-2">
                        Cancelar
                    </button>
                    <button @click="saveProcess"
                        class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-900/90 dark:hover:bg-slate-200 h-9 px-4 py-2">
                        Salvar
                    </button>
                </div>
            </div>
        </div>

        <ClientSelectionModal 
            :isOpen="isClientModalOpen" 
            @close="isClientModalOpen = false" 
            @select="onClientSelected" 
        />

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
