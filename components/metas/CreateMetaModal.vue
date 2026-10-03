<script setup lang="ts">
import type { Meta } from '~/server/db/schema'
import { useScrollLock } from '~/composables/useScrollLock'
import { useBottomSheetDrag } from '~/composables/useBottomSheetDrag'

const props = defineProps<{
  isOpen: boolean
  gameId: string | null
  gameName?: string
  sourceMetaId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', meta: Meta): void
}>()

useScrollLock(toRef(props, 'isOpen'))

const metaName = ref('')
const isSubmitting = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const { toast } = useNotify()
const { t } = useI18n()

watch(() => props.isOpen, (open) => {
  if (open) {
    metaName.value = ''
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      nextTick(() => {
        inputRef.value?.focus()
      })
    }
  }
})

const handleCreate = async () => {
  const trimmed = metaName.value.trim()
  if (!trimmed) {
    toast.warning(t('common.name_required'))
    return
  }

  if (!props.gameId) {
    return
  }

  isSubmitting.value = true
  try {
    const newMeta = await $fetch<Meta>('/api/metas', {
      method: 'POST',
      body: {
        gameId: props.gameId,
        name: trimmed,
        sourceMetaId: props.sourceMetaId || undefined
      }
    })

    emit('created', newMeta)
    emit('close')
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || err?.message || 'Error')
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
            'modal-card relative w-full max-w-md rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 pb-safe sm:pb-6',
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
        <div class="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>{{ $t('create_meta_modal.title') }}</span>
            </h3>
            <p v-if="gameName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ $t('create_meta_modal.game_label') }} : <span class="text-emerald-600 dark:text-emerald-400 font-medium">{{ gameName }}</span>
            </p>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
            :aria-label="$t('common.close')"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleCreate" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {{ $t('create_meta_modal.name_label') }}
            </label>
            <input
              ref="inputRef"
              v-model="metaName"
              type="text"
              required
              maxlength="100"
              :placeholder="$t('create_meta_modal.name_placeholder')"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm shadow-inner"
            />
            <p class="text-[11px] text-slate-500 mt-1">
              {{ $t('create_meta_modal.desc') }}
            </p>
            <div class="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
              <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>{{ $t('create_meta_modal.duplicate_hint') }}</span>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {{ $t('create_meta_modal.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !metaName.trim()"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50 shadow-md shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5"
            >
              <span v-if="isSubmitting">{{ $t('create_meta_modal.creating') }}</span>
              <span v-else>{{ $t('create_meta_modal.create_btn') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>
