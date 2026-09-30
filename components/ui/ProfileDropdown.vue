<script setup lang="ts">
const { user, clear } = useUserSession()
const colorMode = useColorMode()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

// Clic extérieur pour fermer
const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

// Fermeture avec Échap
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const logout = async () => {
  closeDropdown()
  await clear()
  await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  navigateTo('/login')
}
</script>

<template>
  <div v-if="user" ref="dropdownRef" class="relative">
    <!-- Trigger Button -->
    <button
      type="button"
      @click.stop="toggleDropdown"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      class="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-900/60 transition cursor-pointer group"
      title="Menu de profil"
    >
      <!-- Avatar -->
      <img
        v-if="user.avatar"
        :src="user.avatar"
        :alt="user.username"
        class="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover flex-shrink-0 shadow-sm"
      />
      <div
        v-else
        class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 flex-shrink-0 shadow-sm"
      >
        {{ user.username?.slice(0, 2).toUpperCase() }}
      </div>

      <!-- Pseudo & Rôle (sans sous-titre Joueur) -->
      <div class="hidden sm:flex items-center gap-1.5 text-left">
        <span class="font-semibold text-xs text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white truncate max-w-[130px]">
          {{ user.username }}
        </span>
        <span
          v-if="user.role === 'admin'"
          class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
        >
          Admin
        </span>
      </div>

      <!-- Chevron -->
      <svg
        :class="[
          'w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200',
          isOpen ? 'rotate-180' : ''
        ]"
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

    <!-- Menu Flottant -->
    <Transition
      enter-active-class="transition duration-150 ease-out transform"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in transform"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 py-2 divide-y divide-slate-100 dark:divide-slate-800/80 backdrop-blur-xl"
      >
        <!-- Info utilisateur -->
        <div class="px-4 py-2.5">
          <div class="text-xs text-slate-400 dark:text-slate-500 font-medium">Connecté en tant que</div>
          <div class="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
            {{ user.username }}
          </div>
          <div v-if="user.role === 'admin'" class="mt-1">
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              Administrateur
            </span>
          </div>
        </div>

        <!-- Actions Principales -->
        <div class="py-1">
          <!-- Paramètres -->
          <NuxtLink
            to="/settings"
            @click="closeDropdown"
            class="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
          >
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Paramètres du compte</span>
          </NuxtLink>

          <!-- Toggle Thème rapide -->
          <button
            type="button"
            @click="toggleTheme"
            class="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div class="flex items-center gap-2.5">
              <!-- Soleil (mode sombre actif -> passer en clair) -->
              <svg v-if="colorMode.value === 'dark'" class="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
              <!-- Lune (mode clair actif -> passer en sombre) -->
              <svg v-else class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
              <span>Thème {{ colorMode.value === 'dark' ? 'Sombre' : 'Clair' }}</span>
            </div>
            <span class="text-[10px] text-slate-400 uppercase font-semibold">
              {{ colorMode.value === 'dark' ? 'Activer Clair' : 'Activer Sombre' }}
            </span>
          </button>
        </div>

        <!-- Déconnexion -->
        <div class="py-1">
          <button
            type="button"
            @click="logout"
            class="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition cursor-pointer text-left"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
