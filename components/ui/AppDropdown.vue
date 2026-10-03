<script setup lang="ts" generic="T extends string | number | null">
export interface DropdownOption<TVal> {
  value: TVal
  label: string
  iconUrl?: string | null
  iconText?: string
  sublabel?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: T
    options: DropdownOption<T>[]
    placeholder?: string
    disabled?: boolean
    buttonClass?: string
    menuWidthClass?: string
    align?: 'left' | 'right'
    footerActionLabel?: string
  }>(),
    placeholder: undefined,
    disabled: false,
    buttonClass: '',
    menuWidthClass: 'w-56',
    align: 'left',
    footerActionLabel: undefined
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'change', value: T): void
  (e: 'footer-click'): void
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue) || null
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

const selectOption = (option: DropdownOption<T>) => {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  isOpen.value = false
}

const handleFooterClick = () => {
  isOpen.value = false
  emit('footer-click')
}

// Gestion de la fermeture au clic extérieur et touche Echap
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
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
})
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block text-left">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      :disabled="disabled"
      :class="[
        'flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:outline-none focus:border-emerald-500/80 transition-all text-sm font-semibold select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group',
        buttonClass
      ]"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <!-- Option Icon (image or text icon) -->
        <div v-if="selectedOption?.iconUrl" class="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60">
          <img :src="selectedOption.iconUrl" :alt="selectedOption.label" class="w-full h-full object-contain" />
        </div>
        <span v-else-if="selectedOption?.iconText" class="text-xs flex-shrink-0">
          {{ selectedOption.iconText }}
        </span>

        <!-- Label -->
        <span :class="['truncate', selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400']">
          {{ selectedOption ? selectedOption.label : (placeholder || $t('common.select')) }}
        </span>
      </div>

      <!-- Animated Chevron -->
      <svg
        :class="[
          'w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform duration-200 flex-shrink-0',
          isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-300' : ''
        ]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <!-- Floating Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-150 transform"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-100 transform"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        :class="[
          'absolute z-50 mt-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-1.5 shadow-2xl space-y-1 max-h-64 overflow-y-auto focus:outline-none',
          menuWidthClass,
          align === 'right' ? 'right-0' : 'left-0'
        ]"
        role="listbox"
      >
        <div v-if="options.length === 0" class="px-3 py-2 text-xs text-slate-400 text-center italic">
          {{ $t('common.no_options') }}
        </div>

        <button
          v-for="option in options"
          :key="String(option.value)"
          type="button"
          @click="selectOption(option)"
          :class="[
            'w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer group',
            option.value === modelValue
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
          ]"
          role="option"
          :aria-selected="option.value === modelValue"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <!-- Icon -->
            <div v-if="option.iconUrl" class="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img :src="option.iconUrl" :alt="option.label" class="w-full h-full object-contain" />
            </div>
            <span v-else-if="option.iconText" class="text-xs flex-shrink-0">
              {{ option.iconText }}
            </span>

            <div class="truncate">
              <p class="truncate">{{ option.label }}</p>
              <p v-if="option.sublabel" class="text-[11px] text-slate-400 truncate font-normal">
                {{ option.sublabel }}
              </p>
            </div>
          </div>

          <!-- Active Checkmark Indicator -->
          <svg
            v-if="option.value === modelValue"
            class="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <!-- Footer Action (ex: + Gérer mes jeux) -->
        <div v-if="$slots.footer || footerActionLabel" class="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800/80">
          <slot name="footer">
            <button
              type="button"
              @click="handleFooterClick"
              class="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-500/10 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>+</span>
              <span>{{ footerActionLabel }}</span>
            </button>
          </slot>
        </div>
      </div>
    </Transition>
  </div>
</template>
