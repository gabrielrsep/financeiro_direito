<script setup lang="ts">
import { X, AlertTriangle, AlertCircle } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'primary'
})

const emit = defineEmits(['close', 'confirm'])

const close = () => emit('close')
const confirm = () => {
  emit('confirm')
  close()
}
</script>

<template>
  <div v-if="isOpen"
    class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    @click.self="close">
    <div class="bg-white dark:bg-slate-900 rounded-lg shadow-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">
      <div class="p-6">
        <div class="flex items-center space-x-3">
          <div v-if="variant === 'danger'" class="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle class="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div v-else class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <AlertCircle class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ title }}</h3>
        </div>
        <p class="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {{ message }}
        </p>
      </div>

      <div class="flex items-center p-6 pt-0 justify-end space-x-2">
        <button @click="close"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-4 py-2 text-slate-700 dark:text-slate-300 dark:hover:text-white transition-colors">
          {{ cancelLabel }}
        </button>
        <button @click="confirm"
          :class="[
            'inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 shadow-sm transition-colors',
            variant === 'danger' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
          ]">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
