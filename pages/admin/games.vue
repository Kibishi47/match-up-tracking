<script setup lang="ts">
import type { Game } from '~/server/db/schema'
import GameModal from '~/components/modal/GameModal.vue'

definePageMeta({
  middleware: 'admin'
})

const isGameModalOpen = ref(false)
const selectedGameToEdit = ref<Game | null>(null)
const searchQuery = ref('')

const { data: gamesList, refresh: refreshGames, status: loadingGames } = useLazyFetch<Game[]>('/api/admin/games')

const isLoading = computed(() => {
  return loadingGames.value === 'pending' && !gamesList.value
})

const { toast, confirmAction } = useNotify()
const { t } = useI18n()

const openCreateModal = () => {
  selectedGameToEdit.value = null
  isGameModalOpen.value = true
}

const openEditModal = (game: Game) => {
  selectedGameToEdit.value = game
  isGameModalOpen.value = true
}

const handleGameSaved = async () => {
  await refreshGames()
}

// Filtrage instantané des jeux par nom
const filteredGames = computed(() => {
  const list = gamesList.value || []
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter((game) => game.name.toLowerCase().includes(q))
})

const deleteGame = async (game: Game) => {
  const confirmed = await confirmAction({
    title: t('admin_games.delete_confirm_title', { name: game.name }),
    message: t('admin_games.delete_confirm_msg'),
    confirmText: t('admin_games.delete_confirm_btn'),
    cancelText: t('common.cancel'),
    isDestructive: true
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/admin/games/${game.id}`, { method: 'DELETE' })
    toast.success(t('admin_games.deleted_success', { name: game.name }))
    await refreshGames()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || t('admin_games.delete_error'))
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 pb-28 transition-colors">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-6">
      <!-- En-tête de la page -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {{ $t('admin_games.title') }}
            </h1>
            <span class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wider">
              {{ $t('admin_games.badge') }}
            </span>
          </div>
          <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {{ $t('admin_games.subtitle') }}
          </p>
        </div>

        <!-- Actions globales : Nouveau jeu & Actualiser -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            @click="openCreateModal"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{{ $t('admin_games.add_game') }}</span>
          </button>

          <button
            type="button"
            @click="refreshGames()"
            class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            :title="$t('admin_games.refresh')"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span class="hidden sm:inline">{{ $t('admin_games.refresh') }}</span>
          </button>
        </div>
      </div>

      <!-- Contenu principal : Barre de recherche + Grille des Jeux pleine largeur -->
      <div class="space-y-4">
        <!-- Barre de recherche instantanée & compteur -->
        <div class="glass-panel p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-md">
            <svg
              class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="$t('admin_games.search_placeholder')"
              class="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              :title="$t('common.cancel')"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <span>{{ $t('admin_games.configured_games', { count: filteredGames.length }, filteredGames.length) }}</span>
            <span v-if="searchQuery" class="text-emerald-600 dark:text-emerald-400">
              {{ $t('admin_games.filtered_on', { total: gamesList?.length || 0 }) }}
            </span>
          </div>
        </div>

        <!-- Chargement Skeleton -->
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="i in 8"
            :key="i"
            class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 animate-pulse flex flex-col justify-between h-28"
          >
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div class="space-y-2 flex-1 min-w-0">
                <div class="h-4 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
                <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>

        <!-- Aucun jeu enregistré -->
        <div
          v-else-if="!gamesList || gamesList.length === 0"
          class="glass-panel p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center shadow-sm"
        >
          <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-3 shadow-inner">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="20" height="12" x="2" y="6" rx="6" />
              <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('admin_games.no_games') }}</h3>
          <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            {{ $t('admin_games.no_games_desc') }}
          </p>
          <button
            type="button"
            @click="openCreateModal"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
          >
            <span>+ {{ $t('admin_games.create_first_game') }}</span>
          </button>
        </div>

        <!-- Aucun résultat de recherche -->
        <div
          v-else-if="filteredGames.length === 0"
          class="glass-panel p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center shadow-sm"
        >
          <p class="text-slate-600 dark:text-slate-300 text-sm font-semibold">
            {{ $t('admin_games.no_search_results', { query: searchQuery }) }}
          </p>
          <button
            type="button"
            @click="searchQuery = ''"
            class="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {{ $t('admin_games.reset_filter') }}
          </button>
        </div>

        <!-- Grille Responsive des Jeux -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="game in filteredGames"
            :key="game.id"
            class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 transition flex flex-col justify-between group overflow-hidden relative shadow-sm hover:shadow-md"
          >
            <div>
              <div class="flex items-center gap-3.5 mb-3">
                <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <img
                    v-if="game.logoUrl"
                    :src="game.logoUrl"
                    :alt="game.name"
                    class="w-full h-full object-contain p-1 group-hover:scale-105 transition duration-300"
                    @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                  />
                  <span v-else class="text-xl font-bold text-slate-400 dark:text-slate-500">
                    {{ game.name.slice(0, 1).toUpperCase() }}
                  </span>
                </div>

                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate" :title="game.name">
                    {{ game.name }}
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    TCG Card Game
                  </p>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-1.5 flex-wrap">
              <button
                type="button"
                @click="openEditModal(game)"
                class="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {{ $t('admin_games.modify') }}
              </button>
              <button
                type="button"
                @click="deleteGame(game)"
                class="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400/80 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                :title="$t('admin_games.delete')"
              >
                {{ $t('admin_games.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modale & Bottom Sheet Responsive Création / Édition de Jeu -->
    <GameModal
      :is-open="isGameModalOpen"
      :game="selectedGameToEdit"
      @close="isGameModalOpen = false"
      @saved="handleGameSaved"
    />
  </div>
</template>
