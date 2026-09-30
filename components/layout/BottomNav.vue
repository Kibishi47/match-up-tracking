<script setup lang="ts">
const { user } = useUserSession()
const route = useRoute()

// Ne pas afficher sur la page de login
const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <nav
    v-if="user && !isLoginPage"
    aria-label="Navigation mobile principale"
    class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-safe transition-colors duration-200 shadow-lg"
  >
    <div class="flex items-center justify-around h-16 px-2">
      <!-- 1. Dashboard -->
      <NuxtLink
        to="/"
        class="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-150 active:scale-95 group"
        active-class="!text-emerald-600 dark:!text-emerald-400 font-semibold"
      >
        <div class="relative p-1">
          <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="16" rx="1" />
          </svg>
        </div>
        <span class="text-[11px] leading-tight tracking-tight mt-0.5">
          Dashboard
        </span>
      </NuxtLink>

      <!-- 2. Archétypes -->
      <NuxtLink
        to="/archetypes"
        class="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-150 active:scale-95 group"
        active-class="!text-emerald-600 dark:!text-emerald-400 font-semibold"
      >
        <div class="relative p-1">
          <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="16" height="20" x="4" y="2" rx="2" />
            <line x1="8" x2="16" y1="6" y2="6" />
            <line x1="8" x2="16" y1="10" y2="10" />
            <line x1="8" x2="12" y1="14" y2="14" />
          </svg>
        </div>
        <span class="text-[11px] leading-tight tracking-tight mt-0.5">
          Archétypes
        </span>
      </NuxtLink>

      <!-- 3. Admin (Conditionnel si rôle admin) -->
      <NuxtLink
        v-if="user?.role === 'admin'"
        to="/admin/games"
        class="flex flex-col items-center justify-center flex-1 py-1 px-1 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition duration-150 active:scale-95 group"
        active-class="!text-purple-600 dark:!text-purple-400 font-semibold"
      >
        <div class="relative p-1">
          <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <span class="text-[11px] leading-tight tracking-tight mt-0.5">
          Admin
        </span>
      </NuxtLink>
    </div>
  </nav>
</template>
