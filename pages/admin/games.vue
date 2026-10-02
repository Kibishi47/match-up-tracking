<script setup lang="ts">
import type { Game } from '~/server/db/schema'

definePageMeta({
  middleware: 'admin'
})

const { data: gamesList, refresh: refreshGames, status } = await useFetch<Game[]>('/api/admin/games')

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Formulaire
const form = reactive({
  id: null as string | null,
  name: '',
  slug: '',
  logoUrl: ''
})

const isEditing = computed(() => form.id !== null)

// Auto-compléter le slug si l'utilisateur saisit le nom et n'est pas en train de customiser le slug manuellement
const handleNameChange = () => {
  if (!isEditing.value) {
    form.slug = form.name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.slug = ''
  form.logoUrl = ''
  errorMessage.value = null
}

const editGame = (game: Game) => {
  form.id = game.id
  form.name = game.name
  form.slug = game.slug
  form.logoUrl = game.logoUrl || ''
  errorMessage.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const submitForm = async () => {
  if (!form.name.trim()) {
    errorMessage.value = 'Le nom du jeu est requis'
    return
  }

  isSubmitting.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    if (isEditing.value) {
      await $fetch(`/api/admin/games/${form.id}`, {
        method: 'PUT',
        body: {
          name: form.name,
          slug: form.slug,
          logoUrl: form.logoUrl
        }
      })
      successMessage.value = 'Jeu mis à jour avec succès !'
    } else {
      await $fetch('/api/admin/games', {
        method: 'POST',
        body: {
          name: form.name,
          slug: form.slug,
          logoUrl: form.logoUrl
        }
      })
      successMessage.value = 'Nouveau jeu créé avec succès !'
    }
    resetForm()
    await refreshGames()
    setTimeout(() => { successMessage.value = null }, 3500)
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.message || 'Une erreur est survenue'
  } finally {
    isSubmitting.value = false
  }
}

const { toast, confirmAction } = useNotify()

const deleteGame = async (game: Game) => {
  const confirmed = await confirmAction({
    title: `Supprimer "${game.name}" ?`,
    message: `Cette action est irréversible. Tous les archétypes et matchs associés à ce jeu seront définitivement supprimés.`,
    confirmText: 'Supprimer définitivement',
    isDestructive: true
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/admin/games/${game.id}`, { method: 'DELETE' })
    toast.success(`Le jeu "${game.name}" a été supprimé`)
    await refreshGames()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Erreur lors de la suppression')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 pb-24 transition-colors">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
      <div class="flex items-center justify-between mb-8">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 uppercase tracking-wider">
              Administration
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Catalogue Global des Jeux TCG</h1>
          <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Gérez les jeux supportés sur la plateforme. Les joueurs pourront ensuite les sélectionner et enregistrer leurs archétypes.
          </p>
        </div>
      </div>

      <!-- Messages de statut -->
      <div v-if="successMessage" class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-between">
        <span>{{ successMessage }}</span>
        <button
          type="button"
          @click="successMessage = null"
          class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 p-1 rounded-lg transition cursor-pointer"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
        <span>{{ errorMessage }}</span>
        <button
          type="button"
          @click="errorMessage = null"
          class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-lg transition cursor-pointer"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Formulaire de création / édition -->
        <div class="lg:col-span-1">
          <div class="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm sticky top-24">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              {{ isEditing ? 'Modifier le jeu' : 'Ajouter un nouveau jeu' }}
            </h2>

            <form @submit.prevent="submitForm" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Nom du TCG *
                </label>
                <input
                  v-model="form.name"
                  @input="handleNameChange"
                  type="text"
                  required
                  placeholder="Ex: One piece"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Slug URL (identifiant unique)
                </label>
                <input
                  v-model="form.slug"
                  type="text"
                  placeholder="ex: one-piece"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm font-mono"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  URL du Logo / Bannière (optionnel)
                </label>
                <input
                  v-model="form.logoUrl"
                  type="url"
                  placeholder="https://..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>

              <!-- Prévisualisation du logo -->
              <div v-if="form.logoUrl" class="mt-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <img :src="form.logoUrl" alt="Aperçu logo" class="w-12 h-12 rounded-lg object-contain bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1" />
                <span class="text-xs text-slate-500 dark:text-slate-400">Aperçu du logo</span>
              </div>

              <div class="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {{ isSubmitting ? 'Enregistrement...' : (isEditing ? 'Sauvegarder' : 'Créer le jeu') }}
                </button>
                <button
                  v-if="isEditing"
                  type="button"
                  @click="resetForm"
                  class="py-2.5 px-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Liste des jeux -->
        <div class="lg:col-span-2">
          <div class="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">Jeux configurés ({{ gamesList?.length || 0 }})</h2>
              <button
                type="button"
                @click="refreshGames()"
                class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 sm:px-2.5 sm:py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                title="Actualiser les jeux"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span class="hidden sm:inline">Actualiser</span>
              </button>
            </div>

            <div v-if="status === 'pending'" class="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              Chargement des jeux...
            </div>

            <div v-else-if="!gamesList || gamesList.length === 0" class="py-12 text-center">
              <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-purple-500 dark:text-purple-400 mb-3 shadow-inner">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="20" height="12" x="2" y="6" rx="6" />
                  <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
                </svg>
              </div>
              <p class="text-slate-500 dark:text-slate-400 text-sm">Aucun jeu TCG n'a encore été créé.</p>
              <p class="text-slate-400 dark:text-slate-500 text-xs mt-1">Utilisez le formulaire ci-contre pour créer le premier jeu.</p>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="game in gamesList"
                :key="game.id"
                class="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 shadow-sm transition flex flex-col justify-between group"
              >
                <div class="flex items-start gap-3.5">
                  <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      v-if="game.logoUrl"
                      :src="game.logoUrl"
                      :alt="game.name"
                      class="w-full h-full object-contain p-1"
                      @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                    />
                    <span v-else class="text-xl font-bold text-slate-400 dark:text-slate-500">
                      {{ game.name.slice(0, 1).toUpperCase() }}
                    </span>
                  </div>

                  <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-slate-900 dark:text-white text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {{ game.name }}
                    </h3>
                    <p class="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate">
                      slug: {{ game.slug }}
                    </p>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    @click="editGame(game)"
                    class="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Modifier
                  </button>
                  <button
                    @click="deleteGame(game)"
                    class="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
