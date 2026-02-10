<script setup lang="ts">
import { computed, ref } from 'vue'
import {
    ArrowLeft,
    FileText,
    User,
    Phone,
    MapPin,
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    Trash2,
    Edit2
} from 'lucide-vue-next'
import { formatCurrency, formatDate } from '~/utils/formatters'
import { useToastStore } from '~/stores/toast'

const route = useRoute()
const router = useRouter()
const serviceId = route.params.id as string
const toastStore = useToastStore()

interface Payment {
    id: number
    service_id: number
    value_paid: number
    payment_date: string
    status: string
    due_date: string
    created_at: string
}

interface ServiceDetails {
    id: number
    client_id: number
    description: string
    value_charged: number
    payment_method: string
    em_conta_details: string
    status: string
    created_at: string
    client_name: string
    client_document: string
    client_contact: string
    client_address: string
    payments: Payment[]
    summary: {
        value_charged: number
        total_paid: number
        total_pending: number
        balance: number
    }
}

const showPaymentModal = ref(false)
const showConfirmDelete = ref(false)
const isDeleting = ref(false)

const { data: response, pending, error, refresh } = await useFetch<{ success: boolean; data: ServiceDetails }>(`/api/services/${serviceId}`)

const service = computed(() => response.value?.data)

useHead({
    title: computed(() => `Serviço: ${service.value?.description || ''}`)
})

const paymentProgress = computed(() => {
    if (!service.value || service.value.value_charged === 0) return 0
    return Math.min(Math.round((service.value.summary.total_paid / service.value.value_charged) * 100), 100)
})

const deleteService = async () => {
    isDeleting.value = true
    try {
        await $fetch(`/api/services/${serviceId}`, {
            method: 'DELETE'
        })
        toastStore.success('Serviço deletado com sucesso')
        router.push('/services')
    } catch (error) {
        toastStore.error('Erro ao deletar serviço')
    } finally {
        isDeleting.value = false
        showConfirmDelete.value = false
    }
}
</script>

