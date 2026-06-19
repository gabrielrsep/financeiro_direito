<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const processId = route.params.id as string

const { data: response, pending, error } = await useFetch(`/api/processes/${processId}`)

const process = computed(() => {
  const data = response.value as { data?: any } | null
  return data?.data || null
})

useHead({
  title: computed(() => `Editar Processo: ${process.value?.process_number || ''}`)
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900 dark:border-white"></div>
      <p class="text-slate-500 dark:text-slate-400">Carregando processo...</p>
    </div>

    <div v-else-if="error || !process" class="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/10">
      <h1 class="mb-2 text-xl font-bold text-red-800 dark:text-red-400">Erro ao carregar processo</h1>
      <p class="text-red-600 dark:text-red-300">{{ error?.message || 'Processo não encontrado no sistema.' }}</p>
      <NuxtLink to="/processes" class="mt-4 inline-block text-sm font-medium underline">Retornar à lista</NuxtLink>
    </div>

    <ProcessForm
      v-else
      mode="edit"
      :initialProcess="process"
      @cancel="router.push(`/processes/${processId}`)"
      @saved="router.push(`/processes/${processId}`)"
    />
  </div>
</template>
