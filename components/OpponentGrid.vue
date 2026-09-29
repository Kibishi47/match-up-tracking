<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'

export interface OpponentStats {
  wins: number
  losses: number
  draws?: number
  total: number
  winrate: number
  showRate: number
}

const props = defineProps<{
  opponents: Archetype[]
  statsByOpponent: Record<string, OpponentStats>
}>()

const emit = defineEmits<{
  (e: 'log-match', opponentId: string, result: 'win' | 'loss'): void
}>()
</script>

<template>
  <div>
    <!-- État 0 archétype dans le jeu -->
    <div v-if="opponents.length === 0" class="glass-panel p-12 rounded-3xl border border-slate-800 text-center">
      <div class="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400 mb-3 shadow-inner">
        <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect width="14" height="18" x="3" y="3" rx="2" />
          <path d="M7 3v18" />
          <path d="M10 7.5h4" />
        </svg>
      </div>
      <h4 class="text-lg font-bold text-white">Aucun archétype adverse enregistré</h4>
      <p class="text-sm text-slate-400 mt-1 max-w-md mx-auto">
        Renseignez les decks du metagame pour ce jeu pour afficher la grille de saisie rapide.
      </p>
      <NuxtLink
        to="/archetypes"
        class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20 active:scale-95"
      >
        <span>+ Ajouter un archétype</span>
      </NuxtLink>
    </div>

    <!-- Grille des cartes adverses (Gabarit 1:1 rigoureusement aligné avec le skeleton) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="opp in opponents"
        :key="opp.id"
        class="glass-panel rounded-2xl border border-slate-800/90 hover:border-slate-700 transition overflow-hidden flex flex-col justify-between p-4 group bg-slate-900/60 hover:bg-slate-900/80 min-h-[172px]"
      >
        <!-- Visuel et infos de l'adversaire -->
        <div>
          <div class="flex items-center gap-2.5 mb-2.5">
            <!-- Vignette Carte 1 -->
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

            <!-- Vignette Carte 2 (si présente) -->
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

            <div class="min-w-0 flex-1 ml-0.5">
              <h4 class="font-bold text-white text-sm sm:text-base truncate group-hover:text-emerald-400 transition" :title="opp.name">
                {{ opp.name }}
              </h4>

              <!-- Métriques : Win Rate (WR) & Show Rate (SR) -->
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                <!-- Badge Win Rate (WR) -->
                <span
                  v-if="statsByOpponent?.[opp.id] && statsByOpponent[opp.id].total > 0"
                  :class="[
                    'px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border',
                    statsByOpponent[opp.id].winrate >= 55
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : (statsByOpponent[opp.id].winrate >= 45
                        ? 'bg-slate-800 text-slate-300 border-slate-700'
                        : 'bg-red-500/15 text-red-400 border-red-500/30')
                  ]"
                  :title="`Taux de victoire : ${statsByOpponent[opp.id].wins}V - ${statsByOpponent[opp.id].losses}D`"
                >
                  WR {{ statsByOpponent[opp.id].winrate }}%
                </span>
                <span v-else class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700/60">
                  WR - %
                </span>

                <!-- Badge Show Rate (SR) -->
                <span
                  v-if="statsByOpponent?.[opp.id] && statsByOpponent[opp.id].showRate > 0"
                  class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                  :title="`Taux de présence dans vos matchs : ${statsByOpponent[opp.id].showRate}%`"
                >
                  SR {{ statsByOpponent[opp.id].showRate }}%
                </span>
              </div>

              <!-- Décompte précis des parties -->
              <div class="mt-1 text-[11px] text-slate-400">
                <span v-if="statsByOpponent?.[opp.id] && statsByOpponent[opp.id].total > 0">
                  {{ statsByOpponent[opp.id].wins }}W - {{ statsByOpponent[opp.id].losses }}L
                  <span class="text-slate-500">({{ statsByOpponent[opp.id].total }} m.)</span>
                </span>
                <span v-else class="text-slate-500 italic">0 match joué</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Boutons d'action rapide Victoire (W) / Défaite (L) -->
        <div class="mt-2 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
          <button
            @click="emit('log-match', opp.id, 'win')"
            class="py-2.5 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
            title="Enregistrer une victoire immédiate"
          >
            <span>VICTOIRE</span>
            <span class="text-xs bg-emerald-700/60 px-1.5 py-0.5 rounded">W</span>
          </button>

          <button
            @click="emit('log-match', opp.id, 'loss')"
            class="py-2.5 rounded-xl font-black text-sm text-white bg-red-600 hover:bg-red-500 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer"
            title="Enregistrer une défaite immédiate"
          >
            <span>DÉFAITE</span>
            <span class="text-xs bg-red-700/60 px-1.5 py-0.5 rounded">L</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
