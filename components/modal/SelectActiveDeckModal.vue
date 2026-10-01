<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'

const props = defineProps<{
  isOpen: boolean
  decks: Archetype[]
  activeDeckId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', deckId: string): void
}>()

const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

// Réinitialiser la recherche et focus à l'ouverture
watch(() => props.isOpen, (open) => {
  if (open) {
    searchQuery.value = ''
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      nextTick(() => {
        searchInputRef.value?.focus()
      })
    }
  }
})

// Support de la touche Échap
onMounted(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.isOpen) {
      emit('close')
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
})

// Filtrage insensible à la casse et aux accents
const filteredDecks = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.decks

  return props.decks.filter((d) => {
    const nameMatch = d.name.toLowerCase().includes(q)
    const card1Match = d.card1Name?.toLowerCase().includes(q) || false
    const card2Match = d.card2Name?.toLowerCase().includes(q) || false
    return nameMatch || card1Match || card2Match
  })
})

const handleSelect = (deckId: string) => {
  emit('select', deckId)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto p-0 sm:p-4 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md"
        @click.self="emit('close')"
      >
        <div
          class="modal-card relative w-full max-w-2xl rounded-t-3xl sm:rounded-3xl rounded-b-none sm:rounded-b-3xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] pb-safe sm:pb-0"
          role="dialog"
          aria-modal="true"
          aria-labelledby="select-deck-modal-title"
        >
          <!-- Header -->
          <div class="px-6 pt-3 pb-4 sm:py-5 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0">
            <!-- Poignée de glissement sur mobile -->
            <div class="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden flex-shrink-0" />

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm flex-shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 id="select-deck-modal-title" class="text-base font-bold text-slate-900 dark:text-white">
                    Sélectionner le Deck Actif
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Choisissez votre deck principal pour analyser vos matchups
                  </p>
                </div>
              </div>

              <button
                type="button"
                @click="emit('close')"
                class="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                aria-label="Fermer"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

        <!-- Champ de recherche instantanée -->
        <div class="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex-shrink-0">
          <div class="relative">
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
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher par nom de deck ou nom de carte..."
              class="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              title="Effacer la recherche"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Corps : Liste des archétypes sous forme de grille -->
        <div class="p-4 sm:p-6 overflow-y-auto flex-1">
          <!-- Aucun archétype configuré dans le jeu -->
          <div v-if="decks.length === 0" class="text-center py-10">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect width="14" height="18" x="3" y="3" rx="2" />
                <path d="M7 3v18" />
              </svg>
            </div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">Aucun archétype enregistré</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Vous devez d'abord créer des archétypes dans ce jeu pour pouvoir définir votre deck actif.
            </p>
            <NuxtLink
              to="/archetypes"
              @click="emit('close')"
              class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm"
            >
              <span>+ Gérer les archétypes</span>
            </NuxtLink>
          </div>

          <!-- Aucun résultat de recherche -->
          <div v-else-if="filteredDecks.length === 0" class="text-center py-10">
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Aucun archétype ne correspond à « <strong class="text-slate-800 dark:text-slate-200">{{ searchQuery }}</strong> ».
            </p>
            <button
              type="button"
              @click="searchQuery = ''"
              class="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Réinitialiser la recherche
            </button>
          </div>

          <!-- Grille des Decks -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="d in filteredDecks"
              :key="d.id"
              type="button"
              @click="handleSelect(d.id)"
              :class="[
                'text-left p-3 rounded-2xl border transition-all duration-200 flex items-center gap-3 group relative cursor-pointer',
                d.id === activeDeckId
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 dark:border-emerald-500/60 shadow-sm'
                  : 'bg-slate-50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow'
              ]"
            >
              <!-- Deux cartes superposées compactes -->
              <div class="relative w-12 h-14 flex-shrink-0">
                <!-- Carte 1 (Arrière / Inclinée gauche) -->
                <div class="absolute left-0 top-0.5 w-8 h-12 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 overflow-hidden shadow-sm transform -rotate-6 group-hover:-rotate-12 transition-transform">
                  <img
                    v-if="d.card1ImageUrl"
                    :src="d.card1ImageUrl"
                    :alt="d.card1Name || 'Carte 1'"
                    class="w-full h-full object-cover"
                    @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center font-bold text-[8px] text-slate-400">
                    C1
                  </div>
                </div>

                <!-- Carte 2 (Avant / Inclinée droite) -->
                <div class="absolute left-3.5 top-0 w-8 h-12 rounded bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 overflow-hidden shadow transform rotate-6 group-hover:rotate-12 transition-transform">
                  <img
                    v-if="d.card2ImageUrl"
                    :src="d.card2ImageUrl"
                    :alt="d.card2Name || 'Carte 2'"
                    class="w-full h-full object-cover"
                    @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center font-bold text-[8px] text-slate-400">
                    C2
                  </div>
                </div>
              </div>

              <!-- Informations de l'archétype -->
              <div class="min-w-0 flex-1 pr-6">
                <div class="flex items-center gap-1.5">
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" :title="d.name">
                    {{ d.name }}
                  </h4>
                </div>

                <p v-if="d.card1Name || d.card2Name" class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" :title="[d.card1Name, d.card2Name].filter(Boolean).join(' // ')">
                  {{ [d.card1Name, d.card2Name].filter(Boolean).join(' // ') }}
                </p>
                <p v-else class="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                  Aucune carte renseignée
                </p>
              </div>

              <!-- Indicateur sélectionné (Checkmark) -->
              <div
                v-if="d.id === activeDeckId"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm"
                title="Deck actuellement actif"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          <span>
            {{ filteredDecks.length }} archétype{{ filteredDecks.length > 1 ? 's' : '' }} disponible{{ filteredDecks.length > 1 ? 's' : '' }}
          </span>

          <NuxtLink
            to="/archetypes"
            @click="emit('close')"
            class="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Gérer les archétypes
          </NuxtLink>
        </div>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>
