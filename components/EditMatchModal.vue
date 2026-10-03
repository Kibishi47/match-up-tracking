<script setup lang="ts">
import type { Match, Archetype } from '~/server/db/schema'
import { useScrollLock } from '~/composables/useScrollLock'
import { useBottomSheetDrag } from '~/composables/useBottomSheetDrag'

interface MatchWithRelations extends Match {
  myArchetype?: Archetype
  opponentArchetype?: Archetype
}

const props = defineProps<{
  match: MatchWithRelations | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', match: Match): void
}>()

useScrollLock(computed(() => props.match !== null))

const result = ref<'win' | 'loss' | 'draw'>('win')
const format = ref<'bo1' | 'bo3'>('bo1')
const game1 = ref<'win' | 'loss' | 'draw' | null>(null)
const game2 = ref<'win' | 'loss' | 'draw' | null>(null)
const game3 = ref<'win' | 'loss' | 'draw' | null>(null)
const notes = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(() => props.match, (newMatch) => {
  if (newMatch) {
    result.value = newMatch.result
    notes.value = newMatch.notes || ''
    format.value = newMatch.format || 'bo1'
    game1.value = newMatch.game1 || newMatch.result
    game2.value = newMatch.game2 || null
    game3.value = newMatch.game3 || null
    errorMessage.value = null
  }
}, { immediate: true })

const saveMatch = async () => {
  if (!props.match) return
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const payload: any = {
      format: format.value,
      result: result.value,
      notes: notes.value
    }

    if (format.value === 'bo3') {
      payload.game1 = game1.value
      payload.game2 = game2.value
      payload.game3 = game3.value

      const games = [game1.value, game2.value, game3.value].filter(Boolean)
      const wins = games.filter(g => g === 'win').length
      const losses = games.filter(g => g === 'loss').length
      if (wins >= 2) payload.result = 'win'
      else if (losses >= 2) payload.result = 'loss'
      else if (wins === losses && games.length >= 2) payload.result = 'draw'
      result.value = payload.result
    }

    const updated = await $fetch<Match>(`/api/matches/${props.match.id}`, {
      method: 'PUT',
      body: payload
    })

    emit('updated', updated)
    emit('close')
  } catch (err: any) {
    const { t } = useI18n()
    errorMessage.value = err?.data?.statusMessage || t('edit_match_modal.update_error')
  } finally {
    isSubmitting.value = false
  }
}

const { sheetRef, sheetStyle, backdropStyle, dragHandleProps, isDragging, isDragClosed } = useBottomSheetDrag(() => emit('close'))
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="match"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
        :style="backdropStyle"
        @click.self="emit('close')"
      >
        <div
          ref="sheetRef"
          :class="[
            'modal-card relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl border-t sm:border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] pb-safe sm:pb-0',
            { 'is-drag-closed': isDragClosed }
          ]"
          :style="sheetStyle"
        >
          <!-- Header -->
          <div class="px-6 pt-2 pb-4 sm:py-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col bg-white dark:bg-slate-900 flex-shrink-0">
            <!-- Poignée de glissement sur mobile -->
            <div
              class="w-full pt-1 pb-3 -mt-1 sm:hidden flex justify-center items-center cursor-grab active:cursor-grabbing touch-none select-none flex-shrink-0"
              v-bind="dragHandleProps"
            >
              <div
                :class="[
                  'w-12 h-1.5 rounded-full transition-all duration-150',
                  isDragging ? 'bg-slate-400 dark:bg-slate-500 w-14' : 'bg-slate-300 dark:bg-slate-700'
                ]"
              />
            </div>

            <div class="flex items-center justify-between">
              <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <span>{{ $t('edit_match_modal.title') }}</span>
              </h3>
              <button
                type="button"
                @click="emit('close')"
                class="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                :aria-label="$t('common.close')"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <form id="edit-match-form" @submit.prevent="saveMatch" class="p-6 space-y-4 overflow-y-auto flex-1">
            <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
              <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Deck : <strong class="text-slate-900 dark:text-white">{{ match.myArchetype?.name || $t('notes_modal.my_deck') }}</strong></span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {{ format === 'bo3' ? $t('edit_match_modal.format_bo3') : $t('edit_match_modal.format_bo1') }}
                </span>
                <span>vs : <strong class="text-slate-900 dark:text-white">{{ match.opponentArchetype?.name || $t('notes_modal.opponent_deck') }}</strong></span>
              </div>
            </div>

            <!-- Détail des manches en BO3 -->
            <div v-if="format === 'bo3'" class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-700 dark:text-slate-300">{{ $t('edit_match_modal.bo3_details') }}</span>
                <span class="text-[11px] font-mono font-bold text-slate-500">
                  {{ $t('edit_match_modal.score') }} : {{ [game1, game2, game3].filter(g => g === 'win').length }} - {{ [game1, game2, game3].filter(g => g === 'loss').length }}
                </span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="text-center">
                  <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">{{ $t('edit_match_modal.game_1') }}</div>
                  <select v-model="game1" class="w-full text-xs font-semibold py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer">
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="draw">Draw</option>
                  </select>
                </div>
                <div class="text-center">
                  <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">{{ $t('edit_match_modal.game_2') }}</div>
                  <select v-model="game2" class="w-full text-xs font-semibold py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer">
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="draw">Draw</option>
                  </select>
                </div>
                <div class="text-center">
                  <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">{{ $t('edit_match_modal.game_3') }}</div>
                  <select v-model="game3" class="w-full text-xs font-semibold py-1.5 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer">
                    <option :value="null">{{ $t('edit_match_modal.not_played') }}</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="draw">Draw</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {{ $t('edit_match_modal.result_label') }}
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="result = 'win'"
                  :class="[
                    'py-2.5 rounded-xl font-bold text-xs sm:text-sm transition border flex items-center justify-center gap-1 cursor-pointer',
                    result === 'win'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  ]"
                >
                  <span>Win</span>
                </button>

                <button
                  type="button"
                  @click="result = 'loss'"
                  :class="[
                    'py-2.5 rounded-xl font-bold text-xs sm:text-sm transition border flex items-center justify-center gap-1 cursor-pointer',
                    result === 'loss'
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  ]"
                >
                  <span>Loss</span>
                </button>

                <button
                  type="button"
                  @click="result = 'draw'"
                  :class="[
                    'py-2.5 rounded-xl font-bold text-xs sm:text-sm transition border flex items-center justify-center gap-1 cursor-pointer',
                    result === 'draw'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  ]"
                >
                  <span>Draw</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                {{ $t('edit_match_modal.notes_label') }}
              </label>
              <textarea
                v-model="notes"
                rows="3"
                :placeholder="$t('edit_match_modal.notes_placeholder')"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm resize-none"
              />
            </div>

            <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
              {{ errorMessage }}
            </div>
          </form>

          <!-- Footer avec séparation et espacement safe area -->
          <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900 flex items-center justify-end flex-shrink-0">
            <button
              type="submit"
              form="edit-match-form"
              :disabled="isSubmitting"
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {{ isSubmitting ? $t('edit_match_modal.saving') : $t('edit_match_modal.save') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
