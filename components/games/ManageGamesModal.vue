<script setup lang="ts">
import type { Game } from '~/server/db/schema'
import { useScrollLock } from '~/composables/useScrollLock'
import { useBottomSheetDrag } from '~/composables/useBottomSheetDrag'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

useScrollLock(toRef(props, 'isOpen'))

const { games: userGames, refreshGames } = useGameSession()

// Récupérer le catalogue global uniquement quand la modale est ouverte pour éviter un fetch inutile au chargement
const { data: allCatalogGames, refresh: refreshCatalog, status: catalogStatus, execute } = useLazyFetch<Game[]>('/api/games', {
  immediate: false,
  key: 'catalog-all-games'
})

watch(
  () => props.isOpen,
  (open) => {
    if (open && (!allCatalogGames.value || allCatalogGames.value.length === 0)) {
      execute()
    }
  },
  { immediate: true }
)

// Tri alphabétique insensible à la casse
const sortedCatalogGames = computed(() => {
  return [...(allCatalogGames.value || [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
  )
})

const loadingToggleId = ref<string | null>(null)

// Vérifie si un jeu fait partie de la collection de l'utilisateur
const isGameActive = (gameId: string) => {
  return (userGames.value || []).some(g => g.id === gameId)
}

const { toast } = useNotify()
const { t } = useI18n()

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
    toast.error(err?.data?.statusMessage || t('manage_games_modal.update_error'))
  } finally {
    loadingToggleId.value = null
  }
}

const { sheetRef, sheetStyle, backdropStyle, dragHandleProps, isDragging, isDragClosed } = useBottomSheetDrag(() => emit('close'))
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto p-0 sm:p-4 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md"
        :style="backdropStyle"
        @click.self="emit('close')"
      >
        <div
          ref="sheetRef"
          :class="[
            'modal-card relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 pb-safe sm:pb-6 flex flex-col max-h-[90vh] sm:max-h-[85vh]',
            { 'is-drag-closed': isDragClosed }
          ]"
          :style="sheetStyle"
          role="dialog"
          aria-modal="true"
        >
        <!-- Poignée de glissement sur mobile -->
        <div
          class="w-full pt-1 pb-3 -mt-2 sm:hidden flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none flex-shrink-0"
          v-bind="dragHandleProps"
        >
          <div
            :class="[
              'w-12 h-1.5 rounded-full transition-all duration-150',
              isDragging ? 'bg-slate-400 dark:bg-slate-500 w-14' : 'bg-slate-300 dark:bg-slate-700'
            ]"
          />
        </div>

        <!-- En-tête fixe -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80 flex-shrink-0">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="20" height="12" x="2" y="6" rx="6" />
                <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
              </svg>
              <span>{{ $t('manage_games_modal.title') }}</span>
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ $t('manage_games_modal.subtitle') }}
            </p>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            :aria-label="$t('common.close')"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Corps : Liste des jeux du catalogue triée alphabétiquement -->
        <div class="py-4 overflow-y-auto space-y-2.5 flex-1 min-h-0 pr-1">
          <div v-if="catalogStatus === 'pending'" class="space-y-2.5">
            <div
              v-for="i in 4"
              :key="i"
              class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 animate-pulse"
            >
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              </div>
              <div class="w-20 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>

          <div v-else-if="!sortedCatalogGames || sortedCatalogGames.length === 0" class="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {{ $t('manage_games_modal.no_games') }}
          </div>

          <div
            v-else
            v-for="game in sortedCatalogGames"
            :key="game.id"
            class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <!-- Info jeu -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 overflow-hidden flex items-center justify-center flex-shrink-0">
                <img
                  v-if="game.logoUrl"
                  :src="game.logoUrl"
                  :alt="game.name"
                  class="w-full h-full object-contain p-1"
                />
                <svg v-else class="w-5 h-5 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="14" height="18" x="5" y="3" rx="2" />
                  <path d="M9 7h6" />
                </svg>
              </div>
              <div class="truncate">
                <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ game.name }}</p>
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
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-400 hover:border-red-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-500/30'
              ]"
            >
              <span v-if="loadingToggleId === game.id" class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              <template v-else-if="isGameActive(game.id)">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{{ $t('manage_games_modal.active') }}</span>
              </template>
              <template v-else>
                <span>{{ $t('manage_games_modal.add') }}</span>
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>
