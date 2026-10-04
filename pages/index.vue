<script setup lang="ts">
import type { Archetype, Match } from '~/server/db/schema'
import type { OpponentStats } from '~/components/OpponentGrid.vue'
import MatchupNotesModal from '~/components/modal/MatchupNotesModal.vue'

definePageMeta({
  middleware: 'auth'
})

interface MatchWithRelations extends Match {
  myArchetype?: Archetype
  opponentArchetype?: Archetype
}

interface DashboardApiResponse {
  archetypes: Archetype[]
  activeDeck: Archetype | null
  stats: {
    total: number
    wins: number
    losses: number
    draws: number
    winrate: number
  }
  statsByOpponent: Record<string, OpponentStats>
  recentMatches: MatchWithRelations[]
}

// 1. Session de Jeu & Méta globales (Header & LocalStorage)
const { activeGameId, activeDeckId, setActiveDeck, isSessionReady, selectDefaultDeckIfNone } = useGameSession()
const { metas, activeMeta, activeMetaId, setActiveMeta } = useMetaSession()

// 2. Dashboard consolidé (archétypes, stats WR/SR et historique en 1 seule requête réactive)
const {
  data: dashboardData,
  pending,
  refresh: refreshDashboard
} = useLazyFetch<DashboardApiResponse>('/api/dashboard', {
  query: computed(() => ({
    gameId: activeGameId.value,
    metaId: activeMetaId.value || undefined,
    myDeckId: activeDeckId.value
  })),
  watch: [activeGameId, activeMetaId, activeDeckId]
})

// Détection de l'état de chargement initial (anti ghost skeleton & anti CLS)
const isInitialLoading = computed(() => {
  return !isSessionReady.value || (pending.value && !dashboardData.value)
})

// Auto-sélection du premier deck si aucun deck mémorisé ou si le deck n'existe plus
watch([() => dashboardData.value?.archetypes, activeDeckId], ([decks]) => {
  if (decks && decks.length > 0) {
    selectDefaultDeckIfNone(decks)
  } else if (decks && decks.length === 0) {
    setActiveDeck(null)
  }
}, { immediate: true })

// Toast temporaire anti miss-clic (10s)
const pendingUndoMatch = ref<MatchWithRelations | null>(null)

// Modale de modification
const editingMatch = ref<MatchWithRelations | null>(null)

// Modale de notes de matchup
const selectedNotesOpponent = ref<Archetype | null>(null)
const isMatchupNotesModalOpen = ref(false)

const handleOpenNotes = (opponent: Archetype) => {
  selectedNotesOpponent.value = opponent
  isMatchupNotesModalOpen.value = true
}

const handleNotesSaved = (newNotes: string) => {
  if (selectedNotesOpponent.value && dashboardData.value?.statsByOpponent) {
    if (dashboardData.value.statsByOpponent[selectedNotesOpponent.value.id]) {
      dashboardData.value.statsByOpponent[selectedNotesOpponent.value.id].notes = newNotes
    }
  }
  refreshDashboard()
}

const { toast, confirmAction } = useNotify()
const { t, locale } = useI18n()

// Formateur de score et infobulle pour match BO3
const getBo3Score = (m: MatchWithRelations) => {
  if (m.format !== 'bo3') return ''
  const games = [m.game1, m.game2, m.game3].filter(Boolean)
  const wins = games.filter(g => g === 'win').length
  const losses = games.filter(g => g === 'loss').length
  return `${wins}-${losses}`
}

const getBo3GamesTooltip = (m: MatchWithRelations) => {
  if (m.format !== 'bo3') return ''
  const g1 = m.game1 === 'win' ? 'W' : (m.game1 === 'loss' ? 'L' : 'D')
  const g2 = m.game2 === 'win' ? 'W' : (m.game2 === 'loss' ? 'L' : 'D')
  const g3 = m.game3 ? (m.game3 === 'win' ? 'W' : (m.game3 === 'loss' ? 'L' : 'D')) : null
  return `Format BO3 — G1: ${g1} | G2: ${g2}${g3 ? ` | G3: ${g3}` : ''}`
}

