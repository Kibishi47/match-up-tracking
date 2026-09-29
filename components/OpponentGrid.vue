<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'

const props = defineProps<{
  opponents: Archetype[]
  statsByOpponent: Record<string, { wins: number; losses: number; draws?: number; total: number; winrate: number }>
}>()

const emit = defineEmits<{
  (e: 'log-match', opponentId: string, result: 'win' | 'loss'): void
}>()
</script>

<template>
  <div>
    <div v-if="opponents.length === 0" class="glass-panel p-12 rounded-3xl border border-slate-800 text-center">
      <div class="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-2xl mb-3">
        🃏
      </div>
      <h3 class="text-lg font-bold text-white">Aucun archétype adverse enregistré</h3>
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

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="opp in opponents"
        :key="opp.id"
        class="glass-panel rounded-2xl border border-slate-800/90 hover:border-slate-700 transition overflow-hidden flex flex-col justify-between p-4 group bg-slate-900/60 hover:bg-slate-900/80"
      >
        <!-- Opponent deck visual & info -->
        <div>
          <div class="flex items-center gap-2.5 mb-3">
            <!-- Card 1 thumbnail -->
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

            <!-- Card 2 thumbnail (if present) -->
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
              <h4 class="font-bold text-white text-base truncate group-hover:text-emerald-400 transition" :title="opp.name">
                {{ opp.name }}
              </h4>
              <div class="mt-1 text-xs text-slate-400">
                <span v-if="statsByOpponent?.[opp.id] && statsByOpponent[opp.id].total > 0">
                  <strong class="text-emerald-400">{{ statsByOpponent[opp.id].wins }}W</strong> -
                  <strong class="text-red-400">{{ statsByOpponent[opp.id].losses }}L</strong>
                  <span class="text-slate-400 font-semibold ml-1">({{ statsByOpponent[opp.id].winrate }}%)</span>
                </span>
                <span v-else class="text-slate-500 italic text-[11px]">0 match joué</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 1-Click W / L Action Buttons -->
        <div class="mt-2 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
          <button
            @click="emit('log-match', opp.id, 'win')"
            class="py-2.5 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
            title="Enregistrer une victoire immédiate"
          >
            <span>VICTOIRE</span>
            <span class="text-xs bg-emerald-700/60 px-1.5 py-0.5 rounded">W</span>
          </button>

          <button
            @click="emit('log-match', opp.id, 'loss')"
            class="py-2.5 rounded-xl font-black text-sm text-white bg-red-600 hover:bg-red-500 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40"
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