<template>
    <div class="max-w-7xl mx-auto space-y-6 pb-12">
        <!-- Breadcrumb / Back Navigation -->
        <div class="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <NuxtLink to="/services" class="hover:text-slate-900 dark:hover:text-white flex items-center transition-colors">
                <ArrowLeft class="w-4 h-4 mr-1" />
                Voltar para Serviços
            </NuxtLink>
        </div>

        <div v-if="pending" class="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
            <p class="text-slate-500">Carregando detalhes do serviço...</p>
        </div>

        <div v-else-if="error || !service" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-8 rounded-lg text-center">
            <h2 class="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Erro ao carregar serviço</h2>
            <p class="text-red-600 dark:text-red-300">{{ error?.statusMessage || 'Serviço não encontrado no sistema.' }}</p>
            <NuxtLink to="/services" class="mt-4 inline-block text-sm font-medium underline">Retornar à lista</NuxtLink>
        </div>

        <template v-else>
            <!-- Header Section -->
            <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden relative">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex items-start space-x-4">
                        <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hidden sm:block">
                            <FileText class="w-8 h-8 text-slate-900 dark:text-white" />
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span :class="[
                                    'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                                    service.status === 'Ativo' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                ]">
                                    {{ service.status }}
                                </span>
                                <span class="text-xs text-slate-400 font-mono">#{{ service.id }}</span>
                            </div>
                            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                {{ service.description }}
                            </h1>
                            <p class="text-slate-500 dark:text-slate-400 flex items-center mt-1">
                                <User class="w-3.5 h-3.5 mr-1" /> {{ service.client_name }}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2">
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
                            <FileText class="w-4 h-4 mr-2" /> Informações do Serviço
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-2">Descrição Completa</label>
                                <div class="text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {{ service.description }}
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="text-xs font-medium text-slate-400 block mb-1">Forma de Pagamento</label>
                                    <p class="text-slate-900 dark:text-white font-medium">
                                        {{ service.payment_method === 'em_conta' ? 'Parcelado pelo Escritório' : service.payment_method?.toUpperCase() || 'Não informado' }}
                                    </p>
                                </div>
                                <div v-if="service.em_conta_details">
                                    <label class="text-xs font-medium text-slate-400 block mb-1">Detalhes dos Parcelamentos</label>
                                    <p class="text-slate-900 dark:text-white font-medium">{{ service.em_conta_details }}</p>
                                </div>
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
                                <span class="text-xs text-slate-500 block mb-1">Valor Total Contratado</span>
                                <span class="text-xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(service.value_charged) }}</span>
                            </div>
                            <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                <span class="text-xs text-emerald-600 dark:text-emerald-400 block mb-1">Total Recebido</span>
                                <span class="text-xl font-bold text-emerald-700 dark:text-emerald-400">{{ formatCurrency(service.summary.total_paid) }}</span>
                            </div>
                            <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                                <span class="text-xs text-amber-600 dark:text-amber-400 block mb-1">Saldo Devedor</span>
                                <span class="text-xl font-bold text-amber-700 dark:text-amber-400">{{ formatCurrency(service.summary.balance) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment History -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                                <Clock class="w-4 h-4 mr-2" /> Histórico de Pagamentos
                            </h3>
                            <button
                                @click="showPaymentModal = true"
                                class="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            >
                                Adicionar Pagamento
                            </button>
                        </div>

                        <div v-if="!service.payments || service.payments.length === 0" class="text-center py-8">
                            <p class="text-slate-500 dark:text-slate-400">Nenhum pagamento registrado ainda</p>
                        </div>

                        <div v-else class="space-y-2">
                            <div v-for="payment in service.payments" :key="payment.id"
                                class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700"
                            >
                                <div class="flex items-center gap-3 flex-1">
                                    <div :class="[
                                        'p-1.5 rounded-lg',
                                        payment.status === 'Pago' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-amber-100 dark:bg-amber-900/20'
                                    ]">
                                        <CheckCircle2 v-if="payment.status === 'Pago'" class="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <Clock v-else class="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-semibold text-slate-900 dark:text-white">
                                            {{ formatCurrency(payment.value_paid) }}
                                        </p>
                                        <p class="text-xs text-slate-500 dark:text-slate-400">
                                            <span v-if="payment.status === 'Pago'">Pago em {{ formatDate(payment.payment_date) }}</span>
                                            <span v-else>Vencimento: {{ formatDate(payment.due_date) }}</span>
                                        </p>
                                    </div>
                                </div>
                                <span :class="[
                                    'text-xs font-semibold px-2.5 py-0.5 rounded-full',
                                    payment.status === 'Pago'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                ]">
                                    {{ payment.status }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar (Right Column) -->
                <div class="space-y-6">
                    <!-- Client Info Card -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                            <User class="w-4 h-4 mr-2" /> Informações do Cliente
                        </h3>
                        <div class="space-y-4">
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-1">Nome</label>
                                <p class="text-slate-900 dark:text-white font-medium">{{ service.client_name }}</p>
                            </div>
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-1">CPF/CNPJ</label>
                                <p class="text-slate-900 dark:text-white font-mono text-sm">{{ service.client_document || '-' }}</p>
                            </div>
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-1">Contato</label>
                                <p class="text-slate-900 dark:text-white text-sm flex items-center">
                                    <Phone class="w-3 h-3 mr-1" />
                                    {{ service.client_contact || '-' }}
                                </p>
                            </div>
                            <div>
                                <label class="text-xs font-medium text-slate-400 block mb-1">Endereço</label>
                                <p class="text-slate-900 dark:text-white text-sm flex items-start">
                                    <MapPin class="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                    {{ service.client_address || '-' }}
                                </p>
                            </div>
                            <NuxtLink :to="`/clients/${service.client_id}`"
                                class="mt-4 w-full px-3 py-2 text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors block"
                            >
                                Ver Perfil do Cliente
                            </NuxtLink>
                        </div>
                    </div>

                    <!-- Timeline -->
                    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Cronograma</h3>
                        <div class="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                            <div>
                                <span class="font-medium text-slate-900 dark:text-white block">Criado em</span>
                                {{ formatDate(service.created_at) }}
                            </div>
                            <div>
                                <span class="font-medium text-slate-900 dark:text-white block">Status</span>
                                {{ service.status }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Payment Modal -->
            <PaymentModal
                v-if="showPaymentModal"
                :isOpen="showPaymentModal"
                :serviceId="service.id"
                :clientId="service.client_id"
                :clientName="service.client_name"
                :remainingValue="service.summary.balance"
                :processNumber="`Serviço #${service.id}`"
                @close="showPaymentModal = false"
                @saved="refresh(); showPaymentModal = false"
            />

            <!-- Confirm Delete Modal -->
            <ConfirmModal
                :isOpen="showConfirmDelete"
                title="Deletar Serviço"
                message="Tem certeza que deseja deletar este serviço? Esta ação não pode ser desfeita."
                confirmLabel="Deletar"
                cancelLabel="Cancelar"
                variant="danger"
                @confirm="deleteService"
                @close="showConfirmDelete = false"
            />
        </template>
    </div>
</template>
