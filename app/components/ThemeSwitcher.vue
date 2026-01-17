<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
const colorMode = useColorMode();

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};
</script>

<template>
  <button
    @click="toggleColorMode"
    class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    aria-label="Toggle Dark Mode"
  >
    <ClientOnly>
      <Sun v-if="colorMode.value === 'dark'" class="w-5 h-5 text-yellow-400" />
      <Moon v-else class="w-5 h-5 text-slate-700" />
    </ClientOnly>
  </button>
</template>
