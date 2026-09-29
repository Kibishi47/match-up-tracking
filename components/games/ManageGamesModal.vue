<script setup lang="ts">
import type { Game } from '~/server/db/schema'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const { games: userGames, refreshGames } = useGameSession()

// Récupérer tout le catalogue global de jeux
const { data: allCatalogGames, refresh: refreshCatalog, status: catalogStatus } = await useFetch<Game[]>('/api/games')

const loadingToggleId = ref<string | null>(null)

// Vérifie si un jeu fait partie de la collection de l'utilisateur
const isGameActive = (gameId: string) => {
  return (userGames.value || []).some(g => g.id === gameId)
}

const toggleGame = async (game: Game) => {
  loadingToggleId.value = game.id
  try {
    await $fetch('/api/user/games/toggle', {
      method: 'POST',
      body: { gameId: game.id }
    })
    await refreshGames()
    emit('updated')
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Erreur lors de la mise à jour du jeu')
  } finally {
    loadingToggleId.value = null
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto p-4 flex min-h-full items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      @click.self="emit('close')"
    >
    <div
      class="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 flex flex-col max-h-[85vh] my-auto"
      role="dialog"
      aria-modal="true"
    >
      <!-- En-tête fixe -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-800/80 flex-shrink-0">
        <div>
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <span>🎮</span>
            <span>Gérer ma collection de jeux</span>
          </h3>
          <p class="text-xs text-slate-400 mt-0.5">
            Activez les jeux auxquels vous jouez pour les afficher dans votre sélecteur.
          </p>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Corps : Liste des jeux du catalogue (scrollable avec min-h-0) -->
      <div class="py-4 overflow-y-auto space-y-2.5 flex-1 min-h-0 pr-1">
        <div v-if="catalogStatus === 'pending'" class="py-8 text-center text-xs text-slate-400">
          Chargement du catalogue...
        </div>

        <div v-else-if="!allCatalogGames || allCatalogGames.length === 0" class="py-8 text-center text-xs text-slate-500">
          Aucun jeu disponible dans le catalogue global.
        </div>

        <div
          v-else
          v-for="game in allCatalogGames"
          :key="game.id"
          class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition"
        >
          <!-- Info jeu -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/80 overflow-hidden flex items-center justify-center flex-shrink-0">
              <img
                v-if="game.logoUrl"
                :src="game.logoUrl"
                :alt="game.name"
                class="w-full h-full object-contain p-1"
              />
              <span v-else class="text-base">🃏</span>
            </div>
            <div class="truncate">
              <p class="text-sm font-semibold text-white truncate">{{ game.name }}</p>
              <p class="text-xs text-slate-400 truncate">{{ game.slug }}</p>
            </div>
          </div>

          <!-- Switch / Bouton d'activation -->
          <button
            type="button"
            :disabled="loadingToggleId === game.id"
            @click="toggleGame(game)"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none',
              isGameActive(game.id)
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30'
            ]"
          >
            <span v-if="loadingToggleId === game.id" class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isGameActive(game.id) ? 'Actif ✓' : '+ Ajouter' }}</span>
          </button>
        </div>
      </div>

      <!-- Pied de modale fixe -->
      <div class="pt-4 border-t border-slate-800 flex justify-end flex-shrink-0">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>
