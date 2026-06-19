<script setup lang="ts">
const router = useRouter()

useHead({
  title: 'Novo servico'
})
</script>

<template>
  <ServiceForm
    mode="create"
    @cancel="router.push('/services')"
    @saved="id => router.push('/services/' + id)"
  />
</template>
