<script setup lang="ts">
import type { Game, Archetype, Match } from '~/server/database/schema'

definePageMeta({
  middleware: 'auth'
})

interface MatchWithRelations extends Match {
  userArchetype?: Archetype
  opponentArchetype?: Archetype
}

interface MatchesApiResponse {
  recentMatches: MatchWithRelations[]
  stats: {
    total: number
    wins: number
    losses: number
    winrate: number
  }
  statsByOpponent: Record<number, { wins: number; losses: number; total: number; winrate: number }>
}

// 1. Charger les jeux
const { data: gamesList } = await useFetch<Game[]>('/api/games')
const activeGameId = ref<number | null>(null)

// 2. Charger les archétypes de l'utilisateur pour le jeu actif
const { data: userArchetypes, refresh: refreshArchetypes } = await useFetch<Archetype[]>('/api/archetypes', {
  query: computed(() => ({
    gameId: activeGameId.value || undefined,
    includeArchived: false
  })),
  watch: [activeGameId]
})

// Deck actif sélectionné par l'utilisateur
const activeDeckId = ref<number | null>(null)

// Initialiser le jeu actif et le deck actif par défaut
watch(gamesList, (newGames) => {
  if (newGames && newGames.length > 0 && activeGameId.value === null) {
    activeGameId.value = newGames[0].id
  }
}, { immediate: true })

watch(userArchetypes, (newDecks) => {
  if (newDecks && newDecks.length > 0) {
    // Si aucun deck actif ou si le deck actif n'est plus dans la liste
    if (!activeDeckId.value || !newDecks.some(d => d.id === activeDeckId.value)) {
      activeDeckId.value = newDecks[0].id
    }
  } else {
    activeDeckId.value = null
  }
}, { immediate: true })

// 3. Charger l'historique et les statistiques de matchup
const { data: matchesData, refresh: refreshMatches, status: matchesStatus } = await useFetch<MatchesApiResponse>('/api/matches', {
  query: computed(() => ({
    gameId: activeGameId.value || undefined,
    userArchetypeId: activeDeckId.value || undefined
  })),
  watch: [activeGameId, activeDeckId]
})

// Décks adverses (tous les archétypes créés pour ce jeu)
const opponentArchetypes = computed(() => {
  return userArchetypes.value || []
})

const activeDeck = computed(() => {
  return userArchetypes.value?.find(d => d.id === activeDeckId.value) || null
})

// Gestion du Toast Anti Miss-clic (10 secondes)
const pendingUndoMatch = ref<MatchWithRelations | null>(null)

// Gestion de la modale d'édition
const editingMatch = ref<MatchWithRelations | null>(null)

