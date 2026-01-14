<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, Eye } from 'lucide-vue-next'

interface Client {
  id?: number
  name: string
  document: string
  contact: string
  address: string
}

useHead({
    title: 'Lei & $ - Clientes'
})

const searchQuery = ref('')
const sortBy = ref('created_at-desc')
const page = ref(1)
const limit = ref(10)

const queryParams = computed(() => ({
  page: page.value,
  limit: limit.value,
  search: searchQuery.value,
  sortBy: sortBy.value
}))

interface ApiResponse {
  success: boolean
  data: Client[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const { data, refresh } = await useFetch<ApiResponse>('/api/clients', {
    params: queryParams
})

const clients = computed(() => data.value?.data || [])
const total = computed(() => data.value?.meta?.total || 0)
const totalPages = computed(() => data.value?.meta?.totalPages || 1)

let searchTimeout: NodeJS.Timeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
  }, 300)
})

watch(sortBy, () => {
  page.value = 1
})

const isDialogOpen = ref(false)
const isEditing = ref(false)
const currentClient = ref<Client>({
  id: undefined,
  name: '',
  document: '',
  contact: '',
  address: ''
})

const openCreateModal = () => {
  isEditing.value = false
  currentClient.value = { id: undefined, name: '', document: '', contact: '', address: '' }
  isDialogOpen.value = true
}

const openEditModal = (client: Client) => {
  isEditing.value = true
  currentClient.value = { ...client }
  isDialogOpen.value = true
}

const closeModal = () => {
  isDialogOpen.value = false
}

const saveClient = async () => {
  try {
    if (isEditing.value && currentClient.value.id) {
      await $fetch(`/api/clients/${currentClient.value.id}`, {
        method: 'PUT',
        body: currentClient.value
      })
    } else {
      await $fetch('/api/clients', {
        method: 'POST',
        body: currentClient.value
      })
    }
    await refresh()
    closeModal()
  } catch (error: any) {
    alert(error.message || 'Erro ao salvar cliente')
  }
}

const deleteClient = async (id: number | undefined) => {
  if (!id) return
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return
  try {
    await $fetch(`/api/clients/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (error) {
    alert('Erro ao excluir cliente')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Clientes</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Gerencie os clientes do seu escritório.</p>
      </div>
      <button @click="openCreateModal"
        class="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
        <Plus class="mr-2 h-4 w-4" /> Novo Cliente
      </button>
    </div>

    <!-- Actions Bar -->
    <div class="flex items-center space-x-2 bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
        <input v-model="searchQuery" placeholder="Buscar clientes..."
          class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 pl-8 text-slate-900 dark:text-white" />
      </div>
      <select v-model="sortBy"
        class="flex h-9 w-full max-w-[200px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white">
        <option value="created_at-desc">Data (Recente)</option>
        <option value="created_at-asc">Data (Antigo)</option>
        <option value="name-asc">Nome (A-Z)</option>
        <option value="name-desc">Nome (Z-A)</option>
      </select>
    </div>

    <!-- Table -->
    <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
      <div class="w-full overflow-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="h-10 px-4 align-middle">Nome</th>
              <th class="h-10 px-4 align-middle">Documento</th>
              <th class="h-10 px-4 align-middle">Contato</th>
              <th class="h-10 px-4 align-middle text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="client in clients" :key="client.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-slate-600 dark:text-slate-400">
              <td class="p-4 align-middle font-medium">
                <NuxtLink :to="`/clients/${client.id}`" class="text-slate-900 dark:text-white hover:underline">
                  {{ client.name }}
                </NuxtLink>
              </td>
              <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ client.document }}</td>
              <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ client.contact }}</td>
              <td class="p-4 align-middle text-right space-x-2">
                <NuxtLink :to="`/clients/${client.id}`"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white h-8 w-8 text-slate-500 dark:text-slate-400">
                  <Eye class="h-4 w-4" />
                </NuxtLink>
                <button @click="openEditModal(client)"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white h-8 w-8 text-slate-500 dark:text-slate-400">
                  <Pencil class="h-4 w-4" />
                </button>
                <button @click="deleteClient(client.id)"
                  class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 h-8 w-8 text-red-500">
                  <Trash2 class="h-4 w-4" />
                </button>
              </td>
            </tr>
            <tr v-if="clients.length === 0">
              <td colspan="4" class="h-24 text-center text-slate-500 dark:text-slate-400">
                Nenhum resultado encontrado.
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
      <div class="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div class="flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold leading-none tracking-tight text-lg text-slate-900 dark:text-white">
              {{ isEditing ? 'Editar Cliente' : 'Novo Cliente' }}
            </h3>
            <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <X class="h-4 w-4" />
            </button>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ isEditing ? 'Atualize os detalhes do cliente abaixo.' : 'Adicione um novo cliente ao sistema.' }}
          </p>
        </div>

        <div class="p-6 space-y-4">
          <div class="grid gap-2">
            <label for="name"
              class="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Nome</label>
            <input id="name" v-model="currentClient.name"
              class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white" />
          </div>
          <div class="grid gap-2">
            <label for="document"
              class="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Documento
              (CPF/CNPJ)</label>
            <input id="document" v-model="currentClient.document"
              class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white" />
          </div>
          <div class="grid gap-2">
            <label for="contact"
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Contato</label>
            <input id="contact" v-model="currentClient.contact"
              class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white" />
          </div>
          <div class="grid gap-2">
            <label for="address"
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 dark:text-white">Endereço</label>
            <input id="address" v-model="currentClient.address"
              class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-white" />
          </div>
        </div>

        <div class="flex items-center p-6 pt-0 justify-end space-x-2 text-slate-900 dark:text-white">
          <button @click="closeModal"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white h-9 px-4 py-2">
            Cancelar
          </button>
          <button @click="saveClient"
            class="inline-flex items-center justify-center rounded-md text-sm font-medium bg-slate-100 text-slate-900 dark:text-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 dark:hover:bg-slate-200 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-900/90 dark:hover:bg-slate-200 h-9 px-4 py-2">
            Salvar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
