<script setup lang="ts">
import AppDropdown from '~/components/ui/AppDropdown.vue'
import ManageGamesModal from '~/components/games/ManageGamesModal.vue'
import CreateMetaModal from '~/components/metas/CreateMetaModal.vue'

const { user, clear } = useUserSession()
const { games, activeGameId, activeGame, setActiveGame, isSessionReady } = useGameSession()
const { metas, activeMetaId, activeMeta, setActiveMeta, refreshMetas } = useMetaSession()

const isManageGamesOpen = ref(false)
const isCreateMetaOpen = ref(false)

const gameOptions = computed(() => {
  const sorted = [...(games.value || [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  )
  return sorted.map(g => ({
    value: g.id,
    label: g.name,
    iconUrl: g.logoUrl
  }))
})

const metaOptions = computed(() => {
  return (metas.value || []).map(m => ({
    value: m.id,
    label: m.name
  }))
})

const handleMetaCreated = async (newMeta: any) => {
  await refreshMetas()
  setActiveMeta(newMeta.id)
}

const logout = async () => {
  await clear()
  await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  navigateTo('/login')
}
</script>

<template>
  <header class="glass-panel border-b border-slate-800/80 sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <!-- Logo & Navigation -->
      <div class="flex items-center gap-6 sm:gap-8">
        <NuxtLink to="/" class="flex items-center gap-2.5 font-bold text-lg text-white group flex-shrink-0">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h10" />
              <path d="M7 12h10" />
              <path d="M7 17h10" />
            </svg>
          </div>
          <span class="hidden sm:inline tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            TCG Tracker
          </span>
        </NuxtLink>

        <!-- Sélecteur Global de TCG dans le Header (Gabarit fixe w-52 h-9 anti-CLS) -->
        <div v-if="user" class="w-52 h-9 flex-shrink-0 flex items-center">
          <!-- Skeleton 1:1 pendant le chargement initial -->
          <div
            v-if="!isSessionReady"
            class="w-full h-full bg-slate-800/80 animate-pulse rounded-xl border border-slate-700/60"
          />
          <!-- Dropdown des jeux disponibles -->
          <div v-else-if="games && games.length > 0" class="w-full h-full">
            <AppDropdown
              :model-value="activeGameId"
              :options="gameOptions"
              placeholder="Choisir un TCG..."
              menu-width-class="w-64"
              button-class="w-52 h-9"
              footer-action-label="Gérer mes jeux"
              @footer-click="isManageGamesOpen = true"
              @change="setActiveGame"
            />
          </div>
          <!-- État 0 jeu en collection : bouton pour ouvrir la modale sans décaler -->
          <div v-else class="w-full h-full">
            <button
              type="button"
              @click="isManageGamesOpen = true"
              class="w-full h-full flex items-center justify-between text-xs text-slate-400 hover:text-emerald-400 bg-slate-900/60 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 px-3 transition cursor-pointer"
            >
              <span>+ Gérer mes jeux</span>
              <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="20" height="12" x="2" y="6" rx="6" />
                <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Sélecteur Global de Méta / Format (Gabarit w-44 h-9) -->
        <div v-if="user && activeGameId && metas && metas.length > 0" class="w-44 h-9 flex-shrink-0 flex items-center">
          <AppDropdown
            :model-value="activeMetaId"
            :options="metaOptions"
            placeholder="Méta / Format..."
            menu-width-class="w-56"
            button-class="w-44 h-9"
            footer-action-label="+ Nouvelle méta"
            @footer-click="isCreateMetaOpen = true"
            @change="setActiveMeta"
          />
        </div>

        <!-- Liens de navigation -->
        <nav class="hidden lg:flex items-center gap-1">
          <NuxtLink
            to="/"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white hover:bg-slate-800/60"
            active-class="!text-emerald-400 !bg-emerald-500/10"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/archetypes"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition text-slate-300 hover:text-white hover:bg-slate-800/60"
            active-class="!text-emerald-400 !bg-emerald-500/10"
          >
            Archétypes
          </NuxtLink>
          <NuxtLink
            v-if="user?.role === 'admin'"
            to="/admin/games"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition text-purple-300 hover:text-white hover:bg-purple-500/10"
            active-class="!text-purple-400 !bg-purple-500/20"
          >
            Admin Jeux
          </NuxtLink>
        </nav>
      </div>

      <!-- Profil Utilisateur & Déconnexion -->
      <div v-if="user" class="flex items-center gap-3">
        <div class="flex items-center gap-2.5">
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
            <div class="font-medium text-slate-200 leading-tight truncate max-w-[120px]">
              {{ user.username }}
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
    <!-- Modale de gestion des jeux de l'utilisateur -->
    <ManageGamesModal
      :is-open="isManageGamesOpen"
      @close="isManageGamesOpen = false"
    />

    <!-- Modale de création d'une nouvelle méta -->
    <CreateMetaModal
      :is-open="isCreateMetaOpen"
      :game-id="activeGameId"
      :game-name="activeGame?.name"
      :source-meta-id="activeMetaId"
      @close="isCreateMetaOpen = false"
      @created="handleMetaCreated"
    />
  </header>
</template>
