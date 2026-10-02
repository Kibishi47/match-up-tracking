<script setup lang="ts">
import type { Game, Meta } from '~/server/db/schema'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openManageGames'): void
}>()

useScrollLock(toRef(props, 'isOpen'))

const { games, activeGameId, setActiveGame } = useGameSession()
const { activeMetaId, setActiveMeta, refreshMetas: refreshSessionMetas } = useMetaSession()
const { toast, confirmAction } = useNotify()

// Jeu sélectionné temporairement dans la modale
const selectedGameId = ref<string | null>(null)
const newMetaName = ref('')
const isCreatingMeta = ref(false)
const localMetas = ref<Meta[]>([])
const isLoadingMetas = ref(false)

// Mode gestion / édition des métas
const isEditMode = ref(false)
const editingMetaId = ref<string | null>(null)
const editingMetaName = ref('')
const isSavingOrder = ref(false)

const cancelRename = () => {
  editingMetaId.value = null
  editingMetaName.value = ''
}

// Initialiser le jeu sélectionné à l'ouverture
watch(() => props.isOpen, (open) => {
  if (open) {
    isEditMode.value = false
    cancelRename()
    newMetaName.value = ''
    selectedGameId.value = activeGameId.value || (games.value && games.value.length > 0 ? games.value[0].id : null)
    loadMetasForSelectedGame()
  }
})

// Recharger les métas quand le jeu sélectionné change
watch(selectedGameId, () => {
  if (props.isOpen && selectedGameId.value) {
    isEditMode.value = false
    cancelRename()
    loadMetasForSelectedGame()
  }
})

const selectedGame = computed(() => {
  return games.value?.find(g => g.id === selectedGameId.value) || null
})

const loadMetasForSelectedGame = async () => {
  if (!selectedGameId.value) {
    localMetas.value = []
    return
  }
  isLoadingMetas.value = true
  try {
    const data = await $fetch<Meta[]>('/api/metas', {
      query: { gameId: selectedGameId.value }
    })
    localMetas.value = data || []
  } catch (err: any) {
    toast.error('Impossible de charger les métas de ce jeu')
  } finally {
    isLoadingMetas.value = false
  }
}

// Clic sur une méta -> activation globale
const selectMeta = (meta: Meta) => {
  if (!selectedGameId.value) return

  // 1. Mise à jour de la session de jeu
  setActiveGame(selectedGameId.value)
  // 2. Mise à jour de la méta active
  setActiveMeta(meta.id)

  // 3. Mise à jour explicite du localStorage
  try {
    localStorage.setItem('tcg_active_game', selectedGameId.value)
    localStorage.setItem('tcg_active_meta', meta.id)
  } catch {}

  toast.info(`Format actif : ${selectedGame.value?.name || 'Jeu'} — ${meta.name}`)
  emit('close')
}

// Créer une nouvelle méta pour le jeu sélectionné
const handleCreateMeta = async () => {
  const trimmed = newMetaName.value.trim()
  if (!trimmed) {
    toast.warning('Veuillez saisir un nom pour la méta.')
    return
  }

  if (!selectedGameId.value) {
    toast.error('Veuillez d\'abord choisir un jeu.')
    return
  }

  isCreatingMeta.value = true
  try {
    const created = await $fetch<Meta>('/api/metas', {
      method: 'POST',
      body: {
        gameId: selectedGameId.value,
        name: trimmed,
        sourceMetaId: localMetas.value.length > 0 ? localMetas.value[0].id : undefined
      }
    })

    toast.success(`Méta "${trimmed}" créée avec succès !`)
    newMetaName.value = ''
    await loadMetasForSelectedGame()
    if (selectedGameId.value === activeGameId.value) {
      await refreshSessionMetas()
    }
    // Sélectionner automatiquement la méta fraîchement créée
    selectMeta(created)
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || err?.message || 'Erreur lors de la création de la méta')
  } finally {
    isCreatingMeta.value = false
  }
}

// Renommage
const startRename = (meta: Meta) => {
  editingMetaId.value = meta.id
  editingMetaName.value = meta.name
}

const saveRename = async (meta: Meta) => {
  const trimmed = editingMetaName.value.trim()
  if (!trimmed) {
    toast.warning('Le nom de la méta ne peut pas être vide.')
    return
  }
  if (trimmed === meta.name) {
    cancelRename()
    return
  }

  try {
    const updated = await $fetch<Meta>(`/api/metas/${meta.id}`, {
      method: 'PATCH',
      body: { name: trimmed }
    })
    meta.name = updated.name
    cancelRename()
    toast.success('Méta renommée avec succès !')
    if (selectedGameId.value === activeGameId.value) {
      await refreshSessionMetas()
    }
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || err?.message || 'Erreur lors du renommage')
  }
}

// Réorganisation (Reorder)
const moveMetaUp = async (index: number) => {
  if (index <= 0) return
  const item = localMetas.value.splice(index, 1)[0]
  localMetas.value.splice(index - 1, 0, item)
  await persistMetaOrder()
}

