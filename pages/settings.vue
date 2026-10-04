<script setup lang="ts">
import { usePwaInstall } from '~/composables/usePwaInstall'

definePageMeta({
  middleware: 'auth'
})

const { user, fetch: refreshSession, clear } = useUserSession()
const colorMode = useColorMode()
const { showToast } = useNotify()
const { locale, setLocale, t } = useI18n()
const { isStandalone, init: initPwa, install: handleInstallPwa } = usePwaInstall()

onMounted(() => {
  initPwa()
})

// Formulaire Profil
const usernameInput = ref(user.value?.username || '')
const isSavingProfile = ref(false)

// Synchroniser si la session change
watch(() => user.value?.username, (newVal) => {
  if (newVal && !isSavingProfile.value) {
    usernameInput.value = newVal
  }
}, { immediate: true })

const handleSaveProfile = async () => {
  const trimmed = usernameInput.value.trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > 32) {
    showToast(t('settings.username_length_error'), 'warning')
    return
  }

  isSavingProfile.value = true
  try {
    const res = await $fetch<{ success: boolean; user: any }>('/api/user/profile', {
      method: 'PATCH',
      body: { username: trimmed }
    })

    if (res?.success) {
      await refreshSession()
      showToast(t('settings.profile_saved'), 'success')
    }
  } catch (err: any) {
    const msg = err?.data?.statusMessage || t('settings.profile_update_error')
    showToast(msg, 'error')
  } finally {
    isSavingProfile.value = false
  }
}

// Thèmes disponibles
const themes = computed(() => [
  {
    id: 'light',
    label: t('settings.theme_light'),
    description: t('settings.theme_light_desc'),
    icon: 'sun'
  },
  {
    id: 'dark',
    label: t('settings.theme_dark'),
    description: t('settings.theme_dark_desc'),
    icon: 'moon'
  },
  {
    id: 'system',
    label: t('settings.theme_system'),
    description: t('settings.theme_system_desc'),
    icon: 'monitor'
  }
])

const setTheme = (themeId: string) => {
  colorMode.preference = themeId
  showToast(t('settings.theme_set', { theme: themeId }), 'info', 2000)
}

// Modale de suppression sécurisée
const isDeleteModalOpen = ref(false)
useScrollLock(isDeleteModalOpen)
const deleteConfirmationInput = ref('')
const isDeletingAccount = ref(false)

const isConfirmationValid = computed(() => {
  const trimmed = deleteConfirmationInput.value.trim().toUpperCase()
  const expectedKeyword = locale.value === 'fr' ? 'SUPPRIMER' : 'DELETE'
  return trimmed === (user.value?.username || '').toUpperCase() || trimmed === expectedKeyword || trimmed === 'DELETE' || trimmed === 'SUPPRIMER'
})

const openDeleteModal = () => {
  deleteConfirmationInput.value = ''
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  if (isDeletingAccount.value) return
  isDeleteModalOpen.value = false
  deleteConfirmationInput.value = ''
}

const handleDeleteAccount = async () => {
  if (!isConfirmationValid.value || isDeletingAccount.value) return

  isDeletingAccount.value = true
  try {
    await $fetch('/api/user', {
      method: 'DELETE',
      body: { confirmation: deleteConfirmationInput.value.trim() }
    })

    await clear()
    showToast(t('settings.delete_success'), 'success')
    navigateTo('/login')
  } catch (err: any) {
    const msg = err?.data?.statusMessage || t('settings.delete_error')
    showToast(msg, 'error')
    isDeletingAccount.value = false
  }
}

