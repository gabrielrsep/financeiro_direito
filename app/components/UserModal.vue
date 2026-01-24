<script setup lang="ts">
import { X, User, Mail, Lock, CheckCircle, Camera } from 'lucide-vue-next'

const props = defineProps<{
  user?: any
  isOpen: boolean
}>()

const emit = defineEmits(['close', 'saved'])

const form = ref({
  name: '',
  username: '',
  email: '',
  password: ''
})

const fileInput = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarFile = ref<File | null>(null)

const loading = ref(false)
const error = ref('')

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.user) {
      form.value = {
        name: props.user.name || '',
        username: props.user.username || '',
        email: props.user.email || '',
        password: '' // Don't fill password on edit
      }
      avatarPreview.value = props.user.avatar_url || null
    } else {
      form.value = {
        name: '',
        username: '',
        email: '',
        password: ''
      }
      avatarPreview.value = null
    }
    avatarFile.value = null
    error.value = ''
  }
})

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    avatarFile.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleSubmit() {
  loading.value = true
  error.value = ''
  
  try {
    const url = props.user ? `/api/users/${props.user.id}` : '/api/users'
    const method = props.user ? 'PUT' : 'POST'
    
    const formData = new FormData()
    formData.append('name', form.value.name)
    formData.append('username', form.value.username)
    formData.append('email', form.value.email)
    if (form.value.password) {
      formData.append('password', form.value.password)
    }
    if (avatarFile.value) {
      formData.append('avatar_url', avatarFile.value)
    }

    await $fetch(url, {
      method,
      body: formData
    })
    
    emit('saved')
    emit('close')
  } catch (err: any) {
    error.value = err.data?.message || 'Erro ao salvar usuário'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div class="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 class="text-xl font-bold text-slate-900 dark:text-white flex items-center">
          <User class="w-5 h-5 mr-2 text-slate-500" />
          {{ user ? 'Editar Usuário' : 'Novo Usuário' }}
        </h2>
        <button @click="$emit('close')" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 flex-1 overflow-y-auto overscroll-contain">
        <div v-if="error" class="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30">
          {{ error }}
        </div>

        <!-- Avatar Upload -->
        <div class="flex flex-col items-center justify-center space-y-3">
          <div class="relative group cursor-pointer" @click="triggerFileInput">
            <div class="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500">
              <img v-if="avatarPreview" :src="avatarPreview" class="w-full h-full object-cover" alt="Preview" />
              <User v-else class="w-10 h-10 text-slate-400" />
            </div>
            <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera class="w-8 h-8 text-white" />
            </div>
            <input 
              ref="fileInput"
              type="file" 
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
          </div>
          <span class="text-xs text-slate-500 dark:text-slate-400">Clique para adicionar uma foto</span>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="form.name" 
              type="text" 
              required
              class="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
              placeholder="Ex: João Silva"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Usuário (Login)</label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="form.username" 
              type="text" 
              required
              class="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
              placeholder="Ex: joao.silva"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="form.email" 
              type="email" 
              required
              class="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
              placeholder="Ex: joao@escritorio.com"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
            Senha {{ user ? '(deixe em branco para manter)' : '' }}
          </label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              v-model="form.password" 
              type="password" 
              :required="!user"
              class="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button" 
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            :disabled="loading"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
          >
            <CheckCircle v-if="!loading" class="w-4 h-4 mr-2" />
            <span v-if="loading" class="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ user ? 'Salvar Alterações' : 'Criar Usuário' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
