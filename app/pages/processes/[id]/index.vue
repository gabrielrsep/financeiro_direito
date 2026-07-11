<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
    ArrowLeft, 
    Gavel, 
    User, 
    Phone,
    MapPin, 
    FileText,
    DollarSign,
    Target,
    Pencil,
    Trash2
} from 'lucide-vue-next'
import { getStatusClass } from '~/utils'
import { useToastStore } from '~/stores/toast'
import { formatCurrency } from '~/utils/formatters'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()
const processId = route.params.id as string

interface ProcessDetails extends Process {
  total_paid: string
  client_name: string
  client_document: string
  client_address: string
  is_fully_paid: boolean
  client_contact: string
  payments: Payment[]
}

interface ApiResponse {
  success: boolean
  data: ProcessDetails
}

const showPaymentModal = ref(false)
const showConfirmDelete = ref(false)

const { data: response, error, refresh } = await useFetch<ApiResponse>(`/api/processes/${processId}`)

const process = computed(() => response.value?.data)

useHead({
    title: computed(() => `Processo ${process.value?.process_number || ''}`)
})

const balance = computed(() => {
    if (!process.value) return 0
    return Number(process.value.value_charged) - Number(process.value.total_paid)
})

const deleteProcess = async () => {
    try {
        await $fetch(`/api/processes/${processId}`, {
            method: 'DELETE'
        })
        toastStore.success('Processo deletado com sucesso')
        router.push('/processes')
    } catch (error) {
        toastStore.error('Erro ao deletar processo')
    } finally {
        showConfirmDelete.value = false
    }
}
</script>

