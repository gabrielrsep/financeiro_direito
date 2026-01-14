<script lang="ts">
export type ToastType = 'success' | 'error' | 'info'

import { reactive } from 'vue'

const toastState = reactive({
    add: (message: string, type: ToastType) => {}
})

export const useToast = () => {
    return {
        success: (message: string) => toastState.add(message, 'success'),
        error: (message: string) => toastState.add(message, 'error'),
        info: (message: string) => toastState.add(message, 'info'),
    }
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-vue-next'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let nextId = 1

const add = (message: string, type: ToastType = 'info') => {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => remove(id), 3000)
}

const remove = (id: number) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods to be used via template ref or provide/inject if preferred globally
// For simplicity in this Nuxt app setup without a dedicated store yet, 
// we can use useState to make it globally accessible if we wrap it in a plugin,
// but here we are creating the component.
// We will export a composable next to make this easy to use.

defineExpose({ add, remove })
</script>



<template>
  <div class="fixed bottom-4 right-4 z-[9999] flex flex-col space-y-2 pointer-events-none">
    <TransitionGroup 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-2 opacity-0"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="pointer-events-auto flex items-center w-full max-w-xs p-4 rounded-lg shadow-lg border text-sm font-medium"
        :class="{
            'bg-white border-green-100 text-green-800': toast.type === 'success',
            'bg-white border-red-100 text-red-800': toast.type === 'error',
            'bg-white border-blue-100 text-blue-800': toast.type === 'info',
        }"
      >
        <div class="flex-shrink-0 mr-3">
            <CheckCircle v-if="toast.type === 'success'" class="h-5 w-5 text-green-500" />
            <AlertCircle v-if="toast.type === 'error'" class="h-5 w-5 text-red-500" />
            <Info v-if="toast.type === 'info'" class="h-5 w-5 text-blue-500" />
        </div>
        <div class="flex-1 mr-2">{{ toast.message }}</div>
        <button @click="remove(toast.id)" class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
  <!-- Hidden element to bind the global state handler -->
  <div class="hidden" :ref="(el: any) => { if(el) toastState.add = add }"></div>
</template>
