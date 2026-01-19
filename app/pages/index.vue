<script setup lang="ts">
import {
  FileText, 
  DollarSign, 
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CalendarDays,
  Building2,
  RefreshCw
} from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { formatCurrency } from '~/utils/formatters'


const authStore = useAuthStore()

interface Stats {
  kpis: {
    totalReceivable: number
    activeProcesses: number
    monthlyRevenue: number
    recurrentRevenue: number
    pendingExpenses: number
  }
  recentProcesses: any[]
  recentPayments: any[]
}

useHead({
  title: 'Lei & $ - Dashboard'
})

const { data: stats, pending } = useFetch<Stats>('/api/dashboard/stats')

const { data: scheduledData } = useFetch<any>('/api/gastos/scheduled', {
    params: {
        all: 'true'
    }
})


const scheduledPayments = computed(() => scheduledData.value?.data || [])



const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const kpis = computed(() => [
  {
    title: 'Total a Receber',
    value: formatCurrency(stats.value?.kpis.totalReceivable || 0),
    description: 'Total dos honorários em relação aos valores a pagar',
    icon: DollarSign,
    color: 'text-amber-600'
  },
  {
    title: 'Processos Ativos',
    value: stats.value?.kpis.activeProcesses || 0,
    description: 'Em andamento no momento',
    icon: FileText,
    color: 'text-blue-600'
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
      <div v-if="authStore.user?.office_name" class="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-semibold tracking-wide uppercase text-xs mb-1">
        <Building2 class="h-4 w-4" />
        <span>{{ authStore.user.office_name }}</span>
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

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <!-- Recent Processes -->
      <div class="col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <div class="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">Processos Recentes</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">Últimas movimentações de processos.</p>
            </div>
            <NuxtLink to="/processes" class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Ver todos</NuxtLink>
          </div>
        </div>
        <div class="p-0">
          <div v-if="pending" class="p-6 space-y-4">
            <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded bg-slate-50"></div>
          </div>
          <div v-else-if="stats?.recentProcesses.length === 0" class="p-10 text-center">
            <p class="text-slate-500 dark:text-slate-400">Nenhum processo encontrado.</p>
          </div>
          <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <div v-for="process in stats?.recentProcesses" :key="process.id" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="font-medium text-slate-900 dark:text-white">{{ process.process_number }}</span>
                  <span class="text-sm text-slate-500 dark:text-slate-400">{{ process.client_name }}</span>
                </div>
                <div class="flex flex-col items-end">
                  <span class="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-colors">{{ process.status }}</span>
                  <span class="text-xs text-slate-400 dark:text-slate-500 mt-1 transition-colors">{{ formatDate(process.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Payments -->
      <div class="col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <div class="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">Últimos Pagamentos</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">Recibos recentes de clientes.</p>
            </div>
            <Clock class="h-4 w-4 text-slate-400" />
          </div>
        </div>
        <div class="p-0">
          <div v-if="pending" class="p-6 space-y-4">
            <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded bg-slate-50"></div>
          </div>
          <div v-else-if="stats?.recentPayments.length === 0" class="p-10 text-center">
            <p class="text-slate-500">Nenhum pagamento registrado.</p>
          </div>
          <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <div v-for="payment in stats?.recentPayments" :key="payment.id" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center transition-colors">
                    <ArrowUpRight v-if="payment.status === 'Pago'" class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <Clock v-else class="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-slate-900 dark:text-white transition-colors">{{ formatCurrency(payment.value_paid) }}</span>
                        <span v-if="payment.status === 'Pendente'" class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 transition-colors">Agendado</span>
                    </div>
                    <span class="text-xs text-slate-500 dark:text-slate-400 transition-colors">{{ payment.client_name }}</span>
                  </div>
                </div>
                <span class="text-xs text-slate-400 dark:text-slate-500 transition-colors">{{ formatDate(payment.status === 'Pendente' ? payment.due_date : payment.payment_date) }}</span>
              </div>
            </div>
          </div>
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
        <div class="p-0">
            <div v-if="scheduledPayments.length === 0" class="p-10 text-center">
                <p class="text-slate-500 dark:text-slate-400">Nenhum pagamento pendente agendado.</p>
            </div>
            <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
                <div v-for="item in scheduledPayments" :key="item.payment_id" class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                <Clock class="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div class="flex flex-col">
                                <span class="font-medium text-slate-900 dark:text-white">{{ item.process_number }}</span>
                                <span class="text-xs text-slate-500 dark:text-slate-400">{{ item.client_name }}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-6">
                            <div class="flex flex-col items-end">
                                <span class="font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(item.value_due) }}</span>
                                <span class="text-xs text-slate-400 dark:text-slate-500">{{ formatDate(item.due_date) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>
