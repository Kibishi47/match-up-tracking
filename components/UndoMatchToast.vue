<script setup lang="ts">
import type { Match, Archetype } from '~/server/db/schema'

interface MatchWithRelations extends Match {
  myArchetype?: Archetype
  opponentArchetype?: Archetype
}

const props = defineProps<{
  match: MatchWithRelations | null
  duration?: number // en ms, default 10000
}>()

const emit = defineEmits<{
  (e: 'undo', matchId: string): void
  (e: 'edit', match: MatchWithRelations): void
  (e: 'dismiss'): void
}>()

const duration = props.duration || 10000
const timeLeft = ref(duration)
const isCancelling = ref(false)
let timerInterval: any = null

const progressPercent = computed(() => {
  return Math.max(0, (timeLeft.value / duration) * 100)
})

const startTimer = () => {
  clearInterval(timerInterval)
  timeLeft.value = duration
  const start = Date.now()
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - start
    timeLeft.value = Math.max(0, duration - elapsed)
    if (timeLeft.value <= 0) {
      clearInterval(timerInterval)
      emit('dismiss')
    }
  }, 50)
}

watch(() => props.match, (newMatch) => {
  if (newMatch) {
    startTimer()
  } else {
    clearInterval(timerInterval)
  }
}, { immediate: true })

onUnmounted(() => {
  clearInterval(timerInterval)
})

const handleUndo = async () => {
  if (!props.match) return
  isCancelling.value = true
  clearInterval(timerInterval)
  emit('undo', props.match.id)
  isCancelling.value = false
}

const handleEdit = () => {
  if (!props.match) return
  clearInterval(timerInterval)
  emit('edit', props.match)
}
</script>

<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-4 opacity-0 scale-95"
    enter-to-class="translate-y-0 opacity-100 scale-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="match"
      class="fixed bottom-20 md:bottom-6 right-4 md:right-6 left-4 md:left-auto z-50 max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-4 text-slate-900 dark:text-white"
    >
      <!-- Barre de progression 10s -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
        <div
          class="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-75 ease-linear"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <div class="flex items-center justify-between gap-3 mt-1">
        <div class="flex items-center gap-3 min-w-0">
          <!-- Badge Victoire, Défaite ou Nul -->
          <div
            :class="[
              'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0',
              match.result === 'win'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                : (match.result === 'loss' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40')
            ]"
          >
            {{ match.result === 'win' ? 'W' : (match.result === 'loss' ? 'L' : 'D') }}
          </div>

          <div class="min-w-0">
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Match enregistré • {{ Math.ceil(timeLeft / 1000) }}s
            </p>
            <p class="text-sm font-semibold truncate text-slate-900 dark:text-white">
              vs {{ match.opponentArchetype?.name || 'Adversaire' }}
            </p>
          </div>
        </div>

        <!-- Actions : Annuler (anti miss-clic) & Modifier -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            @click="handleEdit"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Modifier
          </button>
          <button
            @click="handleUndo"
            :disabled="isCancelling"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition shadow-sm cursor-pointer"
          >
            {{ isCancelling ? 'Annulation...' : 'Annuler' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
