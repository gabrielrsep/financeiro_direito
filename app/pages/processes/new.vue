<script setup lang="ts">
const router = useRouter()

useHead({
  title: 'Novo Processo'
})
</script>

<template>
  <ProcessForm
    mode="create"
    @cancel="router.push('/processes')"
    @saved="id => router.push('/processes/' + id)"
  />
</template>
