<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, UserPlus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import OfficeModal from '~/components/OfficeModal.vue'
import UserModal from '~/components/UserModal.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useToastStore } from '~/stores/toast'

// Middleware de proteção - apenas usuários sem office_id podem acessar
definePageMeta({
  middleware: 'office'
})

interface Office {
  id: number
  name: string
  created_at: string
}

interface ApiResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

useHead({
  title: 'Escritórios'
})

const toastStore = useToastStore()
const page = ref(1)
const limit = ref(10)
const searchQuery = ref('')
const selectedOffice = ref<Office | null>(null)
const selectedOfficeForUser = ref<Pick<Office, 'id' | 'name'> | null>(null)
const isModalOpen = ref(false)
const isUserModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const deleteOfficeId = ref<number | null>(null)

const queryParams = computed(() => ({
  page: page.value,
  limit: limit.value,
  search: searchQuery.value,
}))

const { data, refresh } = await useFetch<ApiResponse<Office>>('/api/offices', {
  params: queryParams,
})

const offices = computed(() => data.value?.data || [])
const total = computed(() => data.value?.meta?.total || 0)
const totalPages = computed(() => data.value?.meta?.totalPages || 1)

let searchTimeout: NodeJS.Timeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
  }, 300)
})

const openCreateModal = () => {
  selectedOffice.value = null
  isModalOpen.value = true
}

const openEditModal = (office: Office) => {
  selectedOffice.value = { ...office }
  isModalOpen.value = true
}

const openAddUserModal = (office: Office) => {
  selectedOfficeForUser.value = { id: office.id, name: office.name }
  isUserModalOpen.value = true
}

const onSaved = async () => {
  await refresh()
  toastStore.success('Escritório salvo com sucesso')
}

const onUserSaved = async () => {
  toastStore.success('Usuário adicionado ao escritório com sucesso')
  selectedOfficeForUser.value = null
}

const confirmDeleteOffice = async () => {
  if (!deleteOfficeId.value) return

  try {
    await $fetch(`/api/offices/${deleteOfficeId.value}`, {
      method: 'DELETE',
    })
    await refresh()
    toastStore.success('Escritório excluído com sucesso')
  } catch (error: any) {
    toastStore.error(error.message || 'Erro ao excluir escritório', true)
  } finally {
    isDeleteModalOpen.value = false
    deleteOfficeId.value = null
  }
}

const openDeleteModal = (office: Office) => {
  deleteOfficeId.value = office.id
  isDeleteModalOpen.value = true
}

</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Escritórios</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">Gerencie os escritórios cadastrados no sistema.</p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center justify-center rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
      >
        <Plus class="mr-2 h-4 w-4" /> Novo Escritório
      </button>
    </div>

    <div class="flex flex-col gap-2 bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 transition-colors sm:flex-row sm:items-center sm:justify-between">
      <div class="relative w-full max-w-md">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
        <input
          v-model="searchQuery"
          placeholder="Buscar escritórios..."
          class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 pl-8 text-slate-900 dark:text-white"
        />
      </div>
    </div>

    <div class="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
      <div class="w-full overflow-auto">
        <table class="min-w-full text-sm text-left">
          <thead class="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="h-12 px-4 align-middle">Nome</th>
              <th class="h-12 px-4 align-middle">Criado em</th>
              <th class="h-12 px-4 align-middle text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="office in offices" :key="office.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors text-slate-600 dark:text-slate-400">
              <td class="p-4 align-middle font-medium text-slate-900 dark:text-white">{{ office.name }}</td>
              <td class="p-4 align-middle text-slate-600 dark:text-slate-400">{{ formatDate(office.created_at) }}</td>
              <td class="p-4 align-middle text-right space-x-2">
                <button
                  @click="openAddUserModal(office)"
                  class="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Adicionar usuário"
                >
                  <UserPlus class="h-4 w-4" />
                </button>
                <button
                  @click="openEditModal(office)"
                  class="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Pencil class="h-4 w-4" />
                </button>
                <button
                  @click="openDeleteModal(office)"
                  class="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </td>
            </tr>
            <tr v-if="offices.length === 0">
              <td colspan="3" class="h-24 text-center text-slate-500 dark:text-slate-400">
                Nenhum escritório encontrado.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 rounded-lg shadow-sm transition-colors">
      <p class="text-sm text-slate-700 dark:text-slate-300">
        Mostrando <span class="font-medium text-slate-900 dark:text-white">{{ offices.length }}</span> de <span class="font-medium text-slate-900 dark:text-white">{{ total }}</span> escritórios
      </p>
      <nav class="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
        <button
          @click="page--"
          :disabled="page <= 1"
          class="relative inline-flex items-center rounded-l-md px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <button
          @click="page++"
          :disabled="page >= totalPages"
          class="relative inline-flex items-center rounded-r-md px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </nav>
    </div>

    <OfficeModal :isOpen="isModalOpen" :office="selectedOffice" @close="isModalOpen = false" @saved="onSaved" />

    <UserModal
      :is-open="isUserModalOpen"
      :office-id="selectedOfficeForUser?.id"
      :office-name="selectedOfficeForUser?.name"
      @close="isUserModalOpen = false"
      @saved="onUserSaved"
    />

    <ConfirmModal
      :isOpen="isDeleteModalOpen"
      title="Excluir Escritório"
      message="Tem certeza que deseja excluir este escritório? Esta ação não poderá ser desfeita."
      confirmLabel="Excluir"
      variant="danger"
      @close="isDeleteModalOpen = false"
      @confirm="confirmDeleteOffice"
    />
  </div>
</template>
