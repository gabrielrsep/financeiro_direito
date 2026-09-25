
<script setup lang="ts">

const props = defineProps<{ user: any }>()
</script>

<template>
    <span>{{ user?.name?.substring(0, 2) }}</span>
</template>