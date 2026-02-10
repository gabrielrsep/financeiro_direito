<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Search, Trash2, DollarSign, Eye, ChevronUp, ChevronDown, User, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useToastStore } from '~/stores/toast'
import { formatCurrency, formatDate } from '~/utils/formatters'
import PaymentModal from '~/components/PaymentModal.vue'
import ClientSelectionModal from '~/components/ClientSelectionModal.vue'

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
}

interface Client {
  id: number
  name: string
  document: string
}

const router = useRouter()
const toastStore = useToastStore()

const services = ref<Service[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedClient = ref<Client | null>(null)
const showClientSelectionModal = ref(false)
const showCreateModal = ref(false)
const showConfirmDelete = ref(false)
const showPaymentModal = ref(false)
const serviceToDelete = ref<number | null>(null)
const selectedServiceForPayment = ref<Service | null>(null)
const sortBy = ref<'description' | 'client_name' | 'value_charged' | 'status'>('description')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Stats
const stats = computed(() => {
  const totalCharged = services.value.reduce((sum, s) => sum + s.value_charged, 0)
  const totalReceived = services.value.reduce((sum, s) => sum + s.total_paid, 0)
  const balance = totalCharged - totalReceived
  return { totalCharged, totalReceived, balance }
})

// Fetch services
const fetchServices = async () => {
  loading.value = true
  try {
    const statusFilter = selectedStatus.value === 'all' ? '' : selectedStatus.value
    const result = await $fetch<{ success: boolean; data: Service[]; meta: { totalPages: number } }>('/api/services', {
      query: {
        page: currentPage.value,
        limit: 10,
        search: searchQuery.value,
        status: statusFilter,
        clientId: selectedClient.value?.id,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      }
    })
    if (result.success) {
      services.value = result.data
      totalPages.value = result.meta.totalPages
    }
  } catch (error) {
    toastStore.error('Erro ao carregar serviços')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchServices()
})

watch([searchQuery, selectedStatus], () => {
  currentPage.value = 1
  fetchServices()
})

// Sort
const handleSort = (column: 'description' | 'client_name' | 'value_charged' | 'status') => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
  fetchServices()
}

const getSortIcon = (column: string) => {
  if (sortBy.value !== column) return null
  return sortOrder.value === 'asc' ? ChevronUp : ChevronDown
}

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
    fetchServices()
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
  fetchServices()
}

const getStatusBadgeClass = (status: string) => {
  return status === 'Ativo'
    ? 'px-2 py-1 rounded-full text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    : 'px-2 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20'
}

const handleClientSelected = (client: Client) => {
  selectedClient.value = client
  currentPage.value = 1
  fetchServices()
}

