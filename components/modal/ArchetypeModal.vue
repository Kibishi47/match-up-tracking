<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'
import { useScrollLock } from '~/composables/useScrollLock'
import { useBottomSheetDrag } from '~/composables/useBottomSheetDrag'

const props = defineProps<{
  isOpen: boolean
  gameId: string | null
  metaId: string | null
  metaName?: string
  archetype?: Archetype | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', archetype: Archetype): void
}>()

useScrollLock(toRef(props, 'isOpen'))

const isEditing = computed(() => !!props.archetype?.id)
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const { toast } = useNotify()
const { t } = useI18n()

const form = reactive({
  name: '',
  card1Name: '',
  card1ImageUrl: '',
  card2Name: '',
  card2ImageUrl: ''
})

const resetForm = () => {
  if (props.archetype) {
    form.name = props.archetype.name || ''
    form.card1Name = props.archetype.card1Name || ''
    form.card1ImageUrl = props.archetype.card1ImageUrl || ''
    form.card2Name = props.archetype.card2Name || ''
    form.card2ImageUrl = props.archetype.card2ImageUrl || ''
  } else {
    form.name = ''
    form.card1Name = ''
    form.card1ImageUrl = ''
    form.card2Name = ''
    form.card2ImageUrl = ''
  }
  errorMessage.value = null
}

watch(
  () => [props.isOpen, props.archetype],
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
  if (!props.gameId || !props.metaId) {
    return
  }

  const trimmedName = form.name.trim()
  if (!trimmedName) {
    errorMessage.value = t('common.name_required')
    return
  }

  isSubmitting.value = true
  errorMessage.value = null

  try {
    let savedArch: Archetype

    if (isEditing.value && props.archetype?.id) {
      savedArch = await $fetch<Archetype>(`/api/archetypes/${props.archetype.id}`, {
        method: 'PUT',
        body: {
          name: trimmedName,
          metaId: props.metaId,
          card1Name: form.card1Name.trim() || null,
          card1ImageUrl: form.card1ImageUrl.trim() || null,
          card2Name: form.card2Name.trim() || null,
          card2ImageUrl: form.card2ImageUrl.trim() || null
        }
      })
    } else {
      savedArch = await $fetch<Archetype>('/api/archetypes', {
        method: 'POST',
        body: {
          gameId: props.gameId,
          metaId: props.metaId,
          name: trimmedName,
          card1Name: form.card1Name.trim() || null,
          card1ImageUrl: form.card1ImageUrl.trim() || null,
          card2Name: form.card2Name.trim() || null,
          card2ImageUrl: form.card2ImageUrl.trim() || null
        }
      })
    }

    emit('saved', savedArch)
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
                  <span>{{ isEditing ? $t('archetype_modal.edit_title') : $t('archetype_modal.create_title') }}</span>
                </h3>
                <p v-if="metaName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ $t('archetype_modal.format_label') }} : <span class="text-emerald-600 dark:text-emerald-400 font-medium">{{ metaName }}</span>
                </p>
              </div>

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

          <!-- Body / Formulaire -->
          <form id="archetype-form" @submit.prevent="handleSubmit" class="p-6 space-y-4 overflow-y-auto flex-1">
            <div v-if="errorMessage" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              {{ errorMessage }}
            </div>

            <!-- Nom de l'archétype -->
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                {{ $t('archetype_modal.name_label') }}
              </label>
              <input
                ref="nameInputRef"
                v-model="form.name"
                type="text"
                required
                maxlength="100"
                :placeholder="$t('archetype_modal.name_placeholder')"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>

            <!-- Carte clé 1 -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {{ $t('archetype_modal.card1_label') }}
                </span>
                <span class="text-[10px] text-slate-400">{{ $t('archetype_modal.optional') }}</span>
              </div>
              <input
                v-model="form.card1Name"
                type="text"
                :placeholder="$t('archetype_modal.card_name_placeholder')"
                class="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                v-model="form.card1ImageUrl"
                type="url"
                :placeholder="$t('archetype_modal.card_url_placeholder')"
                class="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div v-if="form.card1ImageUrl" class="mt-2 flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <img
                  :src="form.card1ImageUrl"
                  :alt="form.card1Name || $t('archetype_modal.card1_preview')"
                  class="w-10 h-14 object-cover rounded border border-slate-200 dark:border-slate-700 flex-shrink-0"
                  @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                />
                <span class="text-xs text-slate-600 dark:text-slate-300 truncate">{{ form.card1Name || $t('archetype_modal.card1_preview') }}</span>
              </div>
            </div>

            <!-- Carte clé 2 -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {{ $t('archetype_modal.card2_label') }}
                </span>
                <span class="text-[10px] text-slate-400">{{ $t('archetype_modal.optional') }}</span>
              </div>
              <input
                v-model="form.card2Name"
                type="text"
                :placeholder="$t('archetype_modal.card_name_placeholder')"
                class="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                v-model="form.card2ImageUrl"
                type="url"
                :placeholder="$t('archetype_modal.card_url_placeholder')"
                class="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div v-if="form.card2ImageUrl" class="mt-2 flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <img
                  :src="form.card2ImageUrl"
                  :alt="form.card2Name || $t('archetype_modal.card2_preview')"
                  class="w-10 h-14 object-cover rounded border border-slate-200 dark:border-slate-700 flex-shrink-0"
                  @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                />
                <span class="text-xs text-slate-600 dark:text-slate-300 truncate">{{ form.card2Name || $t('archetype_modal.card2_preview') }}</span>
              </div>
            </div>
          </form>

          <!-- Footer Actions -->
          <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {{ $t('archetype_modal.cancel') }}
            </button>
            <button
              type="submit"
              form="archetype-form"
              :disabled="isSubmitting || !form.name.trim()"
              class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
            >
              <span v-if="isSubmitting" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isSubmitting ? $t('archetype_modal.saving') : (isEditing ? $t('archetype_modal.update_btn') : $t('archetype_modal.create_btn')) }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
