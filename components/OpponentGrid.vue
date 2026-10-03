<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'
import SplitButton from '~/components/ui/SplitButton.vue'

export interface OpponentStats {
  wins: number
  losses: number
  draws?: number
  total: number
  winrate: number
  showRate: number
  notes?: string
}

const props = defineProps<{
  opponents: Archetype[]
  statsByOpponent: Record<string, OpponentStats>
}>()

export interface MatchLogPayload {
  format?: 'bo1' | 'bo3'
  result: 'win' | 'loss' | 'draw'
  game1?: 'win' | 'loss' | 'draw' | null
  game2?: 'win' | 'loss' | 'draw' | null
  game3?: 'win' | 'loss' | 'draw' | null
}

const emit = defineEmits<{
  (e: 'log-match', opponentId: string, matchData: 'win' | 'loss' | 'draw' | MatchLogPayload): void
  (e: 'open-notes', opponent: Archetype): void
}>()

const searchQuery = ref('')

const filteredOpponents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.opponents

  return props.opponents.filter((opp) => {
    const nameMatch = opp.name.toLowerCase().includes(q)
    const card1Match = opp.card1Name?.toLowerCase().includes(q) || false
    const card2Match = opp.card2Name?.toLowerCase().includes(q) || false
    return nameMatch || card1Match || card2Match
  })
})
</script>

