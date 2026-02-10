<script setup lang="ts">
import { computed } from 'vue'
import { 
    ArrowLeft, 
    Gavel, 
    User, 
    Phone,
    MapPin, 
    FileText, 
    CreditCard, 
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Target
} from 'lucide-vue-next'
import { getStatusClass } from '~/utils'


const route = useRoute()
const processId = route.params.id

interface Payment {
  id: number
  process_id: number
  value_paid: number
  payment_date: string
  status: string
  due_date: string
  created_at: string
}

interface ProcessDetails {
  id: number
  client_id: number
  process_number: string
  tribunal: string
  target: string
  description: string
  status: string
  value_charged: number
  payment_method: string
  created_at: string
  client_name: string
  client_document: string
  client_contact: string
  client_address: string
  payments: Payment[]
}

interface ApiResponse {
  success: boolean
  data: ProcessDetails
}

const { data: response, pending, error } = await useFetch<ApiResponse>(`/api/processes/${processId}`)

const process = computed(() => response.value?.data)

useHead({
    title: computed(() => `Processo ${process.value?.process_number || ''}`)
})

const totalPaid = computed(() => {
    if (!process.value?.payments) return 0
    return process.value.payments
        .filter(p => p.status === 'Pago')
        .reduce((acc, p) => acc + p.value_paid, 0)
})

const balance = computed(() => {
    if (!process.value) return 0
    return process.value.value_charged - totalPaid.value
})

const paymentProgress = computed(() => {
    if (!process.value || process.value.value_charged === 0) return 0
    return Math.min(Math.round((totalPaid.value / process.value.value_charged) * 100), 100)
})


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

        <div v-if="pending" class="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
            <p class="text-slate-500">Carregando detalhes do processo...</p>
        </div>

        <div v-else-if="error || !process" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-8 rounded-lg text-center">
            <h2 class="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Erro ao carregar processo</h2>
            <p class="text-red-600 dark:text-red-300">{{ error?.statusMessage || 'Processo não encontrado no sistema.' }}</p>
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
                            <div class="text-right">
                                <span class="text-xs font-medium text-slate-500 block">Progresso de Pagamento</span>
                                <span class="text-lg font-bold text-slate-900 dark:text-white transition-all">{{ paymentProgress }}%</span>
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-8 overflow-hidden">
                            <div 
                                class="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                                :style="{ width: `${paymentProgress}%` }"
                            ></div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <span class="text-xs text-slate-500 block mb-1">Valor Total Cobrado</span>
                                <span class="text-xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(process.value_charged) }}</span>
                            </div>
                            <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                <span class="text-xs text-emerald-600 dark:text-emerald-400 block mb-1">Total Recebido</span>
                                <span class="text-xl font-bold text-emerald-700 dark:text-emerald-400">{{ formatCurrency(totalPaid) }}</span>
                            </div>
                            <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                <span class="text-xs text-amber-600 dark:text-amber-400 block mb-1">Saldo Devedor</span>
                                <span class="text-xl font-bold text-amber-700 dark:text-amber-400">{{ formatCurrency(balance) }}</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 flex items-center justify-between px-2">
                             <span class="text-xs text-slate-400">Forma de Pagamento: </span>
                             <span class="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {{ process.payment_method === 'em_conta' ? 'Parcelado p/ Escritório' : process.payment_method?.toUpperCase() || 'N/A' }}
                             </span>
                        </div>
                    </div>

                    <!-- Payments Table -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <CreditCard class="w-4 h-4 mr-2" /> Histórico de Pagamentos
                            </h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                    <tr>
                                        <th class="px-6 py-3">Data Prevista</th>
                                        <th class="px-6 py-3">Valor</th>
                                        <th class="px-6 py-3">Status</th>
                                        <th class="px-6 py-3">Data Pagamento</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr v-for="payment in process.payments" :key="payment.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td class="px-6 py-4 flex items-center text-slate-600 dark:text-slate-300">
                                            <Calendar class="w-3.5 h-3.5 mr-2 text-slate-400" />
                                            {{ formatDate(payment.due_date) }}
                                        </td>
                                        <td class="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                            {{ formatCurrency(payment.value_paid) }}
                                        </td>
                                        <td class="px-6 py-4">
                                            <span v-if="payment.status === 'Pago'" class="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                                <CheckCircle2 class="w-3.5 h-3.5 mr-1" /> Pago
                                            </span>
                                            <span v-else class="inline-flex items-center text-amber-600 dark:text-amber-400 font-medium">
                                                <Clock class="w-3.5 h-3.5 mr-1" /> Pendente
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {{ payment.status === 'Pago' ? formatDate(payment.payment_date) : '-' }}
                                        </td>
                                    </tr>
                                    <tr v-if="process.payments.length === 0">
                                        <td colspan="4" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            Nenhum lançamento financeiro para este processo.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
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
