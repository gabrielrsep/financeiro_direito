<script setup lang="ts">
import { computed } from 'vue'
import {
  FileText, 
  AlertCircle,
  TrendingUp,
  CalendarDays,
  Building2,
  RefreshCw
} from 'lucide-vue-next'
import { formatCurrency, formatDate } from '~/utils/formatters'


interface Stats {
  kpis: {
    activeProcesses: number
    activeServices: number
    monthlyRevenue: number
    recurrentRevenue: number
    pendingExpenses: number
  }
}

interface NextPayment {
  id: number
  client_name: string
  process_number?: string
  service_description?: string
  amount: number
  movement_date: string
}

interface ScheduleResponse {
  success: boolean
  data: NextPayment[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

useHead({
  title: 'Dashboard'
})

const { user } = useUserSession()

const { data: stats, pending } = useFetch<Stats>('/api/dashboard/stats')
const { data: nextPaymentsData, pending: nextPaymentsPending } = await useFetch<ScheduleResponse>('/api/payments/history', {
  query: {
    page: 1,
    limit: 5,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    type: 'charge'
  }
})

const nextPayments = computed(() => nextPaymentsData.value?.data || [])

const kpis = computed(() => [
  {
    title: 'Processos Ativos',
    value: stats.value?.kpis.activeProcesses || 0,
    description: 'Em andamento no momento',
    icon: FileText,
    color: 'text-blue-600'
  },
  {
    title: 'Serviços Ativos',
    value: stats.value?.kpis.activeServices || 0,
    description: 'Serviços em prestação',
    icon: FileText,
    color: 'text-purple-600'
  },
  {
    title: 'Receita Mensal',
    value: formatCurrency(stats.value?.kpis.monthlyRevenue || 0),
    description: 'Recebido este mês',
    icon: TrendingUp,
    color: 'text-emerald-600'
  },
  {
    title: 'Receita Recorrente',
    value: formatCurrency(stats.value?.kpis.recurrentRevenue || 0),
    description: 'De clientes recorrentes este mês',
    icon: RefreshCw,
    color: 'text-indigo-600'
  },
  {
    title: 'Gastos Pendentes',
    value: formatCurrency(stats.value?.kpis.pendingExpenses || 0),
    description: 'Pendentes este mês',
    icon: AlertCircle,
    color: 'text-rose-600'
  }
])
</script>

<template>
  <div class="space-y-8 pb-10">
    <div class="flex flex-col gap-1">
      <div v-if="user?.office_name" class="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold tracking-wide uppercase text-xs mb-1">
        <Building2 class="h-4 w-4" />
        <span>{{ user.office_name }}</span>
      </div>
      <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">Dashboard</h1>
      <p class="text-slate-500 dark:text-slate-400">Visão geral do desempenho e atividades do escritório.</p>
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"></div>
    </div>

    <!-- KPI Cards -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div v-for="kpi in kpis" :key="kpi.title" class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md">
        <div class="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ kpi.title }}</h3>
          <component :is="kpi.icon" :class="['h-5 w-5', kpi.color]" />
        </div>
        <div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{{ kpi.value }}</div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ kpi.description }}</p>
        </div>
      </div>
    </div>

    <!-- Next Payments Section -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <div class="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <CalendarDays class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 class="font-semibold text-slate-900 dark:text-white">Próximos Pagamentos</h3>
                </div>
            </div>
        </div>
        <div class="p-6">
            <div v-if="nextPaymentsPending" class="space-y-3">
                <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-800 w-5/6"></div>
                <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-800 w-4/6"></div>
            </div>
            <div v-else>
                <ul class="space-y-3">
                    <li v-for="payment in nextPayments" :key="payment.id" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ formatDate(payment.movement_date) }}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {{ payment.client_name }} • {{ payment.process_number || payment.service_description || 'Cobrança agendada' }}
                                </p>
                            </div>
                            <div class="text-right">
                                <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(payment.amount) }}</div>
                                <span class="text-xs text-slate-500 dark:text-slate-400">Cobrança prevista</span>
                            </div>
                        </div>
                    </li>
                </ul>
                <div v-if="nextPayments.length === 0" class="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                    Nenhum pagamento previsto para este mês.
                </div>
            </div>
        </div>
    </div>
  </div>
</template>
