<script setup lang="ts">
const { toasts, dismissToast } = useNotify()
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out transform"
        enter-from-class="opacity-0 translate-y-3 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in transform"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-xl transition-all',
            t.type === 'success' ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-300' : '',
            t.type === 'error' ? 'bg-slate-900/95 border-red-500/40 text-red-300' : '',
            t.type === 'warning' ? 'bg-slate-900/95 border-amber-500/40 text-amber-300' : '',
            t.type === 'info' ? 'bg-slate-900/95 border-slate-700 text-slate-200' : ''
          ]"
        >
          <!-- Icône du Toast -->
          <div class="flex-shrink-0 mt-0.5">
            <!-- Success SVG -->
            <svg v-if="t.type === 'success'" class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <!-- Error SVG -->
            <svg v-else-if="t.type === 'error'" class="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <!-- Warning SVG -->
            <svg v-else-if="t.type === 'warning'" class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <!-- Info SVG -->
            <svg v-else class="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>

          <!-- Message -->
          <div class="flex-1 min-w-0 text-sm font-medium text-white leading-snug">
            {{ t.message }}
          </div>

          <!-- Bouton de fermeture -->
          <button
            type="button"
            @click="dismissToast(t.id)"
            class="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
