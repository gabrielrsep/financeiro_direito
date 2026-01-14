<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
    ArrowLeft, 
    User, 
    Phone, 
    MapPin, 
    FileText, 
    Gavel,
    DollarSign,
    CreditCard,
    CheckCircle2,
    Clock,
    Calendar,
    ExternalLink
} from 'lucide-vue-next'

const route = useRoute()
const clientId = route.params.id

interface Process {
  id: number
  process_number: string
  tribunal: string
  status: string
  value_charged: number
  payment_method: string
  created_at: string
}

interface Financial {
  total_charged: number
  total_paid: number
  balance: number
}

interface ClientDetails {
  id: number
  name: string
  document: string
  contact: string
  address: string
  created_at: string
  processes: Process[]
  financial: Financial
}

interface ApiResponse {
  success: boolean
  data: ClientDetails
}

const { data: response, pending, error } = await useFetch<ApiResponse>(`/api/clients/${clientId}`)

const client = computed(() => response.value?.data)

useHead({
    title: computed(() => `${client.value?.name || 'Cliente'} - Detalhes - Lei & $`)
})

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Concluido': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        case 'Ativo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        case 'Arquivado': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
}
</script>

<template>
    <div class="max-w-7xl mx-auto space-y-6 pb-12">
        <!-- Breadcrumb / Back Navigation -->
        <div class="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <NuxtLink to="/clients" class="hover:text-slate-900 dark:hover:text-white flex items-center transition-colors">
                <ArrowLeft class="w-4 h-4 mr-1" />
                Voltar para Clientes
            </NuxtLink>
        </div>

        <div v-if="pending" class="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
            <p class="text-slate-500">Carregando detalhes do cliente...</p>
        </div>

        <div v-else-if="error || !client" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-8 rounded-lg text-center">
            <h2 class="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Erro ao carregar cliente</h2>
            <p class="text-red-600 dark:text-red-300">{{ error?.statusMessage || 'Cliente não encontrado no sistema.' }}</p>
            <NuxtLink to="/clients" class="mt-4 inline-block text-sm font-medium underline">Retornar à lista</NuxtLink>
        </div>

        <template v-else>
            <!-- Header Section -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden relative">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-start space-x-4">
                        <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hidden sm:block">
                            <User class="w-8 h-8 text-slate-900 dark:text-white" />
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs text-slate-400 font-mono">#{{ client.id }}</span>
                                <span class="text-xs text-slate-400">• Cliente desde {{ formatDate(client.created_at) }}</span>
                            </div>
                            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {{ client.name }}
                            </h1>
                            <p class="text-slate-500 dark:text-slate-400 flex items-center mt-1">
                                <FileText class="w-3.5 h-3.5 mr-1" /> {{ client.document }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dashboard Style Metrics -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Contratado</span>
                        <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Gavel class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-slate-900 dark:text-white">
                        {{ formatCurrency(client.financial.total_charged) }}
                    </div>
                    <p class="text-xs text-slate-400 mt-2">{{ client.processes.length }} processos ativos</p>
                </div>

                <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pago</span>
                        <div class="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <DollarSign class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {{ formatCurrency(client.financial.total_paid) }}
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-4 overflow-hidden">
                        <div 
                            class="bg-emerald-500 h-full transition-all duration-1000"
                            :style="{ width: `${client.financial.total_charged > 0 ? (client.financial.total_paid / client.financial.total_charged) * 100 : 0}%` }"
                        ></div>
                    </div>
                </div>

                <div class="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-slate-500 dark:text-slate-400">Saldo Devedor</span>
                        <div class="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <CreditCard class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {{ formatCurrency(client.financial.balance) }}
                    </div>
                    <p class="text-xs text-slate-400 mt-2">Pendente de liquidação</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main Content (Left) -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Processes List -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div class="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <Gavel class="w-4 h-4 mr-2" /> Processos do Cliente
                            </h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                    <tr>
                                        <th class="px-6 py-3">Número</th>
                                        <th class="px-6 py-3">Tribunal</th>
                                        <th class="px-6 py-3">Valor</th>
                                        <th class="px-6 py-3">Status</th>
                                        <th class="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr v-for="process in client.processes" :key="process.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td class="px-6 py-4">
                                            <div class="font-medium text-slate-900 dark:text-white">{{ process.process_number }}</div>
                                            <div class="text-xs text-slate-400">{{ formatDate(process.created_at) }}</div>
                                        </td>
                                        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {{ process.tribunal || '-' }}
                                        </td>
                                        <td class="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                                            {{ formatCurrency(process.value_charged) }}
                                        </td>
                                        <td class="px-6 py-4">
                                            <span :class="getStatusClass(process.status)" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                                {{ process.status }}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 text-right">
                                            <NuxtLink 
                                                :to="`/processes/${process.id}`"
                                                class="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                            >
                                                <ExternalLink class="w-4 h-4" />
                                            </NuxtLink>
                                        </td>
                                    </tr>
                                    <tr v-if="client.processes.length === 0">
                                        <td colspan="5" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            Nenhum processo vinculado a este cliente.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Sidebar (Right) -->
                <div class="space-y-6">
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                            <Phone class="w-4 h-4 mr-2" /> Informações de Contato
                        </h3>
                        
                        <div class="space-y-6">
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-1">Telefone / E-mail</label>
                                <p class="text-slate-900 dark:text-white font-medium break-words">
                                    {{ client.contact || 'Não informado' }}
                                </p>
                            </div>
                            
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-1">Endereço Completo</label>
                                <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {{ client.address || 'Endereço não cadastrado' }}
                                </p>
                            </div>

                            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <label class="text-xs font-medium text-slate-400 block mb-1">CPF/CNPJ</label>
                                <div class="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded font-mono text-sm text-slate-700 dark:text-slate-300">
                                    {{ client.document }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
</style>
