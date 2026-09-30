<script setup lang="ts">
import type { Game, Meta } from '~/server/db/schema'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'openManageGames'): void
}>()

const { games, activeGameId, setActiveGame } = useGameSession()
const { activeMetaId, setActiveMeta, refreshMetas: refreshSessionMetas } = useMetaSession()
const { toast } = useNotify()

// Jeu sélectionné temporairement dans la modale
const selectedGameId = ref<string | null>(null)
const newMetaName = ref('')
const isCreatingMeta = ref(false)
const localMetas = ref<Meta[]>([])
const isLoadingMetas = ref(false)

// Initialiser le jeu sélectionné à l'ouverture
watch(() => props.isOpen, (open) => {
  if (open) {
    newMetaName.value = ''
    selectedGameId.value = activeGameId.value || (games.value && games.value.length > 0 ? games.value[0].id : null)
    loadMetasForSelectedGame()
  }
})

// Recharger les métas quand le jeu sélectionné change
watch(selectedGameId, () => {
  if (props.isOpen && selectedGameId.value) {
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
    // Garanti tri DESC par date de création
    localMetas.value = (data || []).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })
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
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto p-4 flex min-h-full items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in"
      @click.self="emit('close')"
    >
      <div
        class="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header de la Modale -->
        <div class="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="12" x="2" y="6" rx="6" />
                <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">
                Configuration Jeu & Méta
              </h3>
              <p class="text-xs text-slate-400">
                Sélectionnez le jeu et l'extension active pour vos matchs et statistiques
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="emit('close')"
            class="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Corps de la Modale -->
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- SECTION 1 : JEUX -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                1. Choisissez votre TCG
              </label>
              <button
                type="button"
                @click="emit('openManageGames')"
                class="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline cursor-pointer"
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
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                ]"
              >
                <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img
                    v-if="game.logoUrl"
                    :src="game.logoUrl"
                    :alt="game.name"
                    class="w-full h-full object-cover"
                  />
                  <span v-else class="text-xs font-bold text-slate-400">
                    {{ game.name.slice(0, 2).toUpperCase() }}
                  </span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold truncate flex items-center gap-1.5">
                    <span>{{ game.name }}</span>
                    <span
                      v-if="game.id === activeGameId"
                      class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    >
                      En cours
                    </span>
                  </div>
                  <span class="text-xs text-slate-400">{{ game.slug }}</span>
                </div>
                <div v-if="selectedGameId === game.id" class="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/80"></div>
              </button>
            </div>

            <!-- Aucun jeu -->
            <div
              v-else
              class="p-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2"
            >
              <p class="text-xs text-slate-400">Aucun jeu activé dans votre collection.</p>
              <button
                type="button"
                @click="emit('openManageGames')"
                class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
              >
                Sélectionner des jeux
              </button>
            </div>
          </div>

          <div class="border-t border-slate-800/80"></div>

          <!-- SECTION 2 : MÉTAS DU JEU SÉLECTIONNÉ -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                2. Formats & Métas
                <span v-if="selectedGame" class="text-emerald-400 normal-case font-medium">
                  ({{ selectedGame.name }})
                </span>
              </label>
              <span class="text-[11px] text-slate-500">Triées par date décroissante (plus récent d'abord)</span>
            </div>

            <!-- Loading -->
            <div v-if="isLoadingMetas" class="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
              <svg class="w-5 h-5 animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none">
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
              <div class="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-bold text-amber-300">Aucune méta configurée</h4>
                <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Ce jeu ne possède pas encore de méta ou extension. Créez-en une directement pour commencer à suivre vos matchs.
                </p>
              </div>

              <!-- Champ de saisie direct pour premier ajout -->
              <form @submit.prevent="handleCreateMeta" class="flex gap-2 max-w-md mx-auto pt-2">
                <input
                  v-model="newMetaName"
                  type="text"
                  placeholder="Ex: Set 1, OP-07, Bloc 2026..."
                  required
                  class="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
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
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                <button
                  v-for="meta in localMetas"
                  :key="meta.id"
                  type="button"
                  @click="selectMeta(meta)"
                  :class="[
                    'flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-200 group cursor-pointer',
                    meta.id === activeMetaId && selectedGameId === activeGameId
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                  ]"
                >
                  <div class="min-w-0 pr-2">
                    <div class="text-sm font-semibold truncate group-hover:text-emerald-300 transition">
                      {{ meta.name }}
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                      {{ new Date(meta.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                    </div>
                  </div>

                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      v-if="meta.id === activeMetaId && selectedGameId === activeGameId"
                      class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    >
                      Actif
                    </span>
                    <span
                      v-else
                      class="text-xs text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      Activer →
                    </span>
                  </div>
                </button>
              </div>

              <!-- Formulaire compact en bas de section pour créer une nouvelle méta -->
              <form
                @submit.prevent="handleCreateMeta"
                class="pt-3 border-t border-slate-800/60 flex items-center gap-2"
              >
                <div class="relative flex-1">
                  <input
                    v-model="newMetaName"
                    type="text"
                    placeholder="Nouveau set / format (ex: OP-08, Bloc 2026...)"
                    maxlength="100"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  :disabled="isCreatingMeta || !newMetaName.trim()"
                  class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition disabled:opacity-50 shadow-md shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  <span v-if="isCreatingMeta">Création...</span>
                  <span v-else>+ Créer</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <span class="text-xs text-slate-500">
            Cliquez sur un format pour l'activer instantanément.
          </span>
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
