<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased transition-colors duration-300">
    <nav class="border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-colors">
      <div class="flex h-16 items-center px-4 container mx-auto justify-between">
        <div class="flex items-center">
          <NuxtLink class="mr-6 flex items-center space-x-2" to="/">
            <span class="font-bold text-slate-900 dark:text-white">
              Lei & $
            </span>
          </NuxtLink>
          <nav class="flex items-center space-x-6 text-sm font-medium">
            <NuxtLink to="/" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Dashboard</NuxtLink>
            <NuxtLink to="/clients" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Clientes</NuxtLink>
            <NuxtLink to="/processes" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Processos</NuxtLink>
            <NuxtLink to="/gastos" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Contas a Receber</NuxtLink>
            <NuxtLink to="/gastos/escritorio" class="transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400">Gastos Escritório</NuxtLink>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
    <main class="container mx-auto py-6">
      <NuxtPage />
    </main>
    <AppToast />
  </div>
</template>
