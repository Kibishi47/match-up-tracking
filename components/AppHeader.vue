<script setup lang="ts">
import ManageGamesModal from '~/components/games/ManageGamesModal.vue'
import GameMetaModal from '~/components/modal/GameMetaModal.vue'
import ProfileDropdown from '~/components/ui/ProfileDropdown.vue'
import AppLogo from '~/components/ui/AppLogo.vue'

const { user, clear } = useUserSession()
const { games, activeGameId, activeGame, setActiveGame, isSessionReady } = useGameSession()
const { metas, activeMetaId, activeMeta, setActiveMeta, refreshMetas } = useMetaSession()

const isManageGamesOpen = ref(false)
const isGameMetaModalOpen = ref(false)
</script>

<template>
  <header class="glass-panel border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <!-- Logo & Navigation -->
      <div class="flex items-center gap-3 sm:gap-6 min-w-0">
        <AppLogo class="flex-shrink-0" />

        <!-- Sélecteur Unifié Permanent [ JEU — META ] (Jamais masqué) -->
        <div v-if="user" class="flex-shrink-0 flex items-center min-w-0">
          <!-- Skeleton anti-CLS pendant le chargement initial -->
          <div
            v-if="!isSessionReady"
            class="h-9 w-40 sm:w-48 bg-slate-200 dark:bg-slate-800/80 animate-pulse rounded-xl border border-slate-300 dark:border-slate-700/60"
          />

          <!-- Badge cliquable unifié permanent -->
          <button
            v-else
            type="button"
            @click="isGameMetaModalOpen = true"
            class="h-9 max-w-[200px] min-[390px]:max-w-[240px] sm:max-w-[340px] px-2.5 sm:px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 hover:border-emerald-500/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition duration-200 flex items-center gap-1.5 sm:gap-2 shadow-sm cursor-pointer group flex-shrink-0"
            :title="$t('game_meta_modal.title')"
          >
            <!-- Logo du jeu ou icône SVG professionnelle -->
            <img
              v-if="activeGame?.logoUrl"
              :src="activeGame.logoUrl"
              :alt="activeGame.name"
              class="w-4 h-4 rounded object-cover flex-shrink-0"
            />
            <svg
              v-else
              class="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="20" height="12" x="2" y="6" rx="6" />
              <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
            </svg>

            <!-- Nom du Jeu — Méta -->
            <div class="flex items-center gap-1.5 text-xs truncate">
              <span class="font-bold text-slate-900 dark:text-white truncate">
                {{ activeGame?.name || $t('common.no_game') }}
              </span>
              <span class="text-slate-400 dark:text-slate-500 font-semibold flex-shrink-0">—</span>
              <span
                :class="[
                  'truncate font-medium',
                  activeMeta ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400/90 italic'
                ]"
              >
                {{ activeMeta?.name || $t('common.no_meta') }}
              </span>
            </div>
          </button>
        </div>

          <!-- Liens de navigation -->
        <nav class="hidden lg:flex items-center gap-1">
          <NuxtLink
            to="/"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            active-class="!text-emerald-600 dark:!text-emerald-400 !bg-emerald-500/10"
          >
            {{ $t('nav.dashboard') }}
          </NuxtLink>
          <NuxtLink
            to="/archetypes"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
            active-class="!text-emerald-600 dark:!text-emerald-400 !bg-emerald-500/10"
          >
            {{ $t('nav.archetypes') }}
          </NuxtLink>
          <NuxtLink
            v-if="user?.role === 'admin'"
            to="/admin/games"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition text-purple-600 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white hover:bg-purple-500/10"
            active-class="!text-purple-600 dark:!text-purple-400 !bg-purple-500/20"
          >
            {{ $t('nav.admin_games') }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Actions Droite : Profil & Connexion -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <div v-if="user">
          <ProfileDropdown />
        </div>

        <div v-else>
          <NuxtLink
            to="/login"
            class="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            {{ $t('login.login_btn') }}
          </NuxtLink>
        </div>
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
