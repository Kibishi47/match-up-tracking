<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'
import SelectActiveDeckModal from '~/components/modal/SelectActiveDeckModal.vue'

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

const isSelectModalOpen = ref(false)
</script>

<template>
  <div class="glass-panel p-4 sm:p-6 lg:p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl relative bg-white/90 dark:bg-gradient-to-r dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-950 flex flex-col justify-center transition-colors">
    <!-- Ambient glow behind cards (isolé dans son propre conteneur clippé) -->
    <div class="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
      <div class="absolute -left-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>

    <div v-if="!deck" class="text-center py-4 sm:py-6">
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-2.5 shadow-inner">
        <svg class="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect width="14" height="18" x="3" y="3" rx="2" />
          <path d="M7 3v18" />
          <path d="M10 7.5h4" />
        </svg>
      </div>
      <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Aucun deck actif sélectionné</h3>
      <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
        Créez ou sélectionnez votre deck pour commencer à enregistrer vos confrontations.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-2.5 mt-3.5">
        <button
          v-if="allDecks.length > 0"
          type="button"
          @click="isSelectModalOpen = true"
          class="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          <span>Choisir mon deck actif</span>
        </button>
        <NuxtLink
          to="/archetypes"
          class="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition shadow-sm active:scale-95"
        >
          <span>+ Configurer mes decks</span>
        </NuxtLink>
      </div>
    </div>

    <div v-else class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
      <!-- Deck visuals & Title -->
      <div class="flex items-center gap-3.5 sm:gap-6">
        <!-- Visuel cartes du Deck : Éventail si 2 cartes, Carte droite si 1 seule carte -->
        <div v-if="deck.card2ImageUrl || deck.card2Name" class="relative w-24 h-28 sm:w-28 sm:h-32 flex-shrink-0 group">
          <!-- Card 1 (Back/Tilted left) -->
          <div
            class="absolute left-0 top-1 sm:top-2 w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-slate-200 dark:bg-slate-800 border sm:border-2 border-slate-300 dark:border-slate-700/80 overflow-hidden shadow-md transform -rotate-6 group-hover:-rotate-12 transition-transform duration-300"
          >
            <img
              v-if="deck.card1ImageUrl"
              :src="deck.card1ImageUrl"
              :alt="deck.card1Name || 'Carte clé 1'"
              class="w-full h-full object-cover"
              @error="(e) => (e.target as HTMLElement).style.display = 'none'"
            />
            <div v-else class="w-full h-full flex items-center justify-center font-bold text-xs text-slate-500 bg-slate-200 dark:bg-slate-800">
              C1
            </div>
          </div>

          <!-- Card 2 (Front/Tilted right) -->
          <div
            class="absolute left-6 sm:left-8 top-0 w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-slate-100 dark:bg-slate-700 border sm:border-2 border-slate-300 dark:border-slate-600/80 overflow-hidden shadow-lg transform rotate-6 group-hover:rotate-12 transition-transform duration-300"
          >
            <img
              v-if="deck.card2ImageUrl"
              :src="deck.card2ImageUrl"
              :alt="deck.card2Name || 'Carte clé 2'"
              class="w-full h-full object-cover"
              @error="(e) => (e.target as HTMLElement).style.display = 'none'"
            />
            <div v-else class="w-full h-full flex items-center justify-center font-bold text-xs text-slate-400 bg-slate-200 dark:bg-slate-800">
              C2
            </div>
          </div>
        </div>

        <!-- 1 seule carte droite (même taille desktop et mobile) -->
        <div
          v-else
          class="w-20 h-28 rounded-xl bg-slate-200 dark:bg-slate-800 border sm:border-2 border-slate-300 dark:border-slate-700/80 overflow-hidden shadow-md flex-shrink-0 flex items-center justify-center group"
        >
          <img
            v-if="deck.card1ImageUrl"
            :src="deck.card1ImageUrl"
            :alt="deck.card1Name || 'Carte clé'"
            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            @error="(e) => (e.target as HTMLElement).style.display = 'none'"
          />
          <div v-else class="w-full h-full flex items-center justify-center font-bold text-sm text-slate-500 bg-slate-200 dark:bg-slate-800">
            C1
          </div>
        </div>

        <!-- Title & Deck Switcher -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex-shrink-0">
              Deck Actif
            </span>
            <span v-if="deck.card1Name || deck.card2Name" class="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs" :title="[deck.card1Name, deck.card2Name].filter(Boolean).join(' // ')">
              {{ [deck.card1Name, deck.card2Name].filter(Boolean).join(' // ') }}
            </span>
          </div>

          <h2 class="text-lg min-[400px]:text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-lg">
            {{ deck.name }}
          </h2>

          <!-- Nom des cartes de l'archétype sur mobile (séparateur //) -->
          <p v-if="deck.card1Name || deck.card2Name" class="sm:hidden text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" :title="[deck.card1Name, deck.card2Name].filter(Boolean).join(' // ')">
            {{ [deck.card1Name, deck.card2Name].filter(Boolean).join(' // ') }}
          </p>

          <!-- Sélecteur rapide de deck alternatif via Modale -->
          <div class="mt-2 sm:mt-2.5 flex items-center gap-2">
            <button
              type="button"
              @click="isSelectModalOpen = true"
              class="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-semibold transition active:scale-95 shadow-sm cursor-pointer group"
              title="Changer de deck actif"
            >
              <svg class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="18" x="5" y="3" rx="2" />
                <path d="M9 7h6M9 11h6M9 15h4" />
              </svg>
              <span>Changer de deck</span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500 font-normal">({{ allDecks.length }})</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Showcase compacte et épurée -->
      <div class="flex items-center gap-4 sm:gap-6 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-slate-800/80 pt-2.5 lg:pt-0 lg:pl-8 justify-between lg:justify-end">
        <div class="text-left lg:text-right">
          <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">
            Taux de victoire
          </span>
          <div class="flex items-baseline gap-2 mt-0.5 lg:justify-end">
            <span
              :class="[
                'text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-none',
                stats.winrate >= 55 ? 'text-emerald-600 dark:text-emerald-400' : (stats.winrate >= 45 ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400')
              ]"
            >
              {{ stats.winrate }}%
            </span>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 lg:justify-end">
            <strong class="text-emerald-600 dark:text-emerald-400">{{ stats.wins }}W</strong> -
            <strong class="text-red-600 dark:text-red-400">{{ stats.losses }}L</strong>
            <span v-if="stats.draws" class="text-amber-600 dark:text-amber-400">- <strong>{{ stats.draws }}D</strong></span>
          </div>
        </div>

        <div class="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

        <div class="text-right">
          <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">
            Parties
          </span>
          <div class="flex items-baseline justify-end gap-1 mt-0.5">
            <span class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {{ stats.total }}
            </span>
          </div>
          <span class="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {{ stats.total > 1 ? 'matchs' : 'match' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Modale de sélection de deck actif -->
    <SelectActiveDeckModal
      :is-open="isSelectModalOpen"
      :decks="allDecks"
      :active-deck-id="deck?.id || null"
      @close="isSelectModalOpen = false"
      @select="emit('change-deck', $event)"
    />
  </div>
</template>