const handleLogout = async () => {
  await clear()
  await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
    <AppHeader />
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-6 sm:space-y-8">
    <!-- En-tête de la page -->
    <div class="border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-6">
      <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {{ $t('settings.title') }}
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        {{ $t('settings.subtitle') }}
      </p>
    </div>

    <!-- 1. Section Profil -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2.5">
        <svg class="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {{ $t('settings.profile_title') }}
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
        {{ $t('settings.profile_desc') }}
      </p>

      <div class="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
        <div class="relative flex-shrink-0">
          <img
            v-if="user?.avatar"
            :src="user.avatar"
            :alt="user.username"
            class="w-16 h-16 rounded-2xl border-2 border-slate-200 dark:border-slate-700 object-cover shadow-md"
          />
          <div
            v-else
            class="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-lg text-slate-700 dark:text-slate-300 shadow-md"
          >
            {{ user?.username?.slice(0, 2).toUpperCase() }}
          </div>
        </div>

        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-base text-slate-900 dark:text-white">
              {{ user?.username }}
            </span>
            <span
              v-if="user?.role === 'admin'"
              class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
            >
              {{ $t('nav.admin') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Édition du nom d'affichage -->
      <form @submit.prevent="handleSaveProfile" class="mt-6 space-y-4 max-w-lg">
        <div>
          <label for="username" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {{ $t('settings.display_name') }}
          </label>
          <input
            id="username"
            v-model="usernameInput"
            type="text"
            required
            minlength="2"
            maxlength="32"
            placeholder="Ex: Kibishi"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm transition"
          />
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {{ $t('settings.display_name_desc') }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            :disabled="isSavingProfile || usernameInput.trim() === user?.username || !usernameInput.trim()"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <svg
              v-if="isSavingProfile"
              class="w-3.5 h-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg
              v-else
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <span>{{ isSavingProfile ? $t('settings.saving_profile') : $t('settings.save_profile') }}</span>
          </button>
        </div>
      </form>
    </section>

    <!-- 2. Section Préférences Visuelles (Thème) -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2.5">
        <svg class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
        {{ $t('settings.theme_title') }}
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
        {{ $t('settings.theme_desc') }}
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          v-for="theme in themes"
          :key="theme.id"
          type="button"
          @click="setTheme(theme.id)"
          :class="[
            'p-4 rounded-xl border text-left transition duration-200 cursor-pointer flex flex-col justify-start gap-3 relative',
            colorMode.preference === theme.id
              ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
          ]"
        >
          <!-- Indicateur actif -->
          <div
            v-if="colorMode.preference === theme.id"
            class="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"
          />

          <!-- Icône -->
          <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200">
            <!-- Sun -->
            <svg v-if="theme.icon === 'sun'" class="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <!-- Moon -->
            <svg v-else-if="theme.icon === 'moon'" class="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
            <!-- Monitor -->
            <svg v-else class="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="20" height="14" x="2" y="3" rx="2"/>
              <line x1="8" x2="16" y1="21" y2="21"/>
              <line x1="12" x2="12" y1="17" y2="21"/>
            </svg>
          </div>

          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">
              {{ theme.label }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ theme.description }}
            </div>
          </div>
        </button>
      </div>
    </section>

    <!-- 3. Section Langue (i18n) -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2.5">
        <svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {{ $t('settings.lang_title') }}
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
        {{ $t('settings.lang_desc') }}
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          @click="setLocale('en')"
          :class="[
            'p-4 rounded-xl border text-left transition duration-200 cursor-pointer flex flex-col justify-start gap-3 relative',
            locale === 'en'
              ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
          ]"
        >
          <div
            v-if="locale === 'en'"
            class="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"
          />
          <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm font-black text-xs text-emerald-600 dark:text-emerald-400">
            EN
          </div>
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">
              English
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Default application language
            </div>
          </div>
        </button>

        <button
          type="button"
          @click="setLocale('fr')"
          :class="[
            'p-4 rounded-xl border text-left transition duration-200 cursor-pointer flex flex-col justify-start gap-3 relative',
            locale === 'fr'
              ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
          ]"
        >
          <div
            v-if="locale === 'fr'"
            class="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"
          />
          <div class="w-9 h-9 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm font-black text-xs text-emerald-600 dark:text-emerald-400">
            FR
          </div>
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">
              Français
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Langue française
            </div>
          </div>
        </button>
      </div>
    </section>

    <!-- 4. Section Application PWA -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2.5">
        <svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
        {{ $t('settings.pwa_title') }}
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
        {{ $t('settings.pwa_desc') }}
      </p>

      <!-- Si l'application est déjà installée en mode autonome -->
      <div v-if="isStandalone" class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {{ $t('settings.pwa_installed_badge') }}
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white">Actif</span>
          </div>
          <div class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            {{ $t('settings.pwa_installed_desc') }}
          </div>
        </div>
      </div>

      <!-- Si l'application est consultée depuis un navigateur classique -->
      <div v-else class="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5">
          <img
            src="/pwa-192x192.png"
            alt="Metadex"
            class="w-12 h-12 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 shrink-0"
          />
          <div>
            <div class="font-bold text-sm text-slate-900 dark:text-white">
              {{ $t('settings.pwa_install_card_title') }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ $t('settings.pwa_install_card_desc') }}
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="handleInstallPwa"
          class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          <span>{{ $t('settings.pwa_install_btn') }}</span>
        </button>
      </div>
    </section>

    <!-- Actions du compte (Déconnexion & Suppression) -->
    <div class="pt-8 border-t border-slate-200 dark:border-slate-800/80 space-y-3.5">
      <!-- Bouton Déconnexion en danger au-dessus -->
      <button
        type="button"
        @click="handleLogout"
        class="w-full py-3.5 px-6 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>{{ $t('settings.logout') }}</span>
      </button>

      <!-- Bouton Danger Outline pour la suppression du compte en-dessous -->
      <button
        type="button"
        @click="openDeleteModal"
        class="w-full py-3.5 px-6 rounded-xl text-sm font-semibold border border-red-500/40 dark:border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" x2="10" y1="11" y2="17"/>
          <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
        <span>{{ $t('settings.delete_account') }}</span>
      </button>
    </div>

    <!-- Modale de Confirmation Stricte de Suppression -->
    <Teleport to="body">
      <Transition name="bottom-sheet">
        <div
          v-if="isDeleteModalOpen"
          class="fixed inset-0 z-[100] overflow-y-auto p-0 sm:p-4 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md"
          @keydown.esc="closeDeleteModal"
          @click.self="closeDeleteModal"
        >
          <div
            class="modal-card relative w-full max-w-md rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 pb-safe sm:pb-6 space-y-5"
            role="alertdialog"
            aria-modal="true"
          >
            <!-- Poignée de glissement sur mobile -->
            <div class="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden flex-shrink-0" />

            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white">
                  {{ $t('settings.delete_modal_title') }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {{ $t('settings.delete_modal_desc') }}
                </p>
              </div>
            </div>

            <div class="space-y-2 bg-red-500/5 border border-red-500/15 rounded-xl p-3.5">
              <label for="delete-confirm" class="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                {{ $t('settings.delete_modal_input_label', { username: user?.username, word: locale === 'fr' ? 'SUPPRIMER' : 'DELETE' }) }}
              </label>
              <input
                id="delete-confirm"
                v-model="deleteConfirmationInput"
                type="text"
                autocomplete="off"
                :placeholder="user?.username || (locale === 'fr' ? 'SUPPRIMER' : 'DELETE')"
                class="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-900/50 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs font-mono"
              />
            </div>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                @click="closeDeleteModal"
                :disabled="isDeletingAccount"
                class="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {{ $t('common.cancel') }}
              </button>

              <button
                type="button"
                @click="handleDeleteAccount"
                :disabled="!isConfirmationValid || isDeletingAccount"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <svg
                  v-if="isDeletingAccount"
                  class="w-3.5 h-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span>{{ isDeletingAccount ? $t('settings.deleting') : $t('settings.delete_confirm_btn') }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    </main>
  </div>
</template>
