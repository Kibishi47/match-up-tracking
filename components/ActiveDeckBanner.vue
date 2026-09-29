<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'
import AppDropdown from '~/components/ui/AppDropdown.vue'

const props = defineProps<{
  deck: Archetype | null
  allDecks: Archetype[]
  stats: {
    total: number
    wins: number
    losses: number
    draws?: number
    winrate: number
  }
}>()

const emit = defineEmits<{
  (e: 'change-deck', deckId: string): void
}>()

const deckOptions = computed(() => {
  return props.allDecks.map(d => ({
    value: d.id,
    label: d.name,
    iconUrl: d.card1ImageUrl,
    iconText: d.card1ImageUrl ? undefined : '🎴'
  }))
})
</script>

<template>
  <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950 min-h-[188px] flex flex-col justify-center">
    <!-- Ambient glow behind cards -->
    <div class="absolute -left-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

    <div v-if="!deck" class="text-center py-6">
      <div class="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-2xl mb-3 shadow-inner">
        🎴
      </div>
      <h3 class="text-lg font-bold text-white">Aucun deck actif sélectionné</h3>
      <p class="text-sm text-slate-400 mt-1 max-w-md mx-auto">
        Créez ou sélectionnez votre deck pour commencer à enregistrer vos confrontations.
      </p>
      <NuxtLink
        to="/archetypes"
        class="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20 active:scale-95"
      >
        <span>+ Configurer mes decks</span>
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
      <!-- Deck visuals & Title -->
      <div class="flex items-center gap-6 sm:gap-8">
        <!-- Two overlapping key cards -->
        <div class="relative w-28 h-32 flex-shrink-0 group">
          <!-- Card 1 (Back/Tilted left) -->
          <div
            class="absolute left-0 top-2 w-20 h-28 rounded-xl bg-slate-800 border-2 border-slate-700/80 overflow-hidden shadow-xl transform -rotate-6 group-hover:-rotate-12 transition-transform duration-300"
          >
            <img
              v-if="deck.card1ImageUrl"
              :src="deck.card1ImageUrl"
              :alt="deck.card1Name || 'Carte clé 1'"
              class="w-full h-full object-cover"
              @error="(e) => (e.target as HTMLElement).style.display = 'none'"
            />
            <div v-else class="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500 bg-slate-800">
              C1
            </div>
          </div>

          <!-- Card 2 (Front/Tilted right) -->
          <div
            class="absolute left-8 top-0 w-20 h-28 rounded-xl bg-slate-700 border-2 border-slate-600/80 overflow-hidden shadow-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-300"
          >
            <img
              v-if="deck.card2ImageUrl"
              :src="deck.card2ImageUrl"
              :alt="deck.card2Name || 'Carte clé 2'"
              class="w-full h-full object-cover"
              @error="(e) => (e.target as HTMLElement).style.display = 'none'"
            />
            <div v-else class="w-full h-full flex items-center justify-center font-bold text-xs text-slate-400 bg-slate-800">
              C2
            </div>
          </div>
        </div>

        <!-- Title & Deck Switcher -->
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Deck Actif
            </span>
            <span v-if="deck.card1Name" class="hidden sm:inline text-xs text-slate-400 truncate max-w-xs">
              {{ deck.card1Name }}<span v-if="deck.card2Name"> / {{ deck.card2Name }}</span>
            </span>
          </div>

          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight truncate max-w-lg">
            {{ deck.name }}
          </h2>

          <!-- Sélecteur rapide de deck alternatif -->
          <div class="mt-2.5 flex items-center gap-2">
            <span class="text-xs text-slate-400 font-medium">Permuter :</span>
            <AppDropdown
              :model-value="deck.id"
              :options="deckOptions"
              placeholder="Changer de deck..."
              menu-width-class="w-64"
              button-class="px-2.5 py-1 text-xs"
              @change="emit('change-deck', $event)"
            />

            <NuxtLink to="/archetypes" class="text-xs text-slate-400 hover:text-white transition ml-1" title="Gérer tous mes decks">
              ⚙️
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Stats Showcase -->
      <div class="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-8 justify-between lg:justify-end">
        <div class="text-left lg:text-right">
          <span class="text-xs uppercase tracking-wider font-bold text-slate-400 block">
            Taux de victoire
          </span>
          <div class="flex items-baseline gap-2 mt-0.5">
            <span
              :class="[
                'text-3xl sm:text-4xl font-black tracking-tight',
                stats.winrate >= 55 ? 'text-emerald-400' : (stats.winrate >= 45 ? 'text-white' : 'text-red-400')
              ]"
            >
              {{ stats.winrate }}%
            </span>
          </div>
          <div class="text-xs text-slate-400 mt-1 flex items-center gap-1.5 lg:justify-end">
            <strong class="text-emerald-400">{{ stats.wins }}W</strong> -
            <strong class="text-red-400">{{ stats.losses }}L</strong>
            <span v-if="stats.draws" class="text-amber-400">- <strong>{{ stats.draws }}D</strong></span>
          </div>
        </div>

        <div
          class="w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black border shadow-lg"
          :class="stats.winrate >= 50
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-slate-800/80 border-slate-700 text-slate-300'"
        >
          <span class="text-lg leading-none">{{ stats.total }}</span>
          <span class="text-[10px] uppercase font-bold text-slate-400 mt-0.5">matchs</span>
        </div>
      </div>
    </div>
  </div>
</template>
