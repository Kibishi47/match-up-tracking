<script setup lang="ts">
import { useScrollLock } from '~/composables/useScrollLock'
import { useBottomSheetDrag } from '~/composables/useBottomSheetDrag'

const { confirmState, resolveConfirm } = useNotify()
useScrollLock(computed(() => confirmState.value.isOpen))

const handleKeydown = (e: KeyboardEvent) => {
  if (confirmState.value.isOpen && e.key === 'Escape') {
    resolveConfirm(false)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

const { sheetRef, sheetStyle, backdropStyle, dragHandleProps, isDragging, isDragClosed } = useBottomSheetDrag(() => resolveConfirm(false))
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="confirmState.isOpen"
        class="fixed inset-0 z-[100] overflow-y-auto p-0 sm:p-4 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md"
        :style="backdropStyle"
        @click.self="resolveConfirm(false)"
      >
        <div
          ref="sheetRef"
          :class="[
            'modal-card relative w-full max-w-md rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 pb-safe sm:pb-6',
            { 'is-drag-closed': isDragClosed }
          ]"
          :style="sheetStyle"
          role="alertdialog"
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
        <!-- Icône d'alerte et titre -->
        <div class="flex items-start gap-4">
          <div
            :class="[
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
              confirmState.isDestructive
                ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            ]"
          >
            <!-- Destructive SVG -->
            <svg v-if="confirmState.isDestructive" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            <!-- Question SVG -->
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {{ confirmState.title }}
            </h3>
            <p class="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              {{ confirmState.message }}
            </p>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            @click="resolveConfirm(false)"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {{ confirmState.cancelText || $t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="resolveConfirm(true)"
            :class="[
              'px-4 py-2 rounded-xl text-sm font-semibold text-white transition cursor-pointer shadow-lg active:scale-95',
              confirmState.isDestructive
                ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
            ]"
          >
            {{ confirmState.confirmText || $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>
