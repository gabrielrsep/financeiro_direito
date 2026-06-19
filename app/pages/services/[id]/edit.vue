<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const serviceId = route.params.id as string

const { data: response, pending, error } = await useFetch(`/api/services/${serviceId}`)

const service = computed(() => {
  const data = response.value as { data?: any } | null
  return data?.data || null
})

useHead({
  title: computed(() => `Editar servico: ${service.value?.description || ''}`)
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="pending" class="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div class="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900 dark:border-white"></div>
      <p class="text-slate-500 dark:text-slate-400">Carregando servico...</p>
    </div>

    <div v-else-if="error || !service" class="rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/10">
      <h1 class="mb-2 text-xl font-bold text-red-800 dark:text-red-400">Erro ao carregar servico</h1>
      <p class="text-red-600 dark:text-red-300">{{ error?.message || 'Servico nao encontrado no sistema.' }}</p>
      <NuxtLink to="/services" class="mt-4 inline-block text-sm font-medium underline">Retornar a lista</NuxtLink>
    </div>

    <ServiceForm
      v-else
      mode="edit"
      :initialService="service"
      @cancel="router.push(`/services/${serviceId}`)"
      @saved="router.push(`/services/${serviceId}`)"
    />
  </div>
</template>
