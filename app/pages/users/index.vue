<script setup lang="ts">
import { UserPlus, Pencil, Trash2, Users, Search, ChevronRight } from 'lucide-vue-next'

const authStore = useAuthStore()
const users = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const isModalOpen = ref(false)
const selectedUser = ref<any>(null)
const isConfirmDeleteOpen = ref(false)
const userToDelete = ref<any>(null)

async function fetchUsers() {
  loading.value = true
  try {
    users.value = await $fetch<any[]>('/api/users')
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.username.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  )
})

function openCreateModal() {
  selectedUser.value = null
  isModalOpen.value = true
}

function openEditModal(user: any) {
  selectedUser.value = user
  isModalOpen.value = true
}

function confirmDelete(user: any) {
  userToDelete.value = user
  isConfirmDeleteOpen.value = true
}

async function handleDelete() {
  if (!userToDelete.value) return

  try {
    await $fetch(`/api/users/${userToDelete.value.id}`, {
      method: 'DELETE'
    })
    await fetchUsers()
    isConfirmDeleteOpen.value = false
    userToDelete.value = null
  } catch (error: any) {
    alert(error.data?.statusMessage || 'Erro ao excluir usuário')
  }
}

onMounted(fetchUsers)

useHead({
  title: 'Usuários'
})

</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
          <Users class="w-6 h-6 mr-2 text-blue-600" />
          Administração de Usuários
        </h1>
        <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie os membros da equipe e suas credenciais.</p>
      </div>
      <button @click="openCreateModal"
        class="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-sm font-semibold">
        <UserPlus class="w-4 h-4 mr-2" />
        Novo Usuário
      </button>
    </div>

    <!-- Filtros e Busca -->
    <div
      class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 transition-colors">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input v-model="searchQuery" type="text" placeholder="Buscar por nome, usuário ou email..."
          class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white text-sm" />
      </div>
    </div>

    <!-- Lista de Usuários -->
    <div
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div v-if="loading" class="p-12 flex justify-center items-center flex-col space-y-4">
        <div class="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p class="text-slate-500 dark:text-slate-400 font-medium">Carregando usuários...</p>
      </div>

      <div v-else-if="filteredUsers.length === 0" class="p-12 text-center">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-4">
          <Search class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Nenhum usuário encontrado</h3>
        <p class="text-slate-500 dark:text-slate-400">Tente ajustar seus filtros de busca.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr
              class="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th class="px-6 py-4">Nome</th>
              <th class="px-6 py-4">Usuário</th>
              <th class="px-6 py-4">Email</th>
              <th class="px-6 py-4">Cadastrado em</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="user in filteredUsers" :key="user.id"
              class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div
                  class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3 font-bold text-xs uppercase overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all">
                    <Avatar :user="user" />
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-slate-900 dark:text-white">{{ user.name }}</div>
                    <div v-if="user.id === authStore.user?.id"
                      class="text-[10px] text-blue-600 font-bold uppercase mt-0.5">Você</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600 dark:text-slate-400">{{ user.username }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600 dark:text-slate-400">{{ user.email }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-500">
                {{ new Date(user.created_at).toLocaleDateString() }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end space-x-2">
                  <button @click="openEditModal(user)"
                    class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Editar">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button v-if="user.id !== authStore.user?.id" @click="confirmDelete(user)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Excluir">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UserModal :is-open="isModalOpen" :user="selectedUser" @close="isModalOpen = false" @saved="fetchUsers" />

    <!-- Modal de Confirmação de Exclusão -->
    <ConfirmModal :is-open="isConfirmDeleteOpen" title="Excluir Usuário"
      :message="`Tem certeza que deseja excluir o usuário ${userToDelete?.name}? Esta ação não pode ser desfeita.`"
      confirm-text="Excluir" variant="danger" @close="isConfirmDeleteOpen = false" @confirm="handleDelete" />
  </div>
</template>
