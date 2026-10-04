<script setup lang="ts">
import type { Game } from '~/server/db/schema'

definePageMeta({
  middleware: 'admin'
})

const { data: gamesList, refresh: refreshGames, status } = useLazyFetch<Game[]>('/api/admin/games')

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
    errorMessage.value = t('admin_games.name_required')
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
      successMessage.value = t('admin_games.updated_success')
    } else {
      await $fetch('/api/admin/games', {
        method: 'POST',
        body: {
          name: form.name,
          slug: form.slug,
          logoUrl: form.logoUrl
        }
      })
    }
    resetForm()
    await refreshGames()
    setTimeout(() => { successMessage.value = null }, 3500)
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.message || 'Error'
  } finally {
    isSubmitting.value = false
  }
}

const { toast, confirmAction } = useNotify()
const { t } = useI18n()

const deleteGame = async (game: Game) => {
  const confirmed = await confirmAction({
    title: t('admin_games.delete_confirm_title', { name: game.name }),
    message: t('admin_games.delete_confirm_msg'),
    confirmText: t('admin_games.delete_confirm_btn'),
    cancelText: t('common.cancel'),
    isDestructive: true
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/admin/games/${game.id}`, { method: 'DELETE' })
    toast.success(t('admin_games.deleted_success', { name: game.name }))
    await refreshGames()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || t('admin_games.delete_error'))
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
              {{ $t('admin_games.badge') }}
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{{ $t('admin_games.title') }}</h1>
          <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {{ $t('admin_games.subtitle') }}
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
              {{ isEditing ? $t('admin_games.edit_game') : $t('admin_games.add_game') }}
            </h2>

            <form @submit.prevent="submitForm" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {{ $t('admin_games.name_label') }}
                </label>
                <input
                  v-model="form.name"
                  @input="handleNameChange"
                  type="text"
                  required
                  :placeholder="$t('admin_games.name_placeholder')"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {{ $t('admin_games.slug_label') }}
                </label>
                <input
                  v-model="form.slug"
                  type="text"
                  :placeholder="$t('admin_games.slug_placeholder')"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm font-mono"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  {{ $t('admin_games.logo_label') }}
                </label>
                <input
                  v-model="form.logoUrl"
                  type="url"
                  :placeholder="$t('admin_games.logo_placeholder')"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>

              <!-- Prévisualisation du logo -->
              <div v-if="form.logoUrl" class="mt-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <img :src="form.logoUrl" :alt="$t('admin_games.logo_preview')" class="w-12 h-12 rounded-lg object-contain bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1" />
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ $t('admin_games.logo_preview') }}</span>
              </div>

              <div class="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {{ isSubmitting ? $t('admin_games.saving') : (isEditing ? $t('admin_games.save') : $t('admin_games.create')) }}
                </button>
                <button
                  v-if="isEditing"
                  type="button"
                  @click="resetForm"
                  class="py-2.5 px-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {{ $t('admin_games.cancel') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Liste des jeux -->
        <div class="lg:col-span-2">
          <div class="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">{{ $t('admin_games.configured_games', { count: gamesList?.length || 0 }) }}</h2>
              <button
                type="button"
                @click="refreshGames()"
                class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 sm:px-2.5 sm:py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                :title="$t('admin_games.refresh')"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
                <span class="hidden sm:inline">{{ $t('admin_games.refresh') }}</span>
              </button>
            </div>

            <div v-if="status === 'pending'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="i in 4"
                :key="i"
                class="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 animate-pulse flex items-start gap-3.5"
              >
                <div class="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div class="space-y-2 flex-1 min-w-0">
                  <div class="h-4 bg-slate-300 dark:bg-slate-700 rounded w-2/3" />
                  <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                </div>
              </div>
            </div>

            <div v-else-if="!gamesList || gamesList.length === 0" class="py-12 text-center">
              <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-purple-500 dark:text-purple-400 mb-3 shadow-inner">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="20" height="12" x="2" y="6" rx="6" />
                  <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
                </svg>
              </div>
              <p class="text-slate-500 dark:text-slate-400 text-sm">{{ $t('admin_games.no_games') }}</p>
              <p class="text-slate-400 dark:text-slate-500 text-xs mt-1">{{ $t('admin_games.no_games_desc') }}</p>
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
                    {{ $t('admin_games.modify') }}
                  </button>
                  <button
                    @click="deleteGame(game)"
                    class="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    {{ $t('admin_games.delete') }}
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
