<script setup lang="ts">
import { ChevronDown, Settings, LogOut } from 'lucide-vue-next'
import Avatar from './Avatar.vue'

const authStore = useAuthStore()
const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

// Close menu when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
      closeMenu()
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })
})

async function handleLogout() {
  closeMenu()
  await authStore.logout()
}
</script>

<template>
  <div class="relative" ref="menuRef">
    <button 
      @click="toggleMenu"
      class="flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 group"
    >
      <div class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold uppercase mr-2 shadow-sm">
        <Avatar :user="authStore.user" />
      </div>
      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 mr-2 max-w-[120px] truncate">
        {{ authStore.user?.name }}
      </span>
      <ChevronDown 
        class="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-[60] animate-in slide-in-from-top-2"
      >
        <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conta</p>
          <p class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ authStore.user?.username }}</p>
          <p class="text-[10px] text-slate-500 truncate">{{ authStore.user?.office_name }}</p>
        </div>

        <NuxtLink 
          to="/users" 
          @click="closeMenu"
          class="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Settings class="w-4 h-4 mr-3 text-slate-400" />
          Administração de Usuários
        </NuxtLink>

        <div class="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>

        <button 
          @click="handleLogout"
          class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut class="w-4 h-4 mr-3" />
          Sair
        </button>
      </div>
    </Transition>
  </div>
</template>
