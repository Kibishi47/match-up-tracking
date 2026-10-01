<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, fetch: refreshSession, clear } = useUserSession()
const colorMode = useColorMode()
const { showToast } = useNotify()

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
    showToast('Le nom d’utilisateur doit contenir entre 2 et 32 caractères.', 'warning')
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
      showToast('Votre nom d’utilisateur a été mis à jour avec succès.', 'success')
    }
  } catch (err: any) {
    const msg = err?.data?.statusMessage || 'Erreur lors de la mise à jour du profil.'
    showToast(msg, 'error')
  } finally {
    isSavingProfile.value = false
  }
}

// Thèmes disponibles
const themes = [
  {
    id: 'light',
    label: 'Clair',
    description: 'Interface lumineuse et contrastée',
    icon: 'sun'
  },
  {
    id: 'dark',
    label: 'Sombre',
    description: 'Interface sombre douce pour les yeux',
    icon: 'moon'
  },
  {
    id: 'system',
    label: 'Système',
    description: 'S’adapte aux préférences de votre appareil',
    icon: 'monitor'
  }
]

const setTheme = (themeId: string) => {
  colorMode.preference = themeId
  showToast(`Thème réglé sur "${themeId}".`, 'info', 2000)
}

// Modale de suppression sécurisée
const isDeleteModalOpen = ref(false)
const deleteConfirmationInput = ref('')
const isDeletingAccount = ref(false)

const isConfirmationValid = computed(() => {
  const trimmed = deleteConfirmationInput.value.trim()
  return trimmed === user.value?.username || trimmed === 'SUPPRIMER'
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
    showToast('Votre compte et l’ensemble de vos données ont été définitivement supprimés.', 'success')
    navigateTo('/login')
  } catch (err: any) {
    const msg = err?.data?.statusMessage || 'Erreur lors de la suppression du compte.'
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
        Paramètres du compte
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Gérez vos informations personnelles, vos préférences visuelles et la sécurité de votre compte.
      </p>
    </div>

    <!-- 1. Section Profil -->
    <section class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2.5">
        <svg class="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Profil & Identité
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Informations visibles sur votre espace personnel.
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
              Admin
            </span>
          </div>
        </div>
      </div>

      <!-- Édition du nom d'affichage -->
      <form @submit.prevent="handleSaveProfile" class="mt-6 space-y-4 max-w-lg">
        <div>
          <label for="username" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Nom d'affichage
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
            Ce nom apparaîtra sur vos archétypes, vos parties et votre profil. Entre 2 et 32 caractères.
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
            <span>{{ isSavingProfile ? 'Enregistrement...' : 'Enregistrer les modifications' }}</span>
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
        Préférences d'affichage
      </h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Personnalisez l’apparence visuelle de l’application selon vos besoins.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          v-for="theme in themes"
          :key="theme.id"
          type="button"
          @click="setTheme(theme.id)"
          :class="[
            'p-4 rounded-xl border text-left transition duration-200 cursor-pointer flex flex-col justify-between gap-3 relative',
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
        <span>Se déconnecter</span>
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
        <span>Supprimer mon compte</span>
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
                  Supprimer définitivement le compte ?
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cette action est immédiate et irrévocable. Toutes vos métas, vos archétypes et vos historiques de parties seront définitivement supprimés.
                </p>
              </div>
            </div>

            <div class="space-y-2 bg-red-500/5 border border-red-500/15 rounded-xl p-3.5">
              <label for="delete-confirm" class="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                Pour confirmer, veuillez saisir votre pseudo <strong class="text-red-600 dark:text-red-400 underline">{{ user?.username }}</strong> ou le mot <strong class="text-red-600 dark:text-red-400">SUPPRIMER</strong> :
              </label>
              <input
                id="delete-confirm"
                v-model="deleteConfirmationInput"
                type="text"
                autocomplete="off"
                :placeholder="user?.username || 'SUPPRIMER'"
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
                Annuler
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
                <span>{{ isDeletingAccount ? 'Suppression en cours...' : 'Confirmer la suppression définitive' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    </main>
  </div>
</template>
