<script setup lang="ts">
import type { ArchetypeFormatStats, FormatStatsResponse } from '~/server/api/stats/meta.get'
import GameMetaModal from '~/components/modal/GameMetaModal.vue'

definePageMeta({
  middleware: 'auth'
})

const { t } = useI18n()

// 1. Session de Jeu & Méta partagées
const { activeGameId, activeGame, isSessionReady } = useGameSession()
const { activeMetaId, activeMeta } = useMetaSession()

const isGameMetaModalOpen = ref(false)
const searchQuery = ref('')
const activeTab = ref<'all' | 'played' | 'faced'>('all')
const sortBy = ref<'volume' | 'overall_wr' | 'played_wr' | 'faced_wr' | 'showrate' | 'name'>('volume')

// 2. Récupération réactive des statistiques de la méta
const {
  data: statsData,
  pending,
  refresh: refreshStats
} = useLazyFetch<FormatStatsResponse>('/api/stats/meta', {
  key: 'meta-format-stats',
  query: computed(() => ({
    gameId: activeGameId.value || undefined,
    metaId: activeMetaId.value || undefined
  })),
  watch: [activeGameId, activeMetaId]
})

const isLoading = computed(() => {
  return !isSessionReady.value || (pending.value && !statsData.value)
})

const overview = computed(() => {
  const d = statsData.value
  const fallback = d?.overview
  return {
    totalMatches: d?.totalMatches ?? fallback?.totalMatches ?? 0,
    totalWins: d?.totalWins ?? fallback?.totalWins ?? 0,
    totalLosses: d?.totalLosses ?? fallback?.totalLosses ?? 0,
    totalDraws: d?.totalDraws ?? fallback?.totalDraws ?? 0,
    overallWinrate: d?.overallWinrate ?? fallback?.overallWinrate ?? 0,
    archetypesCount: d?.archetypesCount ?? fallback?.archetypesCount ?? 0,
    mostPlayedDeck: d?.mostPlayedDeck ?? fallback?.mostPlayedArchetype ?? null,
    mostFacedDeck: d?.mostFacedDeck ?? (fallback?.mostFacedArchetype ? { id: fallback.mostFacedArchetype.id, name: fallback.mostFacedArchetype.name, total: fallback.mostFacedArchetype.total, showRate: fallback.mostFacedArchetype.showRate } : null)
  }
})

const allArchetypes = computed<ArchetypeFormatStats[]>(() => {
  return statsData.value?.archetypes || []
})

