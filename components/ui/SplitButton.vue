<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

export interface Bo3Payload {
  format: 'bo3'
  result: 'win' | 'loss' | 'draw'
  game1: 'win' | 'loss' | 'draw'
  game2?: 'win' | 'loss' | 'draw' | null
  game3?: 'win' | 'loss' | 'draw' | null
}

const props = defineProps<{
  type: 'win' | 'loss' | 'draw'
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'click-bo1'): void
  (e: 'select-bo3', payload: Bo3Payload): void
}>()

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)

// Définition des options BO3
const winOptions = [
  {
    score: '2-0',
    detail: 'Direct',
    sequence: ['W', 'W'],
    payload: {
      format: 'bo3' as const,
      result: 'win' as const,
      game1: 'win' as const,
      game2: 'win' as const,
      game3: null
    }
  },
  {
    score: '2-1',
    detail: 'G1 + G3',
    sequence: ['W', 'L', 'W'],
    payload: {
      format: 'bo3' as const,
      result: 'win' as const,
      game1: 'win' as const,
      game2: 'loss' as const,
      game3: 'win' as const
    }
  },
  {
    score: '2-1',
    detail: 'G2 + G3',
    sequence: ['L', 'W', 'W'],
    payload: {
      format: 'bo3' as const,
      result: 'win' as const,
      game1: 'loss' as const,
      game2: 'win' as const,
      game3: 'win' as const
    }
  }
]

const lossOptions = [
  {
    score: '0-2',
    detail: 'Direct',
    sequence: ['L', 'L'],
    payload: {
      format: 'bo3' as const,
      result: 'loss' as const,
      game1: 'loss' as const,
      game2: 'loss' as const,
      game3: null
    }
  },
  {
    score: '1-2',
    detail: 'G1',
    sequence: ['W', 'L', 'L'],
    payload: {
      format: 'bo3' as const,
      result: 'loss' as const,
      game1: 'win' as const,
      game2: 'loss' as const,
      game3: 'loss' as const
    }
  },
  {
    score: '1-2',
    detail: 'G2',
    sequence: ['L', 'W', 'L'],
    payload: {
      format: 'bo3' as const,
      result: 'loss' as const,
      game1: 'loss' as const,
      game2: 'win' as const,
      game3: 'loss' as const
    }
  }
]

const drawOptions = [
  {
    score: '1-1',
    detail: 'G1 W (Time)',
    sequence: ['W', 'L'],
    payload: {
      format: 'bo3' as const,
      result: 'draw' as const,
      game1: 'win' as const,
      game2: 'loss' as const,
      game3: null
    }
  },
  {
    score: '1-1',
    detail: 'G2 W (Time)',
    sequence: ['L', 'W'],
    payload: {
      format: 'bo3' as const,
      result: 'draw' as const,
      game1: 'loss' as const,
      game2: 'win' as const,
      game3: null
    }
  },
  {
    score: '1-1',
    detail: 'G3 Time',
    sequence: ['W', 'L', 'D'],
    payload: {
      format: 'bo3' as const,
      result: 'draw' as const,
      game1: 'win' as const,
      game2: 'loss' as const,
      game3: 'draw' as const
    }
  },
  {
    score: '0-0',
    detail: 'G1 Time',
    sequence: ['D'],
    payload: {
      format: 'bo3' as const,
      result: 'draw' as const,
      game1: 'draw' as const,
      game2: null,
      game3: null
    }
  }
]

const currentOptions = computed(() => {
  if (props.type === 'win') return winOptions
  if (props.type === 'loss') return lossOptions
  return drawOptions
})

// Détection de l'appui long tactile mobile (> 400ms)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let touchStartX = 0
let touchStartY = 0
let didLongPress = false

const handleTouchStart = (e: TouchEvent) => {
  if (props.disabled) return
  if (e.touches.length !== 1) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  didLongPress = false

  longPressTimer = setTimeout(() => {
    didLongPress = true
    isOpen.value = true
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(35)
    }
  }, 400)
}

const handleTouchMove = (e: TouchEvent) => {
  if (!longPressTimer) return
  const moveX = Math.abs(e.touches[0].clientX - touchStartX)
  const moveY = Math.abs(e.touches[0].clientY - touchStartY)
  if (moveX > 10 || moveY > 10) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  if (didLongPress) {
    e.preventDefault()
    e.stopPropagation()
  }
}

// Clic gauche sur la zone principale (BO1 en 1-clic)
const handleMainClick = (e: MouseEvent) => {
  if (props.disabled) return
  if (didLongPress) {
    didLongPress = false
    return
  }
  isOpen.value = false
  emit('click-bo1')
}

// Bascule du popover via le chevron
const togglePopover = (e: MouseEvent) => {
  if (props.disabled) return
  e.stopPropagation()
  isOpen.value = !isOpen.value
}

