<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Building2 } from 'lucide-vue-next'
import { useToastStore } from '~/stores/toast'

interface Props {
  isOpen: boolean
  office: { id?: number; name: string } | null
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'saved'])
const toastStore = useToastStore()

const name = ref('')

watch(
  () => props.office,
  (office) => {
    if (office) {
      name.value = office.name
    } else {
      name.value = ''
    }
  },
  { immediate: true }
)

const closeModal = () => {
  emit('close')
}

const saveOffice = async () => {
  if (!name.value.trim()) {
    toastStore.error('O nome do escritório é obrigatório.')
    return
  }

  try {
    const payload = { name: name.value.trim() }
    const method = props.office?.id ? 'PUT' : 'POST'
    const url = props.office?.id ? `/api/offices/${props.office.id}` : '/api/offices'

    await $fetch(url, {
      method,
      body: payload,
    })

    emit('saved')
    closeModal()
  } catch (error: any) {
    toastStore.error(error.data.message || 'Erro ao salvar o escritório.', true)
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    @click.self="closeModal"
  >
    <div class="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
      <div class="flex flex-col space-y-2 p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-slate-100 dark:bg-slate-800 p-2">
              <Building2 class="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                {{ office?.id ? 'Editar Escritório' : 'Novo Escritório' }}
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Informe o nome do escritório para continuar.
              </p>
            </div>
          </div>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="p-6 space-y-4">
        <div class="grid gap-2">
          <label for="officeName" class="text-sm font-medium text-slate-900 dark:text-white">Nome do Escritório</label>
          <input
            id="officeName"
            v-model="name"
            placeholder="Ex: Escritório de Advocacia Silva"
            class="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-300 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 p-6 pt-0">
        <button
          @click="closeModal"
          class="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          @click="saveOffice"
          class="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-50 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          {{ office?.id ? 'Salvar Alterações' : 'Criar Escritório' }}
        </button>
      </div>
    </div>
  </div>
</template>