// 3. Filtrage et Tri
const filteredArchetypes = computed(() => {
  let list = [...allArchetypes.value]

  // Filtre par onglet
  if (activeTab.value === 'played') {
    list = list.filter((arch) => arch.played.total > 0)
  } else if (activeTab.value === 'faced') {
    list = list.filter((arch) => arch.faced.total > 0)
  }

  // Filtre par recherche textuelle
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((arch) => {
      const matchName = arch.name.toLowerCase().includes(q)
      const matchCard1 = arch.card1Name?.toLowerCase().includes(q) || false
      const matchCard2 = arch.card2Name?.toLowerCase().includes(q) || false
      return matchName || matchCard1 || matchCard2
    })
  }

  // Tri opérationnel selon les spécifications
  list.sort((a, b) => {
    switch (sortBy.value) {
      case 'volume':
        return b.distinctMatches - a.distinctMatches || b.overall.winrate - a.overall.winrate
      case 'overall_wr':
        return b.overall.winrate - a.overall.winrate || b.distinctMatches - a.distinctMatches
      case 'played_wr': {
        const aWr = a.played.winrate ?? -1
        const bWr = b.played.winrate ?? -1
        return bWr - aWr || b.played.total - a.played.total
      }
      case 'faced_wr': {
        const aWr = a.faced.winrate ?? -1
        const bWr = b.faced.winrate ?? -1
        return bWr - aWr || b.faced.total - a.faced.total
      }
      case 'showrate':
        return b.faced.showRate - a.faced.showRate || b.faced.total - a.faced.total
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  return list
})

// Helpers de couleur de winrate
const getWinrateBadgeClass = (rate: number | null, total: number) => {
  if (total === 0 || rate === null) return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
  if (rate >= 60) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  if (rate >= 50) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
  if (rate >= 40) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
  return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
}

const getWinrateBarClass = (rate: number | null) => {
  if (rate === null) return 'bg-slate-400'
  if (rate >= 60) return 'bg-emerald-500'
  if (rate >= 50) return 'bg-sky-500'
  if (rate >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 pb-28 transition-colors">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-6 sm:space-y-8">
      <!-- 1. En-tête de la page avec contexte Méta et bouton Actualiser -->
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {{ $t('stats_page.title') }}
            </h1>
            <span
              v-if="activeMeta"
              class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              {{ activeMeta.name }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {{ $t('stats_page.subtitle') }}
          </p>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <!-- Bouton rafraîchir compact et uniforme -->
          <button
            type="button"
            id="refresh-stats-btn"
            @click="refreshStats"
            :disabled="pending"
            :title="$t('stats_page.refresh')"
            class="inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <svg
              class="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0"
              :class="{ 'animate-spin': pending }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span class="ml-1.5 whitespace-nowrap">{{ $t('stats_page.refresh') }}</span>
          </button>
        </div>
      </header>

      <!-- 2. Cas d'erreur / Aucun Jeu ou Méta sélectionné -->
      <section
        v-if="!activeGameId || !activeMetaId"
        class="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 text-center bg-white/80 dark:bg-slate-900/60 shadow-sm"
      >
        <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          {{ $t('stats_page.empty.no_selection_title') }}
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
          {{ $t('stats_page.empty.no_selection_desc') }}
        </p>
        <button
          type="button"
          @click="isGameMetaModalOpen = true"
          class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
        >
          <span>{{ $t('stats_page.empty.select_format_btn') }}</span>
        </button>
      </section>

      <!-- Si Jeu et Méta sont bien sélectionnés -->
      <template v-else>
        <!-- 3. KPI Overview Hero Cards -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Skeleton Loading des KPI -->
          <template v-if="isLoading">
            <div
              v-for="i in 4"
              :key="i"
              class="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 animate-pulse space-y-3"
            >
              <div class="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div class="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div class="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </template>

          <template v-else>
            <!-- KPI 1 : Total Matchs Méta -->
            <div class="glass-panel p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/70 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>{{ $t('stats_page.kpi.total_matches') }}</span>
                <span class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-3xl font-black text-slate-900 dark:text-white">
                  {{ overview.totalMatches }}
                </span>
                <span class="text-xs text-slate-400 dark:text-slate-500">
                  {{ $t('deck_banner.matches') }}
                </span>
              </div>
              <div class="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ overview.totalWins }} Win</span>
                <span class="mx-1 opacity-40">•</span>
                <span class="text-rose-600 dark:text-rose-400 font-bold">{{ overview.totalLosses }} Loss</span>
                <template v-if="overview.totalDraws > 0">
                  <span class="mx-1 opacity-40">•</span>
                  <span class="text-amber-600 dark:text-amber-400 font-bold">{{ overview.totalDraws }} Draw</span>
                </template>
              </div>
            </div>

            <!-- KPI 2 : Winrate Global Méta -->
            <div class="glass-panel p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/70 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>{{ $t('stats_page.kpi.meta_winrate') }}</span>
                <span class="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v20" />
                    <path d="m17 5-5-3-5 3" />
                  </svg>
                </span>
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span
                  class="text-3xl font-black"
                  :class="overview.overallWinrate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'"
                >
                  {{ overview.overallWinrate }}%
                </span>
              </div>
              <!-- Barre de progression visuelle -->
              <div class="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="getWinrateBarClass(overview.overallWinrate)"
                  :style="{ width: `${overview.overallWinrate}%` }"
                />
              </div>
            </div>

            <!-- KPI 3 : Deck Joué le Plus Actif -->
            <div class="glass-panel p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/70 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>{{ $t('stats_page.kpi.most_played') }}</span>
                <span class="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="16" height="20" x="4" y="2" rx="2" />
                    <line x1="8" x2="16" y1="6" y2="6" />
                  </svg>
                </span>
              </div>
              <div v-if="overview.mostPlayedDeck" class="mt-2.5">
                <p class="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {{ overview.mostPlayedDeck.name }}
                </p>
                <div class="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>{{ overview.mostPlayedDeck.total }} {{ $t('deck_banner.matches') }}</span>
                  <span class="opacity-40">•</span>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">
                    {{ overview.mostPlayedDeck.winrate }}% WR
                  </span>
                </div>
              </div>
              <div v-else class="mt-3 text-sm text-slate-400 dark:text-slate-500 italic">
                {{ $t('stats_page.kpi.no_data') }}
              </div>
            </div>

            <!-- KPI 4 : Adversaire le Plus Affronté -->
            <div class="glass-panel p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/70 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>{{ $t('stats_page.kpi.most_faced') }}</span>
                <span class="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" x2="19" y1="8" y2="14" />
                    <line x1="22" x2="16" y1="11" y2="11" />
                  </svg>
                </span>
              </div>
              <div v-if="overview.mostFacedDeck" class="mt-2.5">
                <p class="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {{ overview.mostFacedDeck.name }}
                </p>
                <div class="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>{{ overview.mostFacedDeck.total }} {{ $t('deck_banner.matches') }}</span>
                  <span class="opacity-40">•</span>
                  <span class="font-bold text-purple-600 dark:text-purple-400">
                    {{ overview.mostFacedDeck.showRate }}% Show Rate
                  </span>
                </div>
              </div>
              <div v-else class="mt-3 text-sm text-slate-400 dark:text-slate-500 italic">
                {{ $t('stats_page.kpi.no_data') }}
              </div>
            </div>
          </template>
        </section>

        <!-- 4. Barre de Contrôle : Onglets (3 colonnes mobiles sans scroll) + Recherche + Tri explicite -->
        <section class="glass-panel p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
          <!-- Onglets de filtre : 3 colonnes égales sur mobile (zéro scroll), 1 ligne sans retour à la ligne sur desktop -->
          <div class="w-full sm:w-auto grid grid-cols-3 sm:flex sm:items-center p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl gap-1 flex-shrink-0">
            <button
              type="button"
              id="tab-all"
              @click="activeTab = 'all'"
              class="w-full sm:w-auto text-center py-2 px-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center whitespace-nowrap flex-shrink-0"
              :class="activeTab === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <span class="sm:hidden">{{ $t('stats_page.tabs.all_short') }}</span>
              <span class="hidden sm:inline whitespace-nowrap">{{ $t('stats_page.tabs.all') }}</span>
            </button>
            <button
              type="button"
              id="tab-played"
              @click="activeTab = 'played'"
              class="w-full sm:w-auto text-center py-2 px-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center whitespace-nowrap flex-shrink-0"
              :class="activeTab === 'played' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <span class="sm:hidden">{{ $t('stats_page.tabs.played_short') }}</span>
              <span class="hidden sm:inline whitespace-nowrap">{{ $t('stats_page.tabs.played') }}</span>
            </button>
            <button
              type="button"
              id="tab-faced"
              @click="activeTab = 'faced'"
              class="w-full sm:w-auto text-center py-2 px-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center whitespace-nowrap flex-shrink-0"
              :class="activeTab === 'faced' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            >
              <span class="sm:hidden">{{ $t('stats_page.tabs.faced_short') }}</span>
              <span class="hidden sm:inline whitespace-nowrap">{{ $t('stats_page.tabs.faced') }}</span>
            </button>
          </div>

          <!-- Recherche instantanée et Sélecteur de Tri explicite -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl lg:justify-end">
            <!-- Champ de recherche -->
            <div class="relative flex-1 min-w-[200px]">
              <input
                v-model="searchQuery"
                type="text"
                id="stats-search-input"
                :placeholder="$t('stats_page.search_placeholder')"
                class="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
              <svg
                class="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <button
                v-if="searchQuery"
                type="button"
                id="stats-search-clear"
                @click="searchQuery = ''"
                class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                :title="$t('common.reset')"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Sélecteur de Tri Explicite avec icône et label visible -->
            <div class="relative flex items-center bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition flex-shrink-0">
              <div class="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold pointer-events-none mr-2 flex-shrink-0">
                <svg class="w-4 h-4 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 8 4-4 4 4" />
                  <path d="M7 4v16" />
                  <path d="m21 16-4 4-4-4" />
                  <path d="M17 20V4" />
                </svg>
                <span>{{ $t('stats_page.sort.prefix') }}</span>
              </div>
              <select
                v-model="sortBy"
                id="stats-sort-select"
                class="w-full bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none pr-5 text-xs sm:text-sm"
              >
                <option value="volume">{{ $t('stats_page.sort.volume_desc') }}</option>
                <option value="overall_wr">{{ $t('stats_page.sort.overall_wr_desc') }}</option>
                <option value="played_wr">{{ $t('stats_page.sort.played_wr_desc') }}</option>
                <option value="faced_wr">{{ $t('stats_page.sort.faced_wr_desc') }}</option>
                <option value="showrate">{{ $t('stats_page.sort.showrate_desc') }}</option>
                <option value="name">{{ $t('stats_page.sort.name_asc') }}</option>
              </select>
              <svg
                class="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </section>

        <!-- 5. Liste des Archétypes avec Statistiques Détaillées (Overall + Joué + Affronté) -->
        <!-- État de chargement Skeleton -->
        <section v-if="isLoading" class="space-y-4">
          <div
            v-for="i in 5"
            :key="i"
            class="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 animate-pulse flex flex-col md:flex-row items-center gap-6"
          >
            <div class="flex items-center gap-4 w-full md:w-1/4">
              <div class="w-14 h-16 bg-slate-200 dark:bg-slate-800 rounded-lg flex-shrink-0" />
              <div class="space-y-2 flex-1">
                <div class="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div class="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-3/4">
              <div class="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div class="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div class="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
        </section>

        <!-- Cas d'aucun archétype enregistré dans la méta -->
        <section
          v-else-if="allArchetypes.length === 0"
          class="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 text-center bg-white/80 dark:bg-slate-900/60 shadow-sm"
        >
          <div class="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="16" height="20" x="4" y="2" rx="2" />
              <line x1="8" x2="16" y1="6" y2="6" />
            </svg>
          </div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {{ $t('stats_page.empty.no_archetypes_title') }}
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {{ $t('stats_page.empty.no_archetypes_desc') }}
          </p>
          <NuxtLink
            to="/archetypes"
            class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <span>+ {{ $t('stats_page.empty.create_archetype_btn') }}</span>
          </NuxtLink>
        </section>

        <!-- Cas de recherche vide -->
        <section
          v-else-if="filteredArchetypes.length === 0 && searchQuery"
          class="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center bg-white/80 dark:bg-slate-900/60 shadow-sm"
        >
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            {{ $t('stats_page.empty.no_search_results', { query: searchQuery }) }}
          </p>
          <button
            type="button"
            @click="searchQuery = ''"
            class="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {{ $t('stats_page.empty.reset_search') }}
          </button>
        </section>

        <!-- Grille des Archétypes et Performances -->
        <section v-else class="space-y-4">
          <div
            v-for="arch in filteredArchetypes"
            :key="arch.id"
            class="glass-panel rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/70 p-4 sm:p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div class="flex flex-col lg:flex-row lg:items-center gap-5">
              <!-- Colonne Gauche : Identité de l'archétype & Visuels Cartes Clés -->
              <div class="flex items-center gap-3.5 lg:w-64 xl:w-72 flex-shrink-0">
                <!-- Visuel éventail si 2 cartes ou simple carte -->
                <div v-if="arch.card2ImageUrl || arch.card2Name" class="relative w-14 h-16 flex-shrink-0">
                  <div class="absolute left-0 top-1 w-10 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transform -rotate-6 transition-transform flex items-center justify-center">
                    <img
                      v-if="arch.card1ImageUrl"
                      :src="arch.card1ImageUrl"
                      :alt="arch.card1Name || $t('common.card_1')"
                      class="w-full h-full object-cover"
                      @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                    />
                    <span v-else class="text-[10px] font-bold text-slate-400 dark:text-slate-600">C1</span>
                  </div>
                  <div class="absolute left-3.5 top-0.5 w-10 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md transform rotate-6 transition-transform flex items-center justify-center">
                    <img
                      v-if="arch.card2ImageUrl"
                      :src="arch.card2ImageUrl"
                      :alt="arch.card2Name || $t('common.card_2')"
                      class="w-full h-full object-cover"
                      @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                    />
                    <span v-else class="text-[10px] font-bold text-slate-400 dark:text-slate-600">C2</span>
                  </div>
                </div>

                <!-- Visuel simple si 1 seule carte -->
                <div v-else-if="arch.card1ImageUrl" class="w-12 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center">
                  <img
                    :src="arch.card1ImageUrl"
                    :alt="arch.card1Name || $t('common.card_1')"
                    class="w-full h-full object-cover"
                    @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                  />
                </div>

                <!-- Placeholder par défaut -->
                <div v-else class="w-12 h-16 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700/80 flex items-center justify-center flex-shrink-0 text-slate-400 dark:text-slate-600">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect width="14" height="18" x="5" y="3" rx="2" />
                    <line x1="9" x2="15" y1="7" y2="7" />
                  </svg>
                </div>

                <!-- Nom de l'archétype & Cartes -->
                <div class="min-w-0 flex-1">
                  <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                    {{ arch.name }}
                  </h3>
                  <div class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    <span v-if="arch.card1Name">{{ arch.card1Name }}</span>
                    <span v-if="arch.card1Name && arch.card2Name"> / </span>
                    <span v-if="arch.card2Name">{{ arch.card2Name }}</span>
                  </div>
                  <!-- Volume dédoublonné : [distinctMatches] matchs totaux -->
                  <div class="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                    {{ $t('stats_page.cards.involvements', { count: arch.distinctMatches }) }}
                  </div>
                </div>
              </div>

              <!-- Colonnes Droite : 3 Blocs (GLOBAL / DECK JOUÉ / ADVERSAIRE) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 flex-1">
                <!-- Bloc 1 : GLOBAL (Performance intrinsèque de l'archétype) -->
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
                  <div class="flex items-center justify-between gap-2 min-w-0">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                      {{ $t('stats_page.cards.overall') }}
                    </span>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <!-- Badge de présence Méta en bleu ciel / cyan -->
                      <span
                        v-if="arch.distinctMatches > 0"
                        class="px-2 py-0.5 rounded-md text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap"
                        :title="$t('stats_page.cards.presence_rate_label')"
                      >
                        {{ arch.presenceRate }}%
                      </span>
                      <!-- Badge Win Rate Global de l'archétype -->
                      <span
                        class="px-2 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap"
                        :class="getWinrateBadgeClass(arch.overall.winrate, arch.distinctMatches)"
                      >
                        {{ arch.distinctMatches > 0 ? `${arch.overall.winrate}% WR` : '—' }}
                      </span>
                    </div>
                  </div>

                  <div v-if="arch.distinctMatches > 0" class="mt-2.5 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-medium text-slate-600 dark:text-slate-300">
                        {{ $t('stats_page.cards.matches_count', { count: arch.distinctMatches }) }}
                      </span>
                      <span class="font-semibold text-slate-900 dark:text-slate-100">
                        <span class="text-emerald-600 dark:text-emerald-400">{{ arch.overall.wins }}W</span>
                        <span class="mx-1 text-slate-400">-</span>
                        <span class="text-rose-600 dark:text-rose-400">{{ arch.overall.losses }}L</span>
                        <template v-if="arch.overall.draws > 0">
                          <span class="mx-1 text-slate-400">-</span>
                          <span class="text-amber-600 dark:text-amber-400">{{ arch.overall.draws }}D</span>
                        </template>
                        <template v-if="arch.overall.mirrorMatches > 0">
                          <span class="mx-1 text-slate-400">•</span>
                          <span
                            class="text-slate-500 dark:text-slate-400 font-normal"
                            :title="$t('stats_page.cards.mirror_matches', { count: arch.overall.mirrorMatches })"
                          >
                            {{ arch.overall.mirrorMatches }}M
                          </span>
                        </template>
                      </span>
                    </div>

                    <!-- Barre de progression colorée sous le bloc -->
                    <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        :class="getWinrateBarClass(arch.overall.winrate)"
                        :style="{ width: `${arch.overall.winrate}%` }"
                      />
                    </div>
                  </div>

                  <div v-else class="mt-2 text-xs text-slate-400 dark:text-slate-500 italic">
                    {{ $t('stats_page.cards.not_involved') }}
                  </div>
                </div>

                <!-- Bloc 2 : DECK JOUÉ (Ta rentabilité personnelle) -->
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
                  <div class="flex items-center justify-between gap-2 min-w-0">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                      {{ $t('stats_page.cards.as_played') }}
                    </span>
                    <div v-if="arch.played.total > 0" class="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        class="px-2 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap"
                        :class="getWinrateBadgeClass(arch.played.winrate, arch.played.total)"
                      >
                        {{ arch.played.winrate !== null ? `${arch.played.winrate}% WR` : '—' }}
                      </span>
                    </div>
                  </div>

                  <div v-if="arch.played.total > 0" class="mt-2.5 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-medium text-slate-600 dark:text-slate-300">
                        {{ $t('stats_page.cards.matches_count', { count: arch.played.total }) }}
                      </span>
                      <span class="font-semibold text-slate-900 dark:text-slate-100">
                        <span class="text-emerald-600 dark:text-emerald-400">{{ arch.played.wins }}W</span>
                        <span class="mx-1 text-slate-400">-</span>
                        <span class="text-rose-600 dark:text-rose-400">{{ arch.played.losses }}L</span>
                        <template v-if="arch.played.draws > 0">
                          <span class="mx-1 text-slate-400">-</span>
                          <span class="text-amber-600 dark:text-amber-400">{{ arch.played.draws }}D</span>
                        </template>
                      </span>
                    </div>

                    <!-- Mini barre de progression WR joué -->
                    <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-300"
                        :class="getWinrateBarClass(arch.played.winrate)"
                        :style="{ width: `${arch.played.winrate ?? 0}%` }"
                      />
                    </div>
                  </div>

                  <!-- Si played.total === 0 : mention sobre « Jamais joué en deck actif » -->
                  <div v-else class="mt-2 text-xs text-slate-400 dark:text-slate-500 italic">
                    {{ $t('stats_page.cards.not_played') }}
                  </div>
                </div>

                <!-- Bloc 3 : ADVERSAIRE (La menace adverse) -->
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
                  <div class="flex items-center justify-between gap-2 min-w-0">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                      {{ $t('stats_page.cards.as_faced') }}
                    </span>
                    <div v-if="arch.faced.total > 0" class="flex items-center gap-1.5 flex-shrink-0">
                      <!-- Badge Show Rate (% SR) -->
                      <span
                        class="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap"
                        :title="$t('stats_page.cards.show_rate_label')"
                      >
                        {{ arch.faced.showRate }}% SR
                      </span>
                      <!-- Badge WR vs Deck -->
                      <span
                        class="px-2 py-0.5 rounded-md text-xs font-bold border whitespace-nowrap"
                        :class="getWinrateBadgeClass(arch.faced.winrate, arch.faced.total)"
                        :title="$t('stats_page.sort.faced_wr_desc')"
                      >
                        {{ arch.faced.winrate !== null ? `${arch.faced.winrate}% WR` : '—' }}
                      </span>
                    </div>
                  </div>

                  <div v-if="arch.faced.total > 0" class="mt-2.5 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-medium text-slate-600 dark:text-slate-300">
                        {{ $t('stats_page.cards.matches_count', { count: arch.faced.total }) }}
                      </span>
                      <span class="font-semibold text-slate-900 dark:text-slate-100">
                        <span class="text-emerald-600 dark:text-emerald-400">{{ arch.faced.wins }}W</span>
                        <span class="mx-1 text-slate-400">-</span>
                        <span class="text-rose-600 dark:text-rose-400">{{ arch.faced.losses }}L</span>
                        <template v-if="arch.faced.draws > 0">
                          <span class="mx-1 text-slate-400">-</span>
                          <span class="text-amber-600 dark:text-amber-400">{{ arch.faced.draws }}D</span>
                        </template>
                      </span>
                    </div>

                    <!-- Mini barre de Show Rate -->
                    <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full bg-purple-500 transition-all duration-300"
                        :style="{ width: `${arch.faced.showRate}%` }"
                      />
                    </div>
                  </div>

                  <!-- Si faced.total === 0 : mention sobre « Jamais affronté » -->
                  <div v-else class="mt-2 text-xs text-slate-400 dark:text-slate-500 italic">
                    {{ $t('stats_page.cards.not_faced') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </main>

    <!-- Modale de sélection Jeu & Méta si besoin -->
    <GameMetaModal
      :is-open="isGameMetaModalOpen"
      @close="isGameMetaModalOpen = false"
    />
  </div>
</template>
