<script setup lang="ts">
const { confirmState, resolveConfirm } = useNotify()

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
</script>

<template>
  <Teleport to="body">
    <div
      v-if="confirmState.isOpen"
      class="fixed inset-0 z-[100] overflow-y-auto p-4 flex min-h-full items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      @click.self="resolveConfirm(false)"
    >
      <div
        class="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 my-auto"
        role="alertdialog"
        aria-modal="true"
      >
        <!-- Icône d'alerte et titre -->
        <div class="flex items-start gap-4">
          <div
            :class="[
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
              confirmState.isDestructive
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
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
            <h3 class="text-base font-bold text-white leading-tight">
              {{ confirmState.title }}
            </h3>
            <p class="text-sm text-slate-300 mt-2 leading-relaxed">
              {{ confirmState.message }}
            </p>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            @click="resolveConfirm(false)"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            {{ confirmState.cancelText }}
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
            {{ confirmState.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