// Enregistrement rapide d'un match (BO1 en 1-clic ou BO3 sélectionné)
const logMatch = async (
  opponentId: string,
  matchData: 'win' | 'loss' | 'draw' | {
    format?: 'bo1' | 'bo3'
    result: 'win' | 'loss' | 'draw'
    game1?: 'win' | 'loss' | 'draw' | null
    game2?: 'win' | 'loss' | 'draw' | null
    game3?: 'win' | 'loss' | 'draw' | null
  }
) => {
  if (!activeGameId.value || !activeDeckId.value) {
    toast.warning(t('matchups.select_game_deck_warning'))
    return
  }

  const payload = typeof matchData === 'string'
    ? {
        format: 'bo1' as const,
        result: matchData,
        game1: matchData,
        game2: null,
        game3: null
      }
    : {
        format: matchData.format || 'bo1',
        result: matchData.result,
        game1: matchData.game1 || matchData.result,
        game2: matchData.game2 || null,
        game3: matchData.game3 || null
      }

  try {
    const newMatch = await $fetch<MatchWithRelations>('/api/matches', {
      method: 'POST',
      body: {
        gameId: activeGameId.value,
        myArchetypeId: activeDeckId.value,
        opponentArchetypeId: opponentId,
        ...payload
      }
    })

    // Déclencher le toast anti miss-clic de 10s
    pendingUndoMatch.value = newMatch

    // Rafraîchir les stats consolidées en arrière-plan sans flash
    await refreshDashboard()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || t('matchups.save_error'))
  }
}

// Annuler un match (via toast anti miss-clic)
const handleUndoMatch = async (matchId: string) => {
  try {
    await $fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
    pendingUndoMatch.value = null
    toast.info(t('history.cancelled'))
    await refreshDashboard()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || err?.message || 'Error')
  }
}

// Ouvrir la modale d'édition
const handleEditFromToast = (match: MatchWithRelations) => {
  pendingUndoMatch.value = null
  editingMatch.value = match
}