// Clic droit : raccourci d'ouverture directe du popover BO3
const handleContextMenu = (e: MouseEvent) => {
  if (props.disabled) return
  e.preventDefault()
  isOpen.value = !isOpen.value
}

// Sélection d'un score BO3
const selectBo3 = (payload: Bo3Payload) => {
  isOpen.value = false
  emit('select-bo3', payload)
}

// Fermeture au clic à l'extérieur ou via touche Échap
const handleClickOutside = (e: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  if (longPressTimer) {
    clearTimeout(longPressTimer)
  }
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative inline-flex h-8 w-full select-none"
    :class="{ 'z-40': isOpen }"
    @contextmenu="handleContextMenu"
  >
    <!-- Bouton Split Container -->
    <div
      :class="[
        'flex h-full w-full rounded-lg font-bold text-xs text-white shadow-sm overflow-hidden transition-all',
        type === 'win'
          ? 'bg-emerald-600 hover:bg-emerald-500'
          : (type === 'loss' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'),
        disabled ? 'opacity-60 cursor-not-allowed' : ''
      ]"
    >
      <!-- Zone Principale (80% à gauche) : Enregistrement BO1 instantané -->
      <button
        type="button"
        :disabled="disabled"
        @click="handleMainClick"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        class="flex-1 flex items-center justify-center gap-1 px-1.5 h-full transition active:scale-[0.98] cursor-pointer"
        :title="type === 'win' ? 'Enregistrer une Victoire BO1 (Clic simple, Clic droit ou appui long pour BO3)' : (type === 'loss' ? 'Enregistrer une Défaite BO1 (Clic simple, Clic droit ou appui long pour BO3)' : 'Enregistrer un Draw BO1 (Clic simple, Clic droit ou appui long pour BO3)')"
      >
        <!-- Icône Flèche montante / descendante / signe égal -->
        <svg
          v-if="type === 'win'"
          class="w-3.5 h-3.5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m5 12 7-7 7 7" />
          <path d="M12 19V5" />
        </svg>
        <svg
          v-else-if="type === 'loss'"
          class="w-3.5 h-3.5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m19 12-7 7-7-7" />
          <path d="M12 5v14" />
        </svg>
        <svg
          v-else
          class="w-3.5 h-3.5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="5" y1="9" x2="19" y2="9" />
          <line x1="5" y1="15" x2="19" y2="15" />
        </svg>
        <span>{{ type === 'win' ? 'Win' : (type === 'loss' ? 'Loss' : 'Draw') }}</span>
      </button>

      <!-- Séparateur visuel fin -->
      <div
        class="w-[1px] h-4 self-center opacity-40 bg-white"
      />

      <!-- Zone Dropdown Chevron (20% à droite) -->
      <button
        type="button"
        :disabled="disabled"
        @click="togglePopover"
        class="w-6 sm:w-6.5 h-full flex items-center justify-center transition hover:bg-black/15 active:bg-black/25 cursor-pointer"
        :title="type === 'win' ? 'Options BO3 (2-0, 2-1)' : (type === 'loss' ? 'Options BO3 (0-2, 1-2)' : 'Options BO3 Draw (1-1, Time)')"
      >
        <svg
          class="w-3 h-3 transition-transform duration-200"
          :class="{ 'rotate-180': isOpen }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- Popover Flottant des options BO3 -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="isOpen"
        :class="[
          'absolute bottom-full mb-1.5 min-w-[176px] bg-slate-900/95 dark:bg-slate-900 border border-slate-700/80 dark:border-slate-800 rounded-xl p-1.5 shadow-2xl z-50 space-y-1 backdrop-blur-md',
          type === 'win' ? 'left-0' : (type === 'loss' ? '-left-10 sm:left-1/2 sm:-translate-x-1/2' : 'right-0')
        ]"
      >
        <div class="px-2 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
          <span>Format BO3</span>
          <span class="text-[9px] text-slate-500 font-mono">{{ type === 'win' ? 'Victoire' : (type === 'loss' ? 'Défaite' : 'Draw / Time') }}</span>
        </div>

        <button
          v-for="opt in currentOptions"
          :key="opt.score + opt.detail"
          type="button"
          @click="selectBo3(opt.payload)"
          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/90 active:bg-slate-700 transition cursor-pointer text-left group"
        >
          <span class="flex items-center gap-1.5">
            <strong class="font-bold font-mono text-xs text-white">{{ opt.score }}</strong>
            <span class="text-[11px] text-slate-400 group-hover:text-slate-300">{{ opt.detail }}</span>
          </span>

          <!-- Pastilles visuelles des manches -->
          <span class="flex items-center gap-0.5">
            <span
              v-for="(g, idx) in opt.sequence"
              :key="idx"
              :class="[
                'w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center font-mono',
                g === 'W'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : (g === 'L' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40')
              ]"
            >
              {{ g }}
            </span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>