// Enregistrement rapide d'un match (W ou L)
const logMatch = async (opponentId: number, result: 'win' | 'loss') => {
  if (!activeGameId.value || !activeDeckId.value) {
    alert('Veuillez d’abord sélectionner un jeu et votre deck actif.')
    return
  }

  try {
    const newMatch = await $fetch<MatchWithRelations>('/api/matches', {
      method: 'POST',
      body: {
        gameId: activeGameId.value,
        userArchetypeId: activeDeckId.value,
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

// Annuler un match (via le bouton Annuler du toast)
const handleUndoMatch = async (matchId: number) => {
  try {
    await $fetch(`/api/matches/${matchId}`, { method: 'DELETE' })
    pendingUndoMatch.value = null
    await refreshMatches()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Erreur lors de l’annulation')
  }
}

// Ouvrir la modale d'édition depuis le toast
const handleEditFromToast = (match: MatchWithRelations) => {
  pendingUndoMatch.value = null
  editingMatch.value = match
}

// Supprimer un match depuis l'historique
const deleteMatchFromHistory = async (matchId: number) => {
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

// Formatage de date
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
  <div class="min-h-screen bg-slate-950 pb-24">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <!-- 1. En-tête : Sélecteur de Jeu & Deck Actif -->
      <section class="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
          <!-- Sélection du TCG -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              1. Choisir le TCG
            </label>
            <select
              v-model="activeGameId"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option v-for="g in gamesList" :key="g.id" :value="g.id">
                {{ g.name }}
              </option>
            </select>
          </div>

          <!-- Sélection du Deck du Joueur -->
          <div class="lg:col-span-2">
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Mon Deck Actuel
              </label>
              <NuxtLink
                to="/archetypes"
                class="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                + Gérer mes decks
              </NuxtLink>
            </div>

            <div v-if="!userArchetypes || userArchetypes.length === 0" class="flex items-center gap-3">
              <p class="text-sm text-slate-400 italic">Aucun deck configuré pour ce jeu.</p>
              <NuxtLink
                to="/archetypes"
                class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Créer mon premier deck
              </NuxtLink>
            </div>

            <div v-else class="flex items-center gap-3">
              <select
                v-model="activeDeckId"
                class="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option v-for="arch in userArchetypes" :key="arch.id" :value="arch.id">
                  {{ arch.name }}
                </option>
              </select>

              <!-- Carte clé miniature du deck actif -->
              <div v-if="activeDeck?.card1ImageUrl" class="hidden sm:block w-9 h-11 rounded border border-slate-700 overflow-hidden flex-shrink-0">
                <img :src="activeDeck.card1ImageUrl" :alt="activeDeck.name" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <!-- Statistiques rapides du deck sélectionné -->
          <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span class="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                Winrate du deck
              </span>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-2xl font-black text-white">
                  {{ matchesData?.stats.winrate ?? 0 }}%
                </span>
                <span class="text-xs text-slate-400">
                  ({{ matchesData?.stats.wins ?? 0 }}W - {{ matchesData?.stats.losses ?? 0 }}L)
                </span>
              </div>
            </div>

            <div class="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm"
              :class="(matchesData?.stats.winrate ?? 0) >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'"
            >
              {{ matchesData?.stats.total ?? 0 }} m.
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Dashboard Principal : Grille des Matchups & Boutons W / L Rapides -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span>Saisie Rapide des Matchups</span>
              <span class="text-xs font-normal text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                Clic direct = Enregistrement instantané
              </span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Affrontez vos adversaires : cliquez sur W ou L pour enregistrer une manche.
            </p>
          </div>
        </div>

        <div v-if="!activeDeckId" class="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
          <p class="text-slate-400 text-base">Veuillez sélectionner ou créer un deck ci-dessus pour afficher la grille des matchups.</p>
        </div>

        <div v-else-if="opponentArchetypes.length === 0" class="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
          <p class="text-slate-400 text-base">Aucun archétype enregistré pour ce jeu.</p>
          <NuxtLink to="/archetypes" class="mt-3 inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">
            Ajouter les decks du metagame
          </NuxtLink>
        </div>

        <!-- Grille des Cartes Adversaires -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="opp in opponentArchetypes"
            :key="opp.id"
            class="glass-panel rounded-2xl border border-slate-800/90 hover:border-slate-700 transition overflow-hidden flex flex-col justify-between p-4 group"
          >
            <!-- Visuels des cartes de l'adversaire -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <div class="w-12 h-16 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center shadow">
                  <img
                    v-if="opp.card1ImageUrl"
                    :src="opp.card1ImageUrl"
                    :alt="opp.card1Name || 'Carte 1'"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                  />
                  <span v-else class="text-xs font-bold text-slate-600">C1</span>
                </div>

                <div
                  v-if="opp.card2ImageUrl || opp.card2Name"
                  class="w-12 h-16 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center shadow"
                >
                  <img
                    v-if="opp.card2ImageUrl"
                    :src="opp.card2ImageUrl"
                    :alt="opp.card2Name || 'Carte 2'"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                  />
                  <span v-else class="text-xs font-bold text-slate-600">C2</span>
                </div>

                <div class="min-w-0 flex-1 ml-1">
                  <h3 class="font-bold text-white text-base truncate group-hover:text-emerald-400 transition" :title="opp.name">
                    {{ opp.name }}
                  </h3>
                  <div class="mt-1 text-xs text-slate-400">
                    <span v-if="matchesData?.statsByOpponent?.[opp.id]">
                      <strong class="text-emerald-400">{{ matchesData.statsByOpponent[opp.id].wins }}W</strong> -
                      <strong class="text-red-400">{{ matchesData.statsByOpponent[opp.id].losses }}L</strong>
                      <span class="text-slate-500 ml-1">({{ matchesData.statsByOpponent[opp.id].winrate }}%)</span>
                    </span>
                    <span v-else class="text-slate-500 italic">Aucun match joué</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Boutons d'action rapide Victoire (W) / Défaite (L) -->
            <div class="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
              <button
                @click="logMatch(opp.id, 'win')"
                class="py-2.5 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30"
                title="Enregistrer une victoire immédiate"
              >
                <span>VICTOIRE</span>
                <span class="text-xs bg-emerald-700/60 px-1.5 py-0.5 rounded">W</span>
              </button>

              <button
                @click="logMatch(opp.id, 'loss')"
                class="py-2.5 rounded-xl font-black text-sm text-white bg-red-600 hover:bg-red-500 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-red-900/30"
                title="Enregistrer une défaite immédiate"
              >
                <span>DÉFAITE</span>
                <span class="text-xs bg-red-700/60 px-1.5 py-0.5 rounded">L</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Historique Récent Éditable -->
      <section class="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span>Historique Récent des Matchs</span>
            <span class="text-xs text-slate-400 font-normal">({{ matchesData?.recentMatches?.length || 0 }} derniers)</span>
          </h2>

          <button
            @click="refreshMatches()"
            class="text-xs text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            Actualiser
          </button>
        </div>

        <div v-if="!matchesData?.recentMatches || matchesData.recentMatches.length === 0" class="py-8 text-center text-slate-500 text-sm">
          Aucun match récent enregistré pour ce deck.
        </div>

        <div v-else class="divide-y divide-slate-800/80">
          <div
            v-for="m in matchesData.recentMatches"
            :key="m.id"
            class="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-900/30 px-3 rounded-xl transition"
          >
            <!-- Infos du Match -->
            <div class="flex items-center gap-3.5">
              <span
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase flex-shrink-0',
                  m.result === 'win'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                ]"
              >
                {{ m.result === 'win' ? 'WIN' : 'LOSS' }}
              </span>

              <div>
                <div class="text-sm font-semibold text-white">
                  vs {{ m.opponentArchetype?.name || 'Adversaire inconnu' }}
                  <span class="text-xs font-normal text-slate-400 ml-2">avec {{ m.userArchetype?.name }}</span>
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{{ formatDate(m.createdAt) }}</span>
                  <span v-if="m.notes" class="text-slate-400 italic">"{{ m.notes }}"</span>
                </div>
              </div>
            </div>

            <!-- Actions d'édition et suppression -->
            <div class="flex items-center gap-2 self-end sm:self-center">
              <button
                @click="editingMatch = m"
                class="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Éditer
              </button>
              <button
                @click="deleteMatchFromHistory(m.id)"
                class="px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                title="Supprimer le match"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Toast temporaire anti miss-clic (10 secondes avec compte à rebours) -->
    <UndoMatchToast
      :match="pendingUndoMatch"
      @undo="handleUndoMatch"
      @edit="handleEditFromToast"
      @dismiss="pendingUndoMatch = null"
    />

    <!-- Modale d'édition de match -->
    <EditMatchModal
      :match="editingMatch"
      @close="editingMatch = null"
      @updated="() => { refreshMatches(); editingMatch = null; }"
    />
  </div>
</template>
