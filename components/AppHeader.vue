<script setup lang="ts">
const { user, clear } = useUserSession()

const logout = async () => {
  await clear()
  await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  navigateTo('/login')
}
</script>

<template>
  <header class="glass-panel border-b border-slate-800/80 sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Logo & Navigation -->
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="flex items-center gap-2.5 font-bold text-lg text-white group">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h10" />
              <path d="M7 12h10" />
              <path d="M7 17h10" />
            </svg>
          </div>
          <span class="tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            TCG Tracker
          </span>
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            to="/"
            class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white hover:bg-slate-800/60"
            active-class="!text-emerald-400 !bg-emerald-500/10"
          >
            Dashboard & Matchs
          </NuxtLink>
          <NuxtLink
            to="/archetypes"
            class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white hover:bg-slate-800/60"
            active-class="!text-emerald-400 !bg-emerald-500/10"
          >
            Mes Archétypes
          </NuxtLink>
          <NuxtLink
            v-if="user?.role === 'admin'"
            to="/admin/games"
            class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition text-purple-300 hover:text-white hover:bg-purple-500/10"
            active-class="!text-purple-400 !bg-purple-500/20"
          >
            Administration Jeux
          </NuxtLink>
        </nav>
      </div>

      <!-- User Profile & Action -->
      <div v-if="user" class="flex items-center gap-4">
        <div class="flex items-center gap-3">
          <img
            v-if="user.avatar"
            :src="user.avatar"
            :alt="user.username"
            class="w-8 h-8 rounded-full border border-slate-700 object-cover"
          />
          <div
            v-else
            class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300"
          >
            {{ user.username?.slice(0, 2).toUpperCase() }}
          </div>
          <div class="hidden sm:block text-left text-xs">
            <div class="font-medium text-slate-200 leading-tight">
              {{ user.globalName || user.username }}
            </div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span
                v-if="user.role === 'admin'"
                class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30"
              >
                Admin
              </span>
              <span
                v-else
                class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400"
              >
                Joueur
              </span>
            </div>
          </div>
        </div>

        <button
          @click="logout"
          title="Se déconnecter"
          class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      <div v-else>
        <NuxtLink
          to="/login"
          class="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
        >
          Connexion
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
