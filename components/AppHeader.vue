<script setup lang="ts">
import ManageGamesModal from '~/components/games/ManageGamesModal.vue'
import GameMetaModal from '~/components/modal/GameMetaModal.vue'

const { user, clear } = useUserSession()
const { games, activeGameId, activeGame, setActiveGame, isSessionReady } = useGameSession()
const { metas, activeMetaId, activeMeta, setActiveMeta, refreshMetas } = useMetaSession()

const isManageGamesOpen = ref(false)
const isGameMetaModalOpen = ref(false)

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
      <div class="flex items-center gap-4 sm:gap-6">
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

        <!-- Sélecteur Unifié Permanent [ 🎮 JEU — META ] (Jamais masqué) -->
        <div v-if="user" class="flex-shrink-0 flex items-center">
          <!-- Skeleton anti-CLS pendant le chargement initial -->
          <div
            v-if="!isSessionReady"
            class="h-9 w-48 bg-slate-800/80 animate-pulse rounded-xl border border-slate-700/60"
          />

          <!-- Badge cliquable unifié permanent -->
          <button
            v-else
            type="button"
            @click="isGameMetaModalOpen = true"
            class="h-9 max-w-[280px] sm:max-w-[340px] px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/60 text-slate-200 hover:text-white transition duration-200 flex items-center gap-2 shadow-sm cursor-pointer group"
            title="Changer de jeu ou de format/méta"
          >
            <!-- Logo du jeu ou icône générique -->
            <span class="text-base flex-shrink-0 leading-none">🎮</span>

            <!-- Nom du Jeu — Méta -->
            <div class="flex items-center gap-1.5 text-xs truncate">
              <span class="font-bold text-white truncate">
                {{ activeGame?.name || 'Aucun jeu' }}
              </span>
              <span class="text-slate-500 font-semibold">—</span>
              <span
                :class="[
                  'truncate font-medium',
                  activeMeta ? 'text-emerald-400' : 'text-amber-400/90 italic'
                ]"
              >
                {{ activeMeta?.name || 'Aucune méta' }}
              </span>
            </div>

            <!-- Chevron indicateur -->
            <svg
              class="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-y-0.5 transition flex-shrink-0 ml-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
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

    <!-- Modale unifiée Jeu & Méta -->
    <GameMetaModal
      :is-open="isGameMetaModalOpen"
      @close="isGameMetaModalOpen = false"
      @open-manage-games="isManageGamesOpen = true; isGameMetaModalOpen = false"
    />
  </header>
</template>
