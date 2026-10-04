<script setup lang="ts">
import type { Game } from '~/server/db/schema'
import { useScrollLock } from '~/composables/useScrollLock'
import { useBottomSheetDrag } from '~/composables/useBottomSheetDrag'

const props = defineProps<{
  isOpen: boolean
  game?: Game | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', game: Game): void
}>()

useScrollLock(toRef(props, 'isOpen'))

const isEditing = computed(() => !!props.game?.id)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const { t } = useI18n()

const form = reactive({
  name: '',
  logoUrl: ''
})

const resetForm = () => {
  if (props.game) {
    form.name = props.game.name || ''
    form.logoUrl = props.game.logoUrl || ''
  } else {
    form.name = ''
    form.logoUrl = ''
  }
  errorMessage.value = null
}

watch(
  () => [props.isOpen, props.game],
  ([open]) => {
    if (open) {
      resetForm()
      if (typeof window !== 'undefined' && window.innerWidth >= 640) {
        nextTick(() => {
          nameInputRef.value?.focus()
        })
      }
    }
  },
  { immediate: true }
)

const handleSubmit = async () => {
  const trimmedName = form.name.trim()
  if (!trimmedName) {
    errorMessage.value = t('admin_games.name_required')
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    let savedGame: Game

    if (isEditing.value && props.game?.id) {
      savedGame = await $fetch<Game>(`/api/admin/games/${props.game.id}`, {
        method: 'PUT',
        body: {
          name: trimmedName,
          logoUrl: form.logoUrl.trim() || null
        }
      })
    } else {
      savedGame = await $fetch<Game>('/api/admin/games', {
        method: 'POST',
        body: {
          name: trimmedName,
          logoUrl: form.logoUrl.trim() || null
        }
      })
    }

    emit('saved', savedGame)
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.message || 'Error'
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
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto p-0 sm:p-4 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md"
        :style="backdropStyle"
        @click.self="emit('close')"
      >
        <div
          ref="sheetRef"
          :class="[
            'modal-card relative w-full max-w-lg rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] pb-safe sm:pb-0',
            { 'is-drag-closed': isDragClosed }
          ]"
          :style="sheetStyle"
          role="dialog"
          aria-modal="true"
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
              <div>
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <svg v-if="isEditing" class="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <svg v-else class="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                  <span>{{ isEditing ? t('admin_games.edit_game') : t('admin_games.add_game') }}</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ t('admin_games.modal_subtitle') }}
                </p>
              </div>

              <button
                type="button"
                @click="emit('close')"
                class="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                :aria-label="t('common.close')"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Body / Formulaire -->
          <form id="game-form" @submit.prevent="handleSubmit" class="p-6 space-y-4 overflow-y-auto flex-1">
            <div v-if="errorMessage" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {{ errorMessage }}
            </div>

            <!-- Nom du jeu -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                {{ t('admin_games.name_label') }}
              </label>
              <input
                ref="nameInputRef"
                v-model="form.name"
                type="text"
                required
                maxlength="100"
                :placeholder="t('admin_games.name_placeholder')"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <!-- URL du Logo -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {{ t('admin_games.logo_label') }}
                </span>
                <span class="text-[10px] text-slate-400">{{ t('archetype_modal.optional') }}</span>
              </div>
              <input
                v-model="form.logoUrl"
                type="url"
                :placeholder="t('admin_games.logo_placeholder')"
                class="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <!-- Aperçu en direct -->
            <div class="pt-2">
              <div class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                {{ t('admin_games.preview') }}
              </div>
              <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center gap-3.5">
                <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                  <img
                    v-if="form.logoUrl"
                    :src="form.logoUrl"
                    :alt="form.name || t('admin_games.logo_preview')"
                    class="w-full h-full object-contain p-1"
                    @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                  />
                  <span v-else class="text-xl font-bold text-slate-400 dark:text-slate-500">
                    {{ (form.name || 'TCG').slice(0, 1).toUpperCase() }}
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {{ form.name || t('admin_games.name_placeholder') }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    TCG Card Game
                  </div>
                </div>
              </div>
            </div>
          </form>

          <!-- Footer (Sticky buttons) -->
          <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="submit"
              form="game-form"
              :disabled="isSubmitting || !form.name.trim()"
              class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <svg
                v-if="isSubmitting"
                class="w-3.5 h-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span>{{ isSubmitting ? t('admin_games.saving') : (isEditing ? t('common.save') : t('admin_games.create')) }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
