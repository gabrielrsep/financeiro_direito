<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Recuperar Senha</h1>
        <p class="text-slate-400">Informe seu email para receber um link de recuperação</p>
      </div>

      <!-- Form Card -->
      <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 shadow-xl">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email Input -->
          <div class="relative">
            <label for="email" class="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="seu@email.com"
                :disabled="isLoading"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <!-- Email validation error -->
            <Transition name="fade">
              <p v-if="emailError" class="mt-2 text-sm text-red-400 flex items-center gap-2">
                <AlertCircle class="w-4 h-4" />
                {{ emailError }}
              </p>
            </Transition>
          </div>

          <!-- Error Message -->
          <Transition name="fade">
            <div v-if="errorMessage" class="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p class="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle class="w-4 h-4 flex-shrink-0" />
                {{ errorMessage }}
              </p>
            </div>
          </Transition>

          <!-- Rate Limit Warning -->
          <Transition name="fade">
            <div v-if="remainingSeconds > 0" class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p class="text-sm text-yellow-400">
                Por favor, aguarde <strong>{{ remainingSeconds }}s</strong> antes de tentar novamente
              </p>
            </div>
          </Transition>

          <!-- Success Message -->
          <Transition name="fade">
            <div v-if="successMessage" class="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p class="text-sm text-green-400 flex items-center gap-2">
                <CheckCircle class="w-4 h-4 flex-shrink-0" />
                {{ successMessage }}
              </p>
            </div>
          </Transition>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading || remainingSeconds > 0 || !email"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span v-else>{{ remainingSeconds > 0 ? `Aguarde ${remainingSeconds}s` : 'Enviar Link de Recuperação' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="my-6 flex items-center gap-4">
          <div class="flex-1 h-px bg-slate-700"></div>
          <span class="text-xs text-slate-500">ou</span>
          <div class="flex-1 h-px bg-slate-700"></div>
        </div>

        <!-- Back to Login Link -->
        <NuxtLink
          to="/login"
          class="block w-full text-center text-slate-400 hover:text-slate-300 font-medium py-2 px-4 rounded-lg hover:bg-slate-700/30 transition-colors"
        >
          Voltar ao Login
        </NuxtLink>
      </div>

      <!-- Help Text -->
      <p class="text-center text-slate-500 text-sm mt-6">
        Um link de recuperação será enviado para o email informado. O link expira em 1 hora.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Mail, AlertCircle, Loader2, CheckCircle } from 'lucide-vue-next';
import { useToastStore } from '~/stores/toast';

definePageMeta({
  layout: false,
});

const toastStore = useToastStore();
const router = useRouter();

const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const emailError = ref('');
const remainingSeconds = ref(0);

// ===== Simple email validation =====
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ===== Get rate limit from localStorage =====
const getLastAttemptTime = (): number => {
  const stored = localStorage.getItem(`recovery_attempt_${email.value.toLowerCase()}`);
  return stored ? parseInt(stored, 10) : 0;
};

// ===== Set rate limit in localStorage =====
const setRateLimit = (): void => {
  const now = Date.now();
  localStorage.setItem(`recovery_attempt_${email.value.toLowerCase()}`, now.toString());
};

// ===== Check remaining cooldown time =====
const checkRemainingTime = (): void => {
  if (!email.value) {
    remainingSeconds.value = 0;
    return;
  }

  const lastAttempt = getLastAttemptTime();
  if (lastAttempt === 0) {
    remainingSeconds.value = 0;
    return;
  }

  const elapsed = (Date.now() - lastAttempt) / 1000;
  const remaining = Math.max(0, Math.ceil(60 - elapsed));

  if (remaining > 0) {
    remainingSeconds.value = remaining;
    // Schedule next update
    setTimeout(checkRemainingTime, 1000);
  } else {
    remainingSeconds.value = 0;
  }
};

// ===== Watch email changes =====
watch(email, () => {
  emailError.value = '';
  checkRemainingTime();
});

// ===== Handle form submission =====
const handleSubmit = async (): Promise<void> => {
  // Clear previous errors
  errorMessage.value = '';
  successMessage.value = '';
  emailError.value = '';

  // Validate email format
  if (!email.value.trim()) {
    emailError.value = 'Email é obrigatório';
    return;
  }

  if (!isValidEmail(email.value)) {
    emailError.value = 'Por favor, informe um email válido';
    return;
  }

  // Check rate limit
  const lastAttempt = getLastAttemptTime();
  if (lastAttempt > 0) {
    const elapsed = (Date.now() - lastAttempt) / 1000;
    if (elapsed < 60) {
      const remaining = Math.ceil(60 - elapsed);
      remainingSeconds.value = remaining;
      errorMessage.value = `Por favor, aguarde ${remaining}s antes de tentar novamente`;
      return;
    }
  }

  isLoading.value = true;

  try {
    await $fetch('/api/auth/recovery-password', {
      method: 'POST',
      body: { email: email.value.trim() },
    });

    // Success
    setRateLimit();
    successMessage.value = 'Link de recuperação enviado! Verifique seu email.';
    toastStore.success('Link de recuperação enviado com sucesso');

    // Reset form after 2 seconds
    setTimeout(() => {
      email.value = '';
      successMessage.value = '';
      checkRemainingTime();
    }, 2000);
  } catch (error: any) {
    const statusCode = error.data?.statusCode;

    if (statusCode === 404) {
      // User not found - show generic message for security
      errorMessage.value = 'Email não encontrado no sistema';
    } else if (statusCode === 429) {
      // Rate limited
      setRateLimit();
      remainingSeconds.value = 60;
      errorMessage.value = 'Muitas tentativas. Por favor, aguarde 60 segundos antes de tentar novamente.';
    } else if (statusCode === 400) {
      errorMessage.value = error.data?.statusMessage || 'Email é obrigatório';
    } else {
      errorMessage.value = 'Erro ao enviar link de recuperação. Tente novamente.';
    }

    toastStore.error(errorMessage.value, false);
  } finally {
    isLoading.value = false;
  }
};

// ===== Check rate limit on component mount =====
onMounted(() => {
  checkRemainingTime();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
