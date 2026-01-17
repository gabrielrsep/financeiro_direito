<script setup lang="ts">
import { useToastStore } from '~/stores/toast'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-vue-next'

const toastStore = useToastStore()
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
        v-for="toast in toastStore.toasts" 
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
        <button 
          @click="toastStore.remove(toast.id)" 
          class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          title="Fechar"
        >
            <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

