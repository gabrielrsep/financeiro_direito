
<script setup lang="ts">
import type { User } from '#auth-utils';

const props = defineProps<{ user: Pick<User, 'avatar_url' | 'name'> }>()
</script>

<template>
    <img v-if="user?.avatar_url" :src="user.avatar_url" class="rounded w-full h-full object-cover" :alt="user.name" />
    <span v-else>{{ user?.name.substring(0, 2) }}</span>
</template>