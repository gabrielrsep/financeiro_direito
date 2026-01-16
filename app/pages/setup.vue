<script setup lang="ts">
import { ShieldCheck, Building2, User, Mail, AtSign, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  officeName: '',
  adminName: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

async function handleSetup() {
  if (form.password !== form.confirmPassword) {
    errorMessage.value = 'As senhas não coincidem.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  
  try {
    const data = await $fetch<{ success: boolean, user: any }>('/api/auth/setup', {
      method: 'POST',
      body: {
        officeName: form.officeName,
        adminName: form.adminName,
        username: form.username,
        email: form.email,
        password: form.password
      }
    })

    if (data.success) {
      successMessage.value = 'Sistema configurado com sucesso! Redirecionando...'
      authStore.user = data.user
      authStore.needsSetup = false
      
      setTimeout(() => {
        navigateTo('/')
      }, 2000)
    }
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || 'Ocorreu um erro ao configurar o sistema.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0a0f1c] p-4 relative overflow-hidden">
    <!-- Background Accents -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]"></div>
      <div class="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="w-full max-w-2xl z-10 py-8">
      <!-- Logo / Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-900/20 mb-4 border border-blue-400/20">
          <ShieldCheck class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white tracking-tight">Primeiro Acesso</h1>
        <p class="text-slate-400 mt-2">Configure os detalhes do seu escritório e o usuário administrador.</p>
      </div>

      <!-- Setup Card -->
      <div class="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <form @submit.prevent="handleSetup" class="space-y-8">
          
          <!-- Office Section -->
          <div>
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 class="w-5 h-5 text-blue-500" />
              Informações do Escritório
            </h2>
            <div class="grid grid-cols-1 gap-4">
              <div class="space-y-2">
                <label for="officeName" class="text-sm font-medium text-slate-300 ml-1">Nome do Escritório</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 class="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="officeName"
                    v-model="form.officeName"
                    type="text"
                    required
                    placeholder="Ex: Advocacia Silva & Associados"
                    class="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-px bg-slate-800 w-full"></div>

          <!-- Admin User Section -->
          <div>
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User class="w-5 h-5 text-blue-500" />
              Usuário Administrador
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Name -->
              <div class="space-y-2">
                <label for="adminName" class="text-sm font-medium text-slate-300 ml-1">Nome Completo</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User class="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="adminName"
                    v-model="form.adminName"
                    type="text"
                    required
                    placeholder="Seu nome"
                    class="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <!-- Username -->
              <div class="space-y-2">
                <label for="username" class="text-sm font-medium text-slate-300 ml-1">Nome de Usuário</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign class="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="username"
                    v-model="form.username"
                    type="text"
                    required
                    placeholder="ex: admin"
                    class="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <!-- Email -->
              <div class="space-y-2 md:col-span-2">
                <label for="email" class="text-sm font-medium text-slate-300 ml-1">E-mail</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail class="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    required
                    placeholder="admin@escritorio.com"
                    class="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <!-- Password -->
              <div class="space-y-2">
                <label for="password" class="text-sm font-medium text-slate-300 ml-1">Senha</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock class="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    v-model="form.password"
                    type="password"
                    required
                    placeholder="••••••••"
                    class="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <!-- Confirm Password -->
              <div class="space-y-2">
                <label for="confirmPassword" class="text-sm font-medium text-slate-300 ml-1">Confirmar Senha</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock class="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    class="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
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
            <div v-if="errorMessage" class="flex items-center gap-2 p-4 rounded-xl bg-red-900/20 border border-red-800/30 text-red-400 text-sm">
              <AlertCircle class="h-5 w-5 shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <!-- Success Message -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
          >
            <div v-if="successMessage" class="flex items-center gap-2 p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 text-sm">
              <CheckCircle2 class="h-5 w-5 shrink-0" />
              <span>{{ successMessage }}</span>
            </div>
          </Transition>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading || !!successMessage"
            class="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
          >
            <Loader2 v-if="loading" class="animate-spin -ml-1 mr-2 h-5 w-5" />
            {{ loading ? 'Configurando...' : 'Finalizar Configuração' }}
          </button>
        </form>
      </div>

      <!-- Footer Info -->
      <p class="text-center mt-8 text-slate-500 text-sm">
        &copy; {{ new Date().getFullYear() }} Sistema Jurídico. Gestão Inteligente para Advogados.
      </p>
    </div>
  </div>
</template>

<style scoped>
input:focus {
  --tw-ring-offset-color: #0a0f1c;
}
</style>
