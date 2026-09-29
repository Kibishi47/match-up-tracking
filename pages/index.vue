<script setup lang="ts">
import type { Archetype, Match } from '~/server/db/schema'

definePageMeta({
  middleware: 'auth'
})

interface MatchWithRelations extends Match {
  myArchetype?: Archetype
  opponentArchetype?: Archetype
}

interface MatchesApiResponse {
  recentMatches: MatchWithRelations[]
  stats: {
    total: number
    wins: number
    losses: number
    draws: number
    winrate: number
  }
  statsByOpponent: Record<string, { wins: number; losses: number; draws: number; total: number; winrate: number }>
}

// 1. Session de Jeu globale (Header & LocalStorage)
const { activeGameId, activeDeckId, setActiveDeck, isLoadingGames } = useGameSession()

// 2. Archétypes de l'utilisateur pour le jeu actif
const {
  data: userArchetypes,
  refresh: refreshArchetypes,
  status: archetypesStatus
} = await useFetch<Archetype[]>('/api/archetypes', {
  query: computed(() => ({
    gameId: activeGameId.value || undefined,
    includeArchived: false
  })),
  watch: [activeGameId]
})

const isLoadingArchetypes = computed(() => archetypesStatus.value === 'pending')

// Sélection automatique du deck actif par défaut si non mémorisé
watch([userArchetypes, activeDeckId], ([newDecks, currentDeckId]) => {
  if (newDecks && newDecks.length > 0) {
    if (!currentDeckId || !newDecks.some(d => d.id === currentDeckId)) {
      setActiveDeck(newDecks[0].id)
    }
  } else {
    setActiveDeck(null)
  }
}, { immediate: true })

const activeDeck = computed(() => {
  return userArchetypes.value?.find(d => d.id === activeDeckId.value) || null
})

// 3. Matchs & Statistiques de matchup
const {
  data: matchesData,
  refresh: refreshMatches,
  status: matchesStatus
} = await useFetch<MatchesApiResponse>('/api/matches', {
  query: computed(() => ({
    gameId: activeGameId.value || undefined,
    myArchetypeId: activeDeckId.value || undefined
  })),
  watch: [activeGameId, activeDeckId]
})

const isLoadingMatches = computed(() => matchesStatus.value === 'pending')

// Décks adverses (tous les archétypes configurés par l'utilisateur pour ce jeu)
const opponentArchetypes = computed(() => {
  return userArchetypes.value || []
})

// Toast temporaire anti miss-clic (10s)
const pendingUndoMatch = ref<MatchWithRelations | null>(null)

// Modale d'édition
const editingMatch = ref<MatchWithRelations | null>(null)

// Actions rapides : enregistrer une partie
const logMatch = async (opponentId: string, result: 'win' | 'loss') => {
  if (!activeGameId.value || !activeDeckId.value) {
    alert('Veuillez d’abord sélectionner un jeu et votre deck actif.')
    return
  }

  try {
    const newMatch = await $fetch<MatchWithRelations>('/api/matches', {
      method: 'POST',
      body: {
        gameId: activeGameId.value,
        myArchetypeId: activeDeckId.value,
        opponentArchetypeId: opponentId,
        result
      }
    })

    // Déclencher le toast anti miss-clic de 10s
    pendingUndoMatch.value = newMatch

    // Rafraîchir les statistiques et l'historique
    await refreshMatches()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Erreur lors de l’enregistrement du match')
  }
}

// Annuler un match (via toast anti miss-clic)
const handleUndoMatch = async (matchId: string) => {
  try {
    await $fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
    pendingUndoMatch.value = null
    await refreshMatches()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Erreur lors de l’annulation')
  }
}

// Ouvrir la modale d'édition
const handleEditFromToast = (match: MatchWithRelations) => {
  pendingUndoMatch.value = null
  editingMatch.value = match
}

// Supprimer un match depuis l'historique
const deleteMatchFromHistory = async (matchId: string) => {
  if (!confirm('Supprimer ce match de l’historique ?')) return
  try {
    await $fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
    if (pendingUndoMatch.value?.id === matchId) {
      pendingUndoMatch.value = null
    }
    await refreshMatches()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Erreur lors de la suppression')
  }
}

const formatDate = (dateStr: string | Date) => {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 pb-28">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- 1. Bannière « Deck Actif » (Hero section) avec Skeleton anti CLS -->
      <section>
        <ActiveDeckSkeleton v-if="isLoadingGames || isLoadingArchetypes" />
        <ActiveDeckBanner
          v-else
          :deck="activeDeck"
          :all-decks="userArchetypes || []"
          :stats="matchesData?.stats || { total: 0, wins: 0, losses: 0, draws: 0, winrate: 0 }"
          @change-deck="setActiveDeck"
        />
      </section>

      <!-- 2. Grille des Matchups Rapides avec Skeleton anti CLS -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-black text-white flex items-center gap-2 tracking-tight">
              <span>Saisie Rapide des Matchups</span>
              <span class="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                1 clic = Enregistré
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">
              Cliquez sur Victoire (W) ou Défaite (L) face à chaque archétype adverse pour journaliser instantanément vos manches.
            </p>
          </div>
        </div>

        <OpponentGridSkeleton v-if="isLoadingArchetypes || isLoadingMatches" />
        <OpponentGrid
          v-else
          :opponents="opponentArchetypes"
          :stats-by-opponent="matchesData?.statsByOpponent || {}"
          @log-match="logMatch"
        />
      </section>

      <!-- 3. Historique Récent Éditable avec Skeleton anti CLS -->
      <section>
        <MatchHistorySkeleton v-if="isLoadingMatches" />
        
        <div v-else class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <span>Historique Récent</span>
              <span class="text-xs text-slate-400 font-normal">
                ({{ matchesData?.recentMatches?.length || 0 }} derniers matchs)
              </span>
            </h3>

            <button
              @click="refreshMatches()"
              class="text-xs text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              <span>Actualiser</span>
            </button>
          </div>

          <div v-if="!matchesData?.recentMatches || matchesData.recentMatches.length === 0" class="py-8 text-center text-slate-500 text-sm">
            Aucun match enregistré pour ce deck.
          </div>

          <div v-else class="divide-y divide-slate-800/80">
            <div
              v-for="m in matchesData.recentMatches"
              :key="m.id"
              class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-900/30 px-3 rounded-xl transition"
            >
              <!-- Info Match -->
              <div class="flex items-center gap-3.5">
                <span
                  :class="[
                    'w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs uppercase flex-shrink-0 shadow-sm',
                    m.result === 'win'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : (m.result === 'loss' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30')
                  ]"
                >
                  {{ m.result === 'win' ? 'WIN' : (m.result === 'loss' ? 'LOSS' : 'DRAW') }}
                </span>

                <div>
                  <div class="text-sm font-semibold text-white">
                    vs {{ m.opponentArchetype?.name || 'Adversaire inconnu' }}
                    <span class="text-xs font-normal text-slate-400 ml-2">avec {{ m.myArchetype?.name }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>{{ formatDate(m.createdAt) }}</span>
                    <span v-if="m.notes" class="text-slate-400 italic">"{{ m.notes }}"</span>
                  </div>
                </div>
              </div>

              <!-- Actions Édition & Suppression -->
              <div class="flex items-center gap-2 self-end sm:self-center">
                <button
                  @click="editingMatch = m"
                  class="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Éditer
                </button>
                <button
                  @click="deleteMatchFromHistory(m.id)"
                  class="px-3 py-1 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                  title="Supprimer ce match"
                >
                  Supprimer
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
      @updated="() => { refreshMatches(); editingMatch = null; }"
    />
  </div>
</template>