const moveMetaDown = async (index: number) => {
  if (index >= localMetas.value.length - 1) return
  const item = localMetas.value.splice(index, 1)[0]
  localMetas.value.splice(index + 1, 0, item)
  await persistMetaOrder()
}

const persistMetaOrder = async () => {
  if (!selectedGameId.value || isSavingOrder.value) return
  isSavingOrder.value = true
  try {
    await $fetch('/api/metas/reorder', {
      method: 'PUT',
      body: {
        gameId: selectedGameId.value,
        metaIds: localMetas.value.map(m => m.id)
      }
    })
    if (selectedGameId.value === activeGameId.value) {
      await refreshSessionMetas()
    }
  } catch (err: any) {
    toast.error('Erreur lors de la réorganisation des métas')
  } finally {
    isSavingOrder.value = false
  }
}

// Suppression
const handleDeleteMeta = async (meta: Meta) => {
  const confirmed = await confirmAction({
    title: `Supprimer la méta "${meta.name}" ?`,
    message: 'Cette action supprimera définitivement cette méta ainsi que ses archétypes et statistiques associés.',
    confirmText: 'Supprimer',
    isDestructive: true
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/metas/${meta.id}`, { method: 'DELETE' })
    toast.success(`Méta "${meta.name}" supprimée`)
    localMetas.value = localMetas.value.filter(m => m.id !== meta.id)

    if (selectedGameId.value === activeGameId.value) {
      await refreshSessionMetas()
      if (activeMetaId.value === meta.id) {
        if (localMetas.value.length > 0) {
          selectMeta(localMetas.value[0])
        } else {
          setActiveMeta(null as any)
        }
      }
    }
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || err?.message || 'Erreur lors de la suppression de la méta')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto p-0 sm:p-4 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md"
        @click.self="emit('close')"
      >
        <div
          class="modal-card relative w-full max-w-2xl rounded-t-3xl sm:rounded-3xl rounded-b-none sm:rounded-b-3xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] pb-safe sm:pb-0"
          role="dialog"
          aria-modal="true"
        >
          <!-- Header de la Modale -->
          <div class="px-6 pt-3 pb-4 sm:py-5 border-b border-slate-200 dark:border-slate-800/80 flex flex-col bg-white dark:bg-slate-900 flex-shrink-0">
            <!-- Poignée de glissement sur mobile -->
            <div class="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 sm:hidden flex-shrink-0" />

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white flex-shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="12" x="2" y="6" rx="6" />
                    <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Configuration Jeu & Méta
                  </h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    Sélectionnez le jeu et l'extension active pour vos matchs et statistiques
                  </p>
                </div>
              </div>

              <button
                type="button"
                @click="emit('close')"
                class="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

        <!-- Corps de la Modale -->
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- SECTION 1 : JEUX -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                1. Choisissez votre TCG
              </label>
              <button
                type="button"
                @click="emit('openManageGames')"
                class="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>+ Gérer ma collection</span>
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </button>
            </div>

            <!-- Liste des jeux -->
            <div v-if="games && games.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                v-for="game in games"
                :key="game.id"
                type="button"
                @click="selectedGameId = game.id"
                :class="[
                  'flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer',
                  selectedGameId === game.id
                    ? 'bg-indigo-600/15 border-indigo-500 text-slate-900 dark:text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
                ]"
              >
                <div class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img
                    v-if="game.logoUrl"
                    :src="game.logoUrl"
                    :alt="game.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {{ game.name.slice(0, 2).toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold truncate flex items-center gap-1.5">
                    <span>{{ game.name }}</span>
                    <span
                      v-if="game.id === activeGameId"
                      class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    >
                      En cours
                    </span>
                  </div>
                  <span class="text-xs text-slate-400 dark:text-slate-500">{{ game.slug }}</span>
                </div>
                <div v-if="selectedGameId === game.id" class="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/80"></div>
              </button>
            </div>

            <!-- Aucun jeu -->
            <div
              v-else
              class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2"
            >
              <p class="text-xs text-slate-500 dark:text-slate-400">Aucun jeu activé dans votre collection.</p>
              <button
                type="button"
                @click="emit('openManageGames')"
                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                Sélectionner des jeux
              </button>
            </div>
          </div>

          <div class="border-t border-slate-200 dark:border-slate-800/80"></div>

          <!-- SECTION 2 : MÉTAS DU JEU SÉLECTIONNÉ -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                2. Formats & Métas
                <span v-if="selectedGame" class="text-emerald-600 dark:text-emerald-400 normal-case font-medium">
                  ({{ selectedGame.name }})
                </span>
              </label>

              <!-- Bouton activation mode gestion -->
              <button
                v-if="localMetas.length > 0"
                type="button"
                @click="isEditMode = !isEditMode; cancelRename()"
                :class="[
                  'text-xs px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer',
                  isEditMode
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                ]"
              >
                <svg v-if="!isEditMode" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                <span>{{ isEditMode ? 'Terminer' : 'Gérer les métas' }}</span>
              </button>
            </div>

            <!-- Loading -->
            <div v-if="isLoadingMetas" class="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
              <svg class="w-5 h-5 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span class="text-xs">Chargement des métas...</span>
            </div>

            <!-- Aucune méta trouvée -->
            <div
              v-else-if="localMetas.length === 0"
              class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3"
            >
              <div class="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-bold text-amber-600 dark:text-amber-300">Aucune méta configurée</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Ce jeu ne possède pas encore de méta ou extension. Créez-en une directement pour commencer à suivre vos matchs.
                </p>
              </div>

              <!-- Champ de saisie direct pour premier ajout -->
              <form @submit.prevent="handleCreateMeta" class="flex gap-2 max-w-md mx-auto pt-2">
                <input
                  v-model="newMetaName"
                  type="text"
                  placeholder="Nom du set / format..."
                  required
                  class="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  :disabled="isCreatingMeta || !newMetaName.trim()"
                  class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <span v-if="isCreatingMeta">Création...</span>
                  <span v-else>Créer</span>
                </button>
              </form>
            </div>

            <!-- Liste des métas existantes -->
            <div v-else class="space-y-3">
              <!-- MODE GESTION / ÉDITION (Renommage, Reorder, Suppression) -->
              <div v-if="isEditMode" class="space-y-2 max-h-64 overflow-y-auto pr-1">
                <div
                  v-for="(meta, index) in localMetas"
                  :key="meta.id"
                  class="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <!-- 1. Réordonner (Haut / Bas) -->
                  <div class="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      @click="moveMetaUp(index)"
                      :disabled="index === 0"
                      class="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Monter d'une position"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="m18 15-6-6-6 6"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      @click="moveMetaDown(index)"
                      :disabled="index === localMetas.length - 1"
                      class="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Descendre d'une position"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>
                  </div>

                  <!-- 2. Nom ou Input de renommage -->
                  <div class="flex-1 min-w-0">
                    <div v-if="editingMetaId === meta.id" class="flex items-center gap-1.5">
                      <input
                        v-model="editingMetaName"
                        type="text"
                        maxlength="100"
                        @keyup.enter="saveRename(meta)"
                        @keyup.esc="cancelRename"
                        class="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500 text-slate-900 dark:text-white text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        @click="saveRename(meta)"
                        class="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex-shrink-0 cursor-pointer"
                        title="Enregistrer"
                      >
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        @click="cancelRename"
                        class="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex-shrink-0 cursor-pointer"
                        title="Annuler"
                      >
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <div v-else class="flex items-center gap-2">
                      <span class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">{{ meta.name }}</span>
                      <span
                        v-if="meta.id === activeMetaId && selectedGameId === activeGameId"
                        class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex-shrink-0"
                      >
                        Actif
                      </span>
                    </div>
                  </div>

                  <!-- 3. Actions (Renommer & Supprimer) -->
                  <div v-if="editingMetaId !== meta.id" class="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      @click="startRename(meta)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Renommer cette méta"
                    >
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      @click="handleDeleteMeta(meta)"
                      class="p-1.5 rounded-lg text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                      title="Supprimer définitivement cette méta"
                    >
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- MODE SELECTION STANDARD (Sans affichage de la date) -->
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                <button
                  v-for="meta in localMetas"
                  :key="meta.id"
                  type="button"
                  @click="selectMeta(meta)"
                  :class="[
                    'flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-200 group cursor-pointer',
                    meta.id === activeMetaId && selectedGameId === activeGameId
                      ? 'bg-emerald-500/15 border-emerald-500 text-slate-900 dark:text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                  ]"
                >
                  <div class="min-w-0 pr-2">
                    <div class="text-sm font-semibold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
                      {{ meta.name }}
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      v-if="meta.id === activeMetaId && selectedGameId === activeGameId"
                      class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    >
                      Actif
                    </span>
                    <span
                      v-else
                      class="text-xs text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      Activer →
                    </span>
                  </div>
                </button>
              </div>

              <!-- Formulaire compact en bas de section pour créer une nouvelle méta -->
              <form
                @submit.prevent="handleCreateMeta"
                class="pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center gap-2"
              >
                <div class="relative flex-1">
                  <input
                    v-model="newMetaName"
                    type="text"
                    placeholder="Nouveau set / format..."
                    maxlength="100"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  :disabled="isCreatingMeta || !newMetaName.trim()"
                  class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition disabled:opacity-50 shadow-md shadow-emerald-950/20 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  <span v-if="isCreatingMeta">Création...</span>
                  <span v-else>+ Créer</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
          <span>
            Cliquez sur un format pour l'activer instantanément.
          </span>
        </div>
      </div>
    </div>
    </Transition>
  </Teleport>
</template>
