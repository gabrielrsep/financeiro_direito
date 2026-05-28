<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-white mb-2">Resetar Senha</h1>
        <p class="text-slate-400">Informe sua nova senha para recuperar o acesso à conta</p>
      </div>

      <!-- Form Card -->
      <div class="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-8 shadow-xl">
        <!-- Invalid/Expired Token Message -->
        <Transition name="fade">
          <div v-if="tokenInvalid" class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p class="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle class="w-4 h-4 flex-shrink-0" />
              {{ tokenError }}
            </p>
            <button
              @click="redirectToRecovery"
              class="mt-3 w-full text-center text-red-400 hover:text-red-300 font-medium py-2 px-4 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Solicitar novo link de recuperação
            </button>
          </div>
        </Transition>

        <!-- Form (hidden if token is invalid) -->
        <form v-if="!tokenInvalid" @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Password Input -->
          <div class="relative">
            <label for="password" class="block text-sm font-medium text-slate-300 mb-2">
              Nova Senha
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                :disabled="isLoading"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <!-- Password validation feedback -->
            <Transition name="fade">
              <div v-if="password" class="mt-2 space-y-1">
                <p :class="['text-xs flex items-center gap-2', password.length >= 8 ? 'text-green-400' : 'text-slate-400']">
                  <CheckCircle v-if="password.length >= 8" class="w-3 h-3" />
                  <Circle v-else class="w-3 h-3" />
                  Mínimo 8 caracteres
                </p>
              </div>
            </Transition>
          </div>

          <!-- Password Confirmation Input -->
          <div class="relative">
            <label for="password-confirmation" class="block text-sm font-medium text-slate-300 mb-2">
              Confirmar Senha
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              <input
                id="password-confirmation"
                v-model="passwordConfirmation"
                type="password"
                placeholder="Repita a mesma senha"
                :disabled="isLoading"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <!-- Password confirmation validation feedback -->
            <Transition name="fade">
              <div v-if="passwordConfirmation" class="mt-2">
                <p :class="['text-xs flex items-center gap-2', passwordMatch ? 'text-green-400' : 'text-red-400']">
                  <CheckCircle v-if="passwordMatch" class="w-3 h-3" />
                  <AlertCircle v-else class="w-3 h-3" />
                  {{ passwordMatch ? 'Senhas conferem' : 'As senhas não conferem' }}
                </p>
              </div>
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
            :disabled="isLoading || !isFormValid"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span v-else>Resetar Senha</span>
          </button>
        </form>

        <!-- Divider -->
        <div v-if="!tokenInvalid" class="my-6 flex items-center gap-4">
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
        Sua senha será atualizada e você poderá fazer login com a nova senha.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, AlertCircle, Loader2, CheckCircle, Circle } from 'lucide-vue-next';
import { useToastStore } from '~/stores/toast';

definePageMeta({
  layout: false,
});

const router = useRouter();
const route = useRoute();
const toastStore = useToastStore();

const password = ref('');
const passwordConfirmation = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const tokenInvalid = ref(false);
const tokenError = ref('');
const token = ref('');

// ===== Computed properties =====
const passwordMatch = computed(() => {
  if (!password.value || !passwordConfirmation.value) return false;
  return password.value === passwordConfirmation.value;
});

const isFormValid = computed(() => {
  return (
    password.value.length >= 8 &&
    passwordConfirmation.value.length >= 8 &&
    passwordMatch.value &&
    !isLoading.value
  );
});

// ===== Redirect to password recovery =====
const redirectToRecovery = (): void => {
  router.push('/password-recovery');
};

// ===== Handle form submission =====
const handleSubmit = async (): Promise<void> => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!isFormValid.value) {
    errorMessage.value = 'Por favor, verifique os campos acima';
    return;
  }

  isLoading.value = true;

  try {
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      query: { token: token.value },
      body: {
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      },
    });

    successMessage.value = 'Senha resetada com sucesso! Redirecionando para login...';
    toastStore.success('Senha resetada com sucesso');

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (error: any) {
    const statusCode = error.data?.statusCode;
    const message = error.data?.statusMessage || error.message;

    if (statusCode === 401) {
      // Token expired
      tokenInvalid.value = true;
      tokenError.value = 'Seu link de recuperação expirou. Por favor, solicite um novo.';
      toastStore.error(tokenError.value, false);
    } else if (statusCode === 400) {
      // Validation error (mismatch, too short, etc.)
      errorMessage.value = message || 'Erro na validação da senha. Tente novamente.';
      toastStore.error(errorMessage.value, false);
    } else if (statusCode === 404) {
      // User not found
      tokenInvalid.value = true;
      tokenError.value = 'Usuário não encontrado. Por favor, faça login ou tente recuperar a senha novamente.';
      toastStore.error(tokenError.value, false);
    } else {
      errorMessage.value = 'Erro ao resetar senha. Tente novamente.';
      toastStore.error(errorMessage.value, false);
    }
  } finally {
    isLoading.value = false;
  }
};

// ===== Validate token on component mount =====
onMounted(() => {
  const tokenParam = route.query.token as string;

  if (!tokenParam) {
    tokenInvalid.value = true;
    tokenError.value = 'Token de recuperação não fornecido. Por favor, verifique o link.';
    toastStore.error(tokenError.value, false);
    return;
  }

  token.value = tokenParam;
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
