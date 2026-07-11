<script setup lang="ts">
const { user, loggedIn } = useUserSession()
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased transition-colors duration-300">
    <nav v-if="loggedIn" class="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors">
      <div class="flex h-16 items-center px-4 container mx-auto justify-between">
        <div class="flex items-center">
          <NuxtLink class="mr-6 flex items-center space-x-2" to="/">
            <span class="font-bold text-slate-900 dark:text-white">
              Lei & $
            </span>
          </NuxtLink>
          <nav class="flex items-center space-x-6 text-sm font-medium">
            <NuxtLink to="/" active-class="bg-blue-100 dark:bg-blue-900 dark:text-white px-2.5 py-0.5 rounded-full font-semibold" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Dashboard</NuxtLink>
            <NuxtLink to="/clients" active-class="bg-blue-100 dark:bg-blue-900 dark:text-white px-2.5 py-0.5 rounded-full font-semibold" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Clientes</NuxtLink>
            <NuxtLink to="/processes" active-class="bg-blue-100 dark:bg-blue-900 dark:text-white px-2.5 py-0.5 rounded-full font-semibold" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Processos</NuxtLink>
            <NuxtLink to="/services" active-class="bg-blue-100 dark:bg-blue-900 dark:text-white px-2.5 py-0.5 rounded-full font-semibold" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Serviços</NuxtLink>
            <NuxtLink to="/financial/" active-class="bg-blue-100 dark:bg-blue-900 dark:text-white px-2.5 py-0.5 rounded-full font-semibold" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Pagamentos</NuxtLink>
            <NuxtLink to="/gastos/escritorio" active-class="bg-blue-100 dark:bg-blue-900 dark:text-white px-2.5 py-0.5 rounded-full font-semibold" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Gastos Escritório</NuxtLink>
            <NuxtLink v-if="!user?.office_id" to="/offices" active-class="bg-blue-100 dark:bg-blue-900 dark:text-white px-2.5 py-0.5 rounded-full font-semibold" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Escritórios</NuxtLink>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <UserMenu />
          <ThemeSwitcher />
        </div>
      </div>
      <NuxtLoadingIndicator/>
    </nav>
    
    <main class="container mx-auto py-6">
      <slot />
    </main>

    <AppToast />
  </div>
</template>