<template>
    <div class="max-w-7xl mx-auto space-y-6 pb-12">
        <!-- Breadcrumb / Back Navigation -->
        <div class="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <NuxtLink to="/processes" class="hover:text-slate-900 dark:hover:text-white flex items-center transition-colors">
                <ArrowLeft class="w-4 h-4 mr-1" />
                Voltar para Processos
            </NuxtLink>
        </div>

        <div v-if="error || !process" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-8 rounded-lg text-center">
            <h2 class="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Erro ao carregar processo</h2>
            <p class="text-red-600 dark:text-red-300">{{ error?.message || 'Processo não encontrado no sistema.' }}</p>
            <NuxtLink to="/processes" class="mt-4 inline-block text-sm font-medium underline">Retornar à lista</NuxtLink>
        </div>

        <template v-else>
            <!-- Header Section -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden relative">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-start space-x-4">
                        <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hidden sm:block">
                            <Gavel class="w-8 h-8 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span :class="getStatusClass(process.status)" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                    {{ process.status }}
                                </span>
                                <span class="text-xs text-slate-400 font-mono">#{{ process.id }}</span>
                            </div>
                            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {{ process.process_number }}
                            </h1>
                            <p class="text-slate-500 dark:text-slate-400 flex items-center mt-1">
                                <MapPin class="w-3.5 h-3.5 mr-1" /> {{ process.tribunal || 'Tribunal não informado' }}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button
                            @click="router.push(`/processes/${process.id}/edit`)"
                            class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Pencil class="w-4 h-4" />
                            Editar
                        </button>
                        <button
                            @click="showConfirmDelete = true"
                            class="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Trash2 class="w-4 h-4" />
                            Deletar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main Info (Left Column) -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Description Card -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                            <FileText class="w-4 h-4 mr-2" /> Detalhes da Ação
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-1">Contra Parte</label>
                                <p class="text-slate-900 dark:text-white font-medium text-lg flex items-center">
                                    <Target class="w-4 h-4 mr-2 text-slate-400" />
                                    {{ process.target || '-' }}
                                </p>
                            </div>
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-1">Tribunal / Comarca</label>
                                <p class="text-slate-900 dark:text-white font-medium">{{ process.tribunal || '-' }}</p>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-slate-400 block mb-1">Descrição do Caso</label>
                            <div class="text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 whitespace-pre-wrap leading-relaxed">
                                {{ process.description || 'Nenhuma descrição detalhada fornecida.' }}
                            </div>
                        </div>
                    </div>

                    <!-- Financial Summary Card -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <DollarSign class="w-4 h-4 mr-2" /> Resumo Financeiro
                            </h3>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <span class="text-xs text-slate-500 block mb-1">Valor Total Cobrado</span>
                                <span class="text-xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(Number(process.value_charged)) }}</span>
                            </div>
                            <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                <span class="text-xs text-emerald-600 dark:text-emerald-400 block mb-1">Total Recebido</span>
                                <span class="text-xl font-bold text-emerald-700 dark:text-emerald-400">{{ formatCurrency(Number(process.total_paid)) }}</span>
                            </div>
                            <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                <span class="text-xs text-amber-600 dark:text-amber-400 block mb-1">Saldo Devedor</span>
                                <span class="text-xl font-bold text-amber-700 dark:text-amber-400">{{ formatCurrency(balance) }}</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 flex items-center justify-between px-2">
                             <span class="text-xs text-slate-400">Forma de Pagamento: </span>
                             <span class="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {{ process.payment_method?.toUpperCase() || 'N/A' }}
                             </span>
                        </div>
                    </div>

                    <!-- Payments Table -->
                    <PaymentHistory :payments="process.payments" :isFullyPaid="process.is_fully_paid" @action="showPaymentModal = true"/>
                </div>

                <!-- Sidebar (Right Column) -->
                <div class="space-y-6">
                    <!-- Client Card -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-6">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <User class="w-4 h-4 mr-2" /> Informações do Cliente
                            </h3>
                        </div>
                        
                        <div class="flex flex-col items-center mb-6 text-center">
                            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                <User class="w-8 h-8 text-slate-500" />
                            </div>
                            <h4 class="text-xl font-bold text-slate-900 dark:text-white line-clamp-2">
                                {{ process.client_name }}
                            </h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                                DOC: {{ process.client_document }}
                            </p>
                        </div>

                        <div class="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                            <div class="flex items-start">
                                <Phone class="w-4 h-4 mt-0.5 mr-3 text-slate-400 shrink-0" />
                                <div>
                                    <span class="text-xs text-slate-400 block">Contato</span>
                                    <p class="text-sm text-slate-900 dark:text-white">{{ process.client_contact || 'Não cadastrado' }}</p>
                                </div>
                            </div>
                            
                            <div class="flex items-start">
                                <MapPin class="w-4 h-4 mt-0.5 mr-3 text-slate-400 shrink-0" />
                                <div>
                                    <span class="text-xs text-slate-400 block">Endereço</span>
                                    <p class="text-sm text-slate-600 dark:text-slate-300 leading-snug">
                                        {{ process.client_address || 'Endereço não disponível' }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Secondary Actions -->
                        <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                             <NuxtLink 
                                :to="`/clients/${process.client_id}`" 
                                class="w-full inline-flex items-center justify-center p-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                             >
                                <User class="w-4 h-4 mr-2" />
                                Abrir cadastro do cliente
                             </NuxtLink>
                        </div>
                    </div>
                </div>
            </div>

            <PaymentModal
                :isOpen="showPaymentModal"
                :processId="process.id"
                :clientName="process.client_name"
                :remainingValue="balance"
                :processNumber="process.process_number"
                @close="showPaymentModal = false"
                @saved="refresh(); showPaymentModal = false"
            />
            <!-- Confirm Delete Modal -->
            <ConfirmModal 
                :isOpen="showConfirmDelete"
                title="Excluir Processo"
                message="Tem certeza que deseja excluir este processo? Esta ação não poderá ser desfeita."
                confirmLabel="Excluir"
                variant="danger"
                @close="showConfirmDelete = false"
                @confirm="deleteProcess"
            />
        </template>
    </div>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