const clearClientFilter = () => {
  selectedClient.value = null
  currentPage.value = 1
  fetchServices()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Serviços</h1>
          <div
            v-if="selectedClient"
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Filtrado por: {{ selectedClient.name }}
            <button
              type="button"
              @click="clearClientFilter"
              class="p-1 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Limpar filtro de cliente"
            >
              <X class="h-3 w-3" />
            </button>
          </div>
        </div>
        <p class="text-slate-500 dark:text-slate-400">Gerencie serviços prestados aos clientes</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <Plus class="h-4 w-4" />
        Novo Serviço
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Contratado</p>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ formatCurrency(stats.totalCharged) }}</p>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Recebido</p>
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(stats.totalReceived) }}</p>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-1">Saldo a Receber</p>
        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(stats.balance) }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <div class="flex-1">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por descrição ou cliente..."
              class="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
          <button
            type="button"
            @click="showClientSelectionModal = true"
            class="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
          >
            <User class="h-4 w-4 text-slate-500 dark:text-slate-400" />
            Selecionar cliente
          </button>
          <div
            v-if="selectedClient"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600"
          >
            <div class="flex flex-col leading-tight">
              <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedClient.name }}</span>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ selectedClient.document }}</span>
            </div>
            <button
              type="button"
              @click="clearClientFilter"
              class="p-1 rounded-md hover:bg-white dark:hover:bg-slate-600 transition-colors"
              title="Limpar filtro de cliente"
            >
              <X class="h-4 w-4 text-slate-500 dark:text-slate-300" />
            </button>
          </div>
        </div>
        <select
          v-model="selectedStatus"
          class="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="all">Todos os Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Concluído">Concluído</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="services.length === 0" class="text-center py-12">
        <p class="text-slate-500 dark:text-slate-400">Nenhum serviço encontrado</p>
      </div>
      <table v-else class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
          <tr>
            <th class="px-6 py-3 text-left">
              <button
                @click="handleSort('description')"
                class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Descrição
                <component v-if="getSortIcon('description')" :is="getSortIcon('description')" class="h-4 w-4" />
              </button>
            </th>
            <th class="px-6 py-3 text-left">
              <button
                @click="handleSort('client_name')"
                class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Cliente
                <component v-if="getSortIcon('client_name')" :is="getSortIcon('client_name')" class="h-4 w-4" />
              </button>
            </th>
            <th class="px-6 py-3 text-left">
              <button
                @click="handleSort('value_charged')"
                class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Valor Cobrado
                <component v-if="getSortIcon('value_charged')" :is="getSortIcon('value_charged')" class="h-4 w-4" />
              </button>
            </th>
            <th class="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Valor Pago</th>
            <th class="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Pendente</th>
            <th class="px-6 py-3 text-left">
              <button
                @click="handleSort('status')"
                class="flex items-center gap-2 font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Status
                <component v-if="getSortIcon('status')" :is="getSortIcon('status')" class="h-4 w-4" />
              </button>
            </th>
            <th class="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr v-for="service in services" :key="service.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <td class="px-6 py-4 text-slate-900 dark:text-white font-medium">{{ service.description }}</td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">{{ service.client_name }}</td>
            <td class="px-6 py-4 text-slate-900 dark:text-white font-medium">{{ formatCurrency(service.value_charged) }}</td>
            <td class="px-6 py-4 text-green-600 dark:text-green-400 font-medium">{{ formatCurrency(service.total_paid) }}</td>
            <td class="px-6 py-4 text-amber-600 dark:text-amber-400 font-medium">{{ formatCurrency(service.total_pending) }}</td>
            <td class="px-6 py-4">
              <span :class="getStatusBadgeClass(service.status)">{{ service.status }}</span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <button
                  @click="router.push(`/services/${service.id}`)"
                  class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Ver detalhes"
                >
                  <Eye class="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  @click="openPaymentModal(service)"
                  class="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title="Adicionar pagamento"
                >
                  <DollarSign class="h-4 w-4 text-green-600 dark:text-green-400" />
                </button>
                <button
                  @click="confirmDelete(service.id)"
                  class="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Deletar"
                >
                  <Trash2 class="h-4 w-4 text-red-600 dark:text-red-400" />
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
        @click="currentPage--; fetchServices()"
        class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        @click="currentPage++; fetchServices()"
        class="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Próxima
      </button>
    </div>

    <!-- Create Service Modal -->
    <ServiceModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="fetchServices(); showCreateModal = false"
    />

    <!-- Payment Modal -->
    <PaymentModal
      :isOpen="showPaymentModal && !!selectedServiceForPayment"
      :serviceId="selectedServiceForPayment?.id || null"
      :clientId="selectedServiceForPayment?.client_id"
      :clientName="selectedServiceForPayment?.client_name || ''"
      :processNumber="selectedServiceForPayment?.description || ''"
      :remainingValue="selectedServiceForPayment?.total_pending || 0"
      @close="showPaymentModal = false"
      @saved="handlePaymentCreated"
    />

    <ClientSelectionModal
      :isOpen="showClientSelectionModal"
      @close="showClientSelectionModal = false"
      @select="handleClientSelected"
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
