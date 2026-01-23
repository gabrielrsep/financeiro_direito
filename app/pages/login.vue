<script setup lang="ts">
import { ShieldCheck, User, Lock, Loader2, AlertCircle } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const authStore = useAuthStore()
const identifier = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!identifier.value || !password.value) {
    errorMessage.value = 'Por favor, preencha todos os campos.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  const result = await authStore.login({
    identifier: identifier.value,
    password: password.value
  })

  if (result.success) {
    navigateTo('/')
  } else {
    console.log(result)
    errorMessage.value = result.error || 'Falha na autenticação.'
  }

  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0a0f1c] p-4 relative overflow-hidden">
    <!-- Background Accents -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>
      <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-900/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-md z-10">
      <!-- Logo / Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/20 mb-4 border border-blue-400/20">
          <ShieldCheck class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Sistema Jurídico</h1>
        <p class="text-slate-400 mt-2">Gestão de Processos e Clientes</p>
      </div>

      <!-- Login Card -->
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Identifier Input -->
          <div class="space-y-2">
            <label for="identifier" class="text-sm font-medium text-slate-300 ml-1">Usuário ou E-mail</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User class="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                id="identifier"
                v-model="identifier"
                type="text"
                required
                placeholder="Ex: admin ou admin@escritorio.com"
                class="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <div class="flex items-center justify-between ml-1">
              <label for="password" class="text-sm font-medium text-slate-300">Senha</label>
              <!-- Optional: Forgot password link could go here -->
            </div>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                placeholder="••••••••"
                class="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <!-- Error Message -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div v-if="errorMessage" class="flex items-center gap-2 p-3 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm">
              <AlertCircle class="h-4 w-4 shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
          >
            <Loader2 v-if="loading" class="animate-spin -ml-1 mr-2 h-5 w-5" />
            {{ loading ? 'Autenticando...' : 'Entrar no Sistema' }}
          </button>
        </form>
      </div>

      <!-- Footer Info -->
      <p class="text-center mt-8 text-slate-500 text-xs">
        &copy; {{ new Date().getFullYear() }} Gabriel Rangel Sepulveda. Todos os direitos reservados.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Focus ring offset for dark background */
input:focus {
  --tw-ring-offset-color: #0a0f1c;
}
</style>