<template>
  <div class="space-y-3.5">
    <!-- Barre de recherche rapide de Matchup -->
    <div
      v-if="opponents.length > 0"
      class="glass-panel p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex items-center justify-between gap-3"
    >
      <div class="relative flex-1 max-w-sm">
        <svg
          class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
          :placeholder="$t('matchups.search_placeholder')"
          class="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          :title="$t('matchups.reset_search')"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <span>{{ filteredOpponents.length }} matchup{{ filteredOpponents.length > 1 ? 's' : '' }}</span>
        <span v-if="searchQuery" class="text-emerald-600 dark:text-emerald-400 ml-1">
          / {{ opponents.length }}
        </span>
      </div>
    </div>

    <!-- État 0 archétype dans le jeu -->
    <div v-if="opponents.length === 0" class="glass-panel p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center bg-white/80 dark:bg-slate-900/60 shadow-sm">
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-3 shadow-inner">
        <svg class="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect width="14" height="18" x="3" y="3" rx="2" />
          <path d="M7 3v18" />
          <path d="M10 7.5h4" />
        </svg>
      </div>
      <h4 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{{ $t('matchups.no_opponents') }}</h4>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
        {{ $t('matchups.no_opponents_desc') }}
      </p>
      <NuxtLink
        to="/archetypes"
        class="mt-4 inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-emerald-600/20 active:scale-95"
      >
        <span>+ {{ $t('matchups.add_archetype') }}</span>
      </NuxtLink>
    </div>

    <!-- Aucun résultat de recherche -->
    <div
      v-else-if="filteredOpponents.length === 0"
      class="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center bg-white/80 dark:bg-slate-900/60 shadow-sm"
    >
      <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
        {{ $t('matchups.no_search_results', { query: searchQuery }) }}
      </p>
      <button
        type="button"
        @click="searchQuery = ''"
        class="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
      >
        {{ $t('matchups.reset_search') }}
      </button>
    </div>

    <!-- Grille des cartes adverses (Gabarit 1:1 rigoureusement aligné avec le skeleton) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="opp in filteredOpponents"
        :key="opp.id"
        class="glass-panel rounded-2xl border border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between p-4 group bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/80 min-h-[156px] shadow-sm relative hover:z-20 focus-within:z-30"
      >
        <!-- Visuel et infos de l'adversaire -->
        <div>
          <div class="flex items-start gap-2.5 mb-2.5">
            <!-- Éventail si 2 cartes clés -->
            <div v-if="opp.card2ImageUrl || opp.card2Name" class="relative w-14 h-16 flex-shrink-0">
              <!-- Carte 1 (Arrière / Inclinée gauche) -->
              <div class="absolute left-0 top-1 w-10 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transform -rotate-6 group-hover:-rotate-12 transition-transform duration-300 flex items-center justify-center">
                <img
                  v-if="opp.card1ImageUrl"
                  :src="opp.card1ImageUrl"
                  :alt="opp.card1Name || $t('common.card_1')"
                  class="w-full h-full object-cover"
                  @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                />
                <span v-else class="text-[10px] font-bold text-slate-400 dark:text-slate-600">C1</span>
              </div>

              <!-- Carte 2 (Avant / Inclinée droite) -->
              <div class="absolute left-3.5 top-0.5 w-10 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md transform rotate-6 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center">
                <img
                  v-if="opp.card2ImageUrl"
                  :src="opp.card2ImageUrl"
                  :alt="opp.card2Name || $t('common.card_2')"
                  class="w-full h-full object-cover"
                  @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                />
                <span v-else class="text-[10px] font-bold text-slate-400 dark:text-slate-600">C2</span>
              </div>
            </div>

            <!-- 1 seule carte droite -->
            <div v-else class="w-12 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
              <img
                v-if="opp.card1ImageUrl"
                :src="opp.card1ImageUrl"
                :alt="opp.card1Name || $t('common.card_1')"
                class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                @error="(e) => (e.target as HTMLElement).style.display = 'none'"
              />
              <span v-else class="text-xs font-bold text-slate-400 dark:text-slate-600">C1</span>
            </div>

            <div class="min-w-0 flex-1 ml-0.5">
              <div class="flex items-start justify-between gap-1">
                <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" :title="opp.name">
                  {{ opp.name }}
                </h4>

                <!-- Bouton Note de Matchup discrète -->
                <button
                  type="button"
                  @click.stop="emit('open-notes', opp)"
                  :class="[
                    'p-1.5 rounded-lg transition duration-200 cursor-pointer flex-shrink-0 -mt-1 -mr-1',
                    statsByOpponent?.[opp.id]?.notes
                      ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  ]"
                  :title="statsByOpponent?.[opp.id]?.notes ? `Note : ${statsByOpponent[opp.id].notes}` : $t('matchups.add_notes')"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </button>
              </div>

              <!-- Nom des 2 cartes de l'archétype (séparateur //) -->
              <p v-if="opp.card1Name || opp.card2Name" class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate" :title="[opp.card1Name, opp.card2Name].filter(Boolean).join(' // ')">
                {{ [opp.card1Name, opp.card2Name].filter(Boolean).join(' // ') }}
              </p>

              <!-- Métriques : Win Rate (WR) & Show Rate (SR) -->
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                <!-- Badge Win Rate (WR) -->
                <span
                  v-if="statsByOpponent?.[opp.id] && statsByOpponent[opp.id].total > 0"
                  :class="[
                    'px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border',
                    statsByOpponent[opp.id].winrate >= 55
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : (statsByOpponent[opp.id].winrate >= 45
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30')
                  ]"
                  :title="$t('matchups.record_tooltip', { record: `${statsByOpponent[opp.id].wins}W - ${statsByOpponent[opp.id].losses}L${statsByOpponent[opp.id].draws ? ' - ' + statsByOpponent[opp.id].draws + 'D' : ''}` })"
                >
                  WR {{ statsByOpponent[opp.id].winrate }}%
                </span>
                <span v-else class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700/60">
                  WR - %
                </span>

                <!-- Badge Show Rate (SR) -->
                <span
                  v-if="statsByOpponent?.[opp.id] && statsByOpponent[opp.id].showRate > 0"
                  class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
                  :title="$t('matchups.showrate_tooltip', { rate: statsByOpponent[opp.id].showRate })"
                >
                  SR {{ statsByOpponent[opp.id].showRate }}%
                </span>
              </div>

              <!-- Décompte précis des parties -->
              <div class="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span v-if="statsByOpponent?.[opp.id] && statsByOpponent[opp.id].total > 0">
                  <strong class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ statsByOpponent[opp.id].wins }}W</strong> - <strong class="text-red-600 dark:text-red-400 font-semibold">{{ statsByOpponent[opp.id].losses }}L</strong>
                  <span v-if="statsByOpponent[opp.id].draws" class="text-amber-600 dark:text-amber-400/90 font-semibold"> - {{ statsByOpponent[opp.id].draws }}D</span>
                  <span class="text-slate-400 dark:text-slate-500"> ({{ statsByOpponent[opp.id].total }} m.)</span>
                </span>
                <span v-else class="text-slate-400 dark:text-slate-500 italic">{{ $t('matchups.no_matches_played') }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Note de matchup affichée directement sur la carte -->
        <div
          v-if="statsByOpponent?.[opp.id]?.notes"
          class="mt-2.5 pl-2.5 py-0.5 border-l-2 border-amber-500/70"
        >
          <p class="text-xs text-amber-900 dark:text-amber-200/90 leading-snug line-clamp-2 break-words italic">
            {{ statsByOpponent[opp.id].notes }}
          </p>
        </div>

        <!-- Boutons d'action rapide Victoire (W) / Défaite (L) / Nul (D) -->
        <div class="mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-1.5 relative">
          <!-- SplitButton Victoire (BO1 au clic simple / BO3 au dropdown, clic droit ou appui long) -->
          <SplitButton
            type="win"
            @click-bo1="emit('log-match', opp.id, { format: 'bo1', result: 'win', game1: 'win' })"
            @select-bo3="(payload) => emit('log-match', opp.id, payload)"
          />

          <!-- SplitButton Défaite (BO1 au clic simple / BO3 au dropdown, clic droit ou appui long) -->
          <SplitButton
            type="loss"
            @click-bo1="emit('log-match', opp.id, { format: 'bo1', result: 'loss', game1: 'loss' })"
            @select-bo3="(payload) => emit('log-match', opp.id, payload)"
          />

          <!-- SplitButton Draw (BO1 au clic simple / BO3 1-1 au dropdown, clic droit ou appui long) -->
          <SplitButton
            type="draw"
            @click-bo1="emit('log-match', opp.id, { format: 'bo1', result: 'draw', game1: 'draw' })"
            @select-bo3="(payload) => emit('log-match', opp.id, payload)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
