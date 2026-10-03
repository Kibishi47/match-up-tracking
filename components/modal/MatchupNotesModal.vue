<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'
import { useScrollLock } from '~/composables/useScrollLock'
import { useBottomSheetDrag } from '~/composables/useBottomSheetDrag'

const props = defineProps<{
  isOpen: boolean
  myArchetype: Archetype | null
  opponentArchetype: Archetype | null
  initialNotes?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', newNotes: string): void
}>()

useScrollLock(toRef(props, 'isOpen'))

const notesText = ref('')
const isSaving = ref(false)
const hasJustSaved = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const { toast } = useNotify()
const { t } = useI18n()

// Initialiser le contenu dès l'ouverture
watch(() => props.isOpen, (open) => {
  if (open) {
    notesText.value = props.initialNotes || ''
    hasJustSaved.value = false
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      nextTick(() => {
        textareaRef.value?.focus()
      })
    }
  }
})

watch(() => props.initialNotes, (newVal) => {
  if (props.isOpen && newVal !== undefined) {
    notesText.value = newVal
  }
})

// Sauvegarde de la note
const saveNotes = async () => {
  if (!props.myArchetype || !props.opponentArchetype) {
    toast.error(t('notes_modal.missing_archetypes'))
    return
  }

  isSaving.value = true
  try {
    const res = await $fetch<{ success: boolean; notes: string }>('/api/matchups/notes', {
      method: 'PUT',
      body: {
        myArchetypeId: props.myArchetype.id,
        opponentArchetypeId: props.opponentArchetype.id,
        notes: notesText.value
      }
    })

    hasJustSaved.value = true
    emit('saved', res.notes)
    setTimeout(() => {
      hasJustSaved.value = false
    }, 2500)
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || err?.message || t('notes_modal.save_error'))
  } finally {
    isSaving.value = false
  }
}

// Auto-save au blur
const handleBlur = () => {
  if (notesText.value !== (props.initialNotes || '')) {
    saveNotes()
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
          <!-- En-tête : Duel & Archétypes -->
          <div class="px-6 pt-2 pb-4 sm:py-5 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0">
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
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <svg class="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  <span>{{ $t('notes_modal.title') }}</span>
                </h3>
                <!-- Contexte des decks -->
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span class="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[140px]" :title="myArchetype?.name">
                    {{ myArchetype?.name || $t('notes_modal.my_deck') }}
                  </span>
                  <span class="text-slate-400 dark:text-slate-500 font-bold">vs</span>
                  <span class="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[140px]" :title="opponentArchetype?.name">
                    {{ opponentArchetype?.name || $t('notes_modal.opponent_deck') }}
                  </span>
                </p>
              </div>

              <button
                type="button"
                @click="emit('close')"
                class="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
                :aria-label="$t('common.close')"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

        <!-- Corps : Textarea & Conseils -->
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('notes_modal.description') }}</span>
            <span v-if="hasJustSaved" class="text-emerald-600 dark:text-emerald-400 font-bold animate-pulse flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {{ $t('notes_modal.saved_toast') }} !
            </span>
            <span v-else-if="isSaving" class="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
              {{ $t('common.loading') }}
            </span>
          </div>

          <div class="relative">
            <textarea
              ref="textareaRef"
              v-model="notesText"
              rows="6"
              maxlength="2000"
              @blur="handleBlur"
              :placeholder="$t('notes_modal.placeholder')"
              class="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 shadow-inner resize-y transition"
            ></textarea>
          </div>

          <p class="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>{{ $t('notes_modal.hint') }}</span>
          </p>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900 flex items-center justify-end">
          <button
            type="button"
            @click="saveNotes"
            :disabled="isSaving"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs transition disabled:opacity-50 shadow-md shadow-amber-950/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg v-if="!isSaving" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span v-if="isSaving">{{ $t('common.loading') }}</span>
            <span v-else>{{ $t('common.save') }}</span>
          </button>
        </div>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>
