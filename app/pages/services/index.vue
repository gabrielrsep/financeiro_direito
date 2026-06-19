<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Search, Trash2, DollarSign, Eye } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useToastStore } from '~/stores/toast'
import { formatCurrency } from '~/utils/formatters'
import PaymentModal from '~/components/PaymentModal.vue'

interface Service {
  id: number
  client_id: number
  client_name: string
  description: string
  value_charged: number
  payment_method: string
  status: string
  total_paid: number
  total_pending: number
  is_fully_paid?: boolean
}

interface ServicesResponse {
    success: boolean
    data: Service[]
    meta: { totalPages: number }
}


const router = useRouter()
const toastStore = useToastStore()

const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const searchQuery = ref('')
const selectedStatus = ref('all')
const showConfirmDelete = ref(false)
const showPaymentModal = ref(false)
const serviceToDelete = ref<number | null>(null)
const selectedServiceForPayment = ref<Service | null>(null)
// sorting refs removed

const statusFilter = computed(() => selectedStatus.value === 'all' ? '' : selectedStatus.value)

  const { data: services, refresh } = await useFetch<ServicesResponse>('/api/services', {
  query: {
        page: currentPage.value,
        limit: 10,
        search: searchQuery.value,
        status: statusFilter.value
      }
})

watch([searchQuery, selectedStatus], () => {
  currentPage.value = 1
})

// Sorting removed: server uses default ordering

// Delete service
const confirmDelete = (id: number) => {
  serviceToDelete.value = id
  showConfirmDelete.value = true
}

const deleteService = async () => {
  if (!serviceToDelete.value) return
  try {
    await $fetch(`/api/services/${serviceToDelete.value}`, {
      method: 'DELETE'
    })
    showConfirmDelete.value = false
    serviceToDelete.value = null
    toastStore.success('Serviço deletado com sucesso')
    refresh()
  } catch (error) {
    toastStore.error('Erro ao deletar serviço')
  }
}

// Payment modal
const openPaymentModal = (service: Service) => {
  selectedServiceForPayment.value = service
  showPaymentModal.value = true
}

const handlePaymentCreated = () => {
  showPaymentModal.value = false
  selectedServiceForPayment.value = null
  refresh()
}

</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Serviços</h1>
        <p class="text-slate-500 dark:text-slate-400">Gerencie serviços prestados aos clientes</p>
      </div>
      <button
        @click="router.push('/services/new')"
        class="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
      >
        <Plus class="mr-2 h-4 w-4" />
        Novo Serviço
      </button>
    </div>

    <!-- Filters -->
    <div class="flex items-center space-x-2 bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
      <div class="relative w-full max-w-md">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por descrição ou cliente..."
          class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 pl-8 text-slate-900 dark:text-white"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="services?.data.length === 0" class="text-center py-12">
        <p class="text-slate-500 dark:text-slate-400">Nenhum serviço encontrado</p>
      </div>
      <table v-else class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th class="px-6 py-3 text-left">
              <div class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                Descrição
              </div>
            </th>
            <th class="px-6 py-3 text-left">
              <div class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                Cliente
              </div>
            </th>
            <th class="px-6 py-3 text-left">
              <div class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                Valor Cobrado
              </div>
            </th>
            <th class="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Valor Pago</th>
            <th class="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Pendente</th>
            <th class="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          <tr v-for="service in services?.data" :key="service.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
            <td class="px-6 py-4 text-slate-900 dark:text-slate-400 font-medium">{{ service.description }}</td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">{{ service.client_name }}</td>
            <td class="px-6 py-4 text-slate-900 dark:text-slate-400 font-medium">{{ formatCurrency(service.value_charged) }}</td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {{ formatCurrency(service.total_paid) }}
              </span>
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {{ formatCurrency(service.total_pending) }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="router.push(`/services/${service.id}`)"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white h-8 w-8 text-slate-500 dark:text-slate-400"
                  title="Ver detalhes"
                >
                  <Eye class="h-4 w-4" />
                </button>
                <button
                  v-if="!service.is_fully_paid"
                  @click="openPaymentModal(service)"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white h-8 w-8 text-green-600 dark:text-green-400"
                  title="Adicionar pagamento"
                >
                  <DollarSign class="h-4 w-4" />
                </button>
                <button
                  @click="confirmDelete(service.id)"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 h-8 w-8 text-red-500"
                  title="Deletar"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center gap-2">
      <button
        :disabled="currentPage === 1"
        @click="currentPage--;"
        class="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Anterior
      </button>
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-600 dark:text-slate-400">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
      </div>
      <button
        :disabled="currentPage === totalPages"
        @click="currentPage++;"
        class="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Próxima
      </button>
    </div>

    <!-- Payment Modal -->
    <PaymentModal
      :isOpen="showPaymentModal && !!selectedServiceForPayment"
      :serviceId="selectedServiceForPayment?.id || null"
      :clientName="selectedServiceForPayment?.client_name || ''"
      :processNumber="selectedServiceForPayment?.description || ''"
      :remainingValue="selectedServiceForPayment?.total_pending || 0"
      @close="showPaymentModal = false"
      @saved="handlePaymentCreated"
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
  </div>
</template>
