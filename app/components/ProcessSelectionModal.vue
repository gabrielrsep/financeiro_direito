<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, X, ChevronLeft, ChevronRight, Check } from 'lucide-vue-next'

interface Process {
  id: number
  process_number: string
  client_name: string
  tribunal: string
}

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'select'])

const searchQuery = ref('')
const currentPage = ref(1)
const processes = ref<Process[]>([])
const totalPages = ref(1)
const isLoading = ref(false)

const fetchProcesses = async () => {
  isLoading.value = true
  try {
    const res = await $fetch<{ success: boolean, data: Process[], meta: { totalPages: number } }>('/api/processes', {
      params: {
        page: currentPage.value,
        limit: 5,
        search: searchQuery.value
      }
    })
    if (res.success) {
      processes.value = res.data
      totalPages.value = res.meta.totalPages
    }
  } catch (e) {
    console.error('Error fetching processes', e)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.isOpen, (v) => {
  if (v) fetchProcesses()
})

watch(searchQuery, () => {
  currentPage.value = 1
  fetchProcesses()
})

const selectProcess = (p: Process) => {
  emit('select', p)
  emit('close')
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchProcesses()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchProcesses()
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div class="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors">
      <div class="flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="flex justify-between items-center">
          <h3 class="font-semibold text-lg text-slate-900 dark:text-white">Selecionar Processo</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X class="h-4 w-4" />
          </button>
        </div>
        <div class="relative pt-4">
          <Search class="absolute left-2 top-6 h-4 w-4 text-slate-400" />
          <input v-model="searchQuery" placeholder="Buscar por número do processo ou cliente..." class="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1 text-sm pl-8 text-slate-900 dark:text-white" />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-2">
        <div v-if="isLoading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
        </div>
        <ul v-else-if="processes.length > 0" class="space-y-1">
          <li v-for="p in processes" :key="p.id">
            <button @click="selectProcess(p)" class="w-full text-left px-4 py-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-between items-center group">
              <div>
                <p class="font-medium text-slate-900 dark:text-white">{{ p.process_number }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ p.client_name }} — {{ p.tribunal }}</p>
              </div>
              <Check class="h-4 w-4 text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </li>
        </ul>
        <div v-else class="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">Nenhum processo encontrado.</div>
      </div>

      <div class="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <span class="text-xs text-slate-500 dark:text-slate-400">Página {{ currentPage }} de {{ totalPages }}</span>
        <div class="flex space-x-2">
          <button @click="prevPage" :disabled="currentPage === 1" class="p-2 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"> <ChevronLeft class="h-4 w-4"/> </button>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="p-2 rounded-md hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"> <ChevronRight class="h-4 w-4"/> </button>
        </div>
      </div>
    </div>
  </div>
</template>