// Supprimer un match depuis l'historique
const deleteMatchFromHistory = async (matchId: string) => {
  const confirmed = await confirmAction({
    title: t('history.confirm_delete_title'),
    message: t('history.confirm_delete_msg'),
    confirmText: t('common.delete'),
    isDestructive: true
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
    if (pendingUndoMatch.value?.id === matchId) {
      pendingUndoMatch.value = null
    }
    toast.success(t('history.delete_success'))
    await refreshDashboard()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Error')
  }
}

const formatDate = (dateStr: string | Date) => {
  const d = new Date(dateStr)
  const loc = locale.value === 'fr' ? 'fr-FR' : 'en-US'
  return new Intl.DateTimeFormat(loc, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 pb-28 transition-colors">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-6 sm:space-y-8">
      <!-- 1. Bannière « Deck Actif » (Hero section) avec Skeleton 1:1 strict -->
      <section class="relative z-20">
        <ActiveDeckSkeleton v-if="isInitialLoading" />
        <ActiveDeckBanner
          v-else
          :deck="dashboardData?.activeDeck || null"
          :all-decks="dashboardData?.archetypes || []"
          :stats="dashboardData?.stats || { total: 0, wins: 0, losses: 0, draws: 0, winrate: 0 }"
          @change-deck="setActiveDeck"
        />
      </section>

      <!-- 2. Grille des Matchups Rapides (Win Rate & Show Rate) avec Skeleton 1:1 strict -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {{ $t('matchups.title') }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {{ $t('matchups.subtitle') }}
            </p>
          </div>
        </div>

        <OpponentGridSkeleton v-if="isInitialLoading" />
        <OpponentGrid
          v-else
          :opponents="dashboardData?.archetypes || []"
          :stats-by-opponent="dashboardData?.statsByOpponent || {}"
          @log-match="logMatch"
          @open-notes="handleOpenNotes"
        />
      </section>

      <!-- 3. Historique Récent Éditable avec Skeleton 1:1 strict -->
      <section>
        <MatchHistorySkeleton v-if="isInitialLoading" />
        
        <div v-else class="glass-panel p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/60">
          <!-- En-tête de l'historique compact & réactif -->
          <div class="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap">
                {{ $t('history.title') }}
              </h3>
              <span
                v-if="dashboardData?.recentMatches?.length"
                class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 flex-shrink-0"
                :title="`${dashboardData.recentMatches.length} ${$t('history.title')}`"
              >
                {{ dashboardData.recentMatches.length }}
              </span>
            </div>

            <button
              type="button"
              @click="refreshDashboard()"
              class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 sm:px-2.5 sm:py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
              :title="$t('nav.refresh')"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span class="hidden sm:inline">{{ $t('nav.refresh') }}</span>
            </button>
          </div>

          <div v-if="!dashboardData?.recentMatches || dashboardData.recentMatches.length === 0" class="py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
            {{ $t('history.no_matches') }}
          </div>

          <div v-else class="divide-y divide-slate-100 dark:divide-slate-800/80">
            <div
              v-for="m in dashboardData.recentMatches"
              :key="m.id"
              class="py-3.5 px-2 sm:px-3 -mx-2 sm:-mx-3 flex items-center justify-between gap-2.5 sm:gap-4 group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
            >
              <!-- Info Match -->
              <div class="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <span
                  :class="[
                    'px-2 min-w-[50px] sm:min-w-[58px] h-7 sm:h-8 rounded-lg flex items-center justify-center font-black text-[10px] sm:text-xs uppercase flex-shrink-0 shadow-sm tracking-wide gap-1',
                    m.result === 'win'
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                      : (m.result === 'loss' ? 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30')
                  ]"
                  :title="m.format === 'bo3' ? getBo3GamesTooltip(m) : undefined"
                >
                  <span>{{ m.result === 'win' ? 'WIN' : (m.result === 'loss' ? 'LOSS' : 'DRAW') }}</span>
                  <span v-if="m.format === 'bo3'" class="font-mono text-[9px] sm:text-[10px] opacity-90 font-bold ml-0.5">
                    {{ getBo3Score(m) }}
                  </span>
                </span>

                <div class="min-w-0 flex-1">
                  <div class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                    vs {{ m.opponentArchetype?.name || $t('history.unknown_opponent') }}
                    <span class="text-[11px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 ml-1.5 hidden sm:inline">{{ $t('history.with') }} {{ m.myArchetype?.name }}</span>
                  </div>
                  <div class="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    <span class="flex-shrink-0">{{ formatDate(m.createdAt) }}</span>
                    <!-- Déroulé des manches si BO3 -->
                    <span
                      v-if="m.format === 'bo3'"
                      class="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/60"
                      :title="getBo3GamesTooltip(m)"
                    >
                      <span class="font-semibold text-slate-600 dark:text-slate-300">BO3</span>
                      <span class="text-slate-400 dark:text-slate-600">•</span>
                      <span class="flex items-center gap-0.5 font-bold">
                        <span :class="m.game1 === 'win' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">G1:{{ m.game1 === 'win' ? 'W' : (m.game1 === 'loss' ? 'L' : 'D') }}</span>
                        <span class="text-slate-300 dark:text-slate-600">|</span>
                        <span :class="m.game2 === 'win' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">G2:{{ m.game2 === 'win' ? 'W' : (m.game2 === 'loss' ? 'L' : 'D') }}</span>
                        <template v-if="m.game3">
                          <span class="text-slate-300 dark:text-slate-600">|</span>
                          <span :class="m.game3 === 'win' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">G3:{{ m.game3 === 'win' ? 'W' : (m.game3 === 'loss' ? 'L' : 'D') }}</span>
                        </template>
                      </span>
                    </span>
                    <span v-if="m.notes" class="text-slate-600 dark:text-slate-400 italic truncate max-w-[200px]" :title="m.notes">"{{ m.notes }}"</span>
                  </div>
                </div>
              </div>

              <!-- Actions Édition & Suppression -->
              <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button
                  type="button"
                  @click="editingMatch = m"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {{ $t('history.edit') }}
                </button>
                <button
                  type="button"
                  @click="deleteMatchFromHistory(m.id)"
                  class="p-1 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                  :title="$t('history.delete')"
                >
                  <span class="hidden sm:inline">{{ $t('history.delete') }}</span>
                  <svg class="w-4 h-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Toast temporaire anti miss-clic (10s avec barre animée) -->
    <UndoMatchToast
      :match="pendingUndoMatch"
      @undo="handleUndoMatch"
      @edit="handleEditFromToast"
      @dismiss="pendingUndoMatch = null"
    />

    <!-- Modale de modification de match -->
    <EditMatchModal
      :match="editingMatch"
      @close="editingMatch = null"
      @updated="() => { refreshDashboard(); editingMatch = null; }"
    />

    <!-- Modale d'édition des notes de Matchup (Partagées pour le duel) -->
    <MatchupNotesModal
      :is-open="isMatchupNotesModalOpen"
      :my-archetype="dashboardData?.activeDeck || null"
      :opponent-archetype="selectedNotesOpponent"
      :initial-notes="selectedNotesOpponent ? dashboardData?.statsByOpponent?.[selectedNotesOpponent.id]?.notes : ''"
      @close="isMatchupNotesModalOpen = false"
      @saved="handleNotesSaved"
    />
  </div>
</template>
