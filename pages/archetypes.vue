<script setup lang="ts">
import type { Archetype, Meta } from '~/server/db/schema'
import GameMetaModal from '~/components/modal/GameMetaModal.vue'

definePageMeta({
  middleware: 'auth'
})

const isGameMetaModalOpen = ref(false)

// Utiliser la session de jeu partagée (synchronisée avec le Header)
const { activeGame, activeGameId } = useGameSession()

// Utiliser la session de méta active
const { metas, activeMeta, activeMetaId, refreshMetas, setActiveMeta, isLoadingMetas } = useMetaSession()

// Charger les archétypes pour le jeu et la méta sélectionnés
const { data: archetypesList, refresh: refreshArchetypes, status: loadingArchetypes } = await useFetch<Archetype[]>('/api/archetypes', {
  query: computed(() => ({
    gameId: activeGameId.value || undefined,
    metaId: activeMetaId.value || undefined,
    includeArchived: false
  })),
  watch: [activeGameId, activeMetaId]
})

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Formulaire
const form = reactive({
  id: null as string | null,
  metaId: null as string | null,
  name: '',
  card1Name: '',
  card1ImageUrl: '',
  card2Name: '',
  card2ImageUrl: ''
})

const isEditing = computed(() => form.id !== null)

const resetForm = () => {
  form.id = null
  form.metaId = activeMetaId.value
  form.name = ''
  form.card1Name = ''
  form.card1ImageUrl = ''
  form.card2Name = ''
  form.card2ImageUrl = ''
  errorMessage.value = null
}

// Synchroniser le formulaire avec la méta active par défaut
watch(activeMetaId, (newMetaId) => {
  if (!isEditing.value) {
    form.metaId = newMetaId
  }
})

const editArchetype = (arch: Archetype) => {
  form.id = arch.id
  form.metaId = arch.metaId
  form.name = arch.name
  form.card1Name = arch.card1Name || ''
  form.card1ImageUrl = arch.card1ImageUrl || ''
  form.card2Name = arch.card2Name || ''
  form.card2ImageUrl = arch.card2ImageUrl || ''
  errorMessage.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const submitForm = async () => {
  if (!activeGameId.value || !activeMetaId.value) {
    errorMessage.value = 'Veuillez sélectionner un jeu et une méta avant de créer un archétype'
    return
  }
  if (!form.name.trim()) {
    errorMessage.value = "Le nom de l'archétype est requis"
    return
  }

  isSubmitting.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const targetMetaId = form.metaId || activeMetaId.value

    if (isEditing.value) {
      await $fetch(`/api/archetypes/${form.id}`, {
        method: 'PUT',
        body: {
          name: form.name,
          metaId: targetMetaId,
          card1Name: form.card1Name,
          card1ImageUrl: form.card1ImageUrl,
          card2Name: form.card2Name,
          card2ImageUrl: form.card2ImageUrl
        }
      })
      successMessage.value = 'Archétype mis à jour !'
    } else {
      await $fetch('/api/archetypes', {
        method: 'POST',
        body: {
          gameId: activeGameId.value,
          metaId: targetMetaId,
          name: form.name,
          card1Name: form.card1Name,
          card1ImageUrl: form.card1ImageUrl,
          card2Name: form.card2Name,
          card2ImageUrl: form.card2ImageUrl
        }
      })
      successMessage.value = 'Nouvel archétype créé !'
    }
    resetForm()
    await refreshArchetypes()
    setTimeout(() => { successMessage.value = null }, 3500)
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || err?.message || 'Une erreur est survenue'
  } finally {
    isSubmitting.value = false
  }
}

const { toast, confirmAction } = useNotify()

const archiveArchetype = async (arch: Archetype) => {
  const confirmed = await confirmAction({
    title: `Archiver l'archétype "${arch.name}" ?`,
    message: `Il ne sera plus proposé pour enregistrer de nouveaux matchs, mais l'historique et les statistiques associées seront préservés.`,
    confirmText: 'Archiver',
    isDestructive: false
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/archetypes/${arch.id}`, { method: 'DELETE' })
    toast.success(`Archétype "${arch.name}" archivé`)
    await refreshArchetypes()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || "Erreur lors de l'archivage")
  }
}

const handleMetaCreated = async (newMeta: Meta) => {
  await refreshMetas()
  setActiveMeta(newMeta.id)
  await refreshArchetypes()
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 pb-24">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-3xl font-extrabold text-white">Mes Archétypes & Decks</h1>
            <span
              v-if="activeGame"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              {{ activeGame.name }}
            </span>
            <span
              v-if="activeMeta"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
            >
              {{ activeMeta.name }}
            </span>
          </div>
          <p class="text-slate-400 text-sm mt-1">
            Gérez vos decks personnels et les archétypes du metagame que vous affrontez pour le format en cours.
          </p>
        </div>
      </div>

      <!-- Messages de feedback -->
      <div v-if="successMessage" class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
        <span>{{ successMessage }}</span>
        <button
          type="button"
          @click="successMessage = null"
          class="text-emerald-400 hover:text-emerald-300 p-1 rounded-lg transition"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
        <span>{{ errorMessage }}</span>
        <button
          type="button"
          @click="errorMessage = null"
          class="text-red-400 hover:text-red-300 p-1 rounded-lg transition"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Formulaire de création / édition OU invitation à sélectionner jeu & méta -->
        <div class="lg:col-span-1">
          <!-- État bloqué : aucun jeu ou aucune méta active -->
          <div
            v-if="!activeGameId || !activeMetaId"
            class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-4 sticky top-24"
          >
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="12" x="2" y="6" rx="6" />
                <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Sélection Jeu & Méta requise</h3>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Un archétype doit obligatoirement être rattaché à un jeu et à une extension / méta active.
              </p>
            </div>
            <button
              type="button"
              @click="isGameMetaModalOpen = true"
              class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-950/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Choisir Jeu & Format</span>
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Formulaire actif -->
          <div v-else class="glass-panel p-6 rounded-2xl border border-slate-800 sticky top-24">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                {{ isEditing ? "Modifier l'archétype" : 'Nouvel Archétype' }}
              </h2>
              <span v-if="activeMeta" class="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {{ activeMeta.name }}
              </span>
            </div>

            <form @submit.prevent="submitForm" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Nom de l'archétype *
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="Ex: Ruby / Amethyst Bounce, Charizard ex..."
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
                />
              </div>

              <!-- Carte clé 1 -->
              <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  Carte Clé 1 (Illustration principale)
                </span>
                <input
                  v-model="form.card1Name"
                  type="text"
                  placeholder="Nom de la carte (ex: Elsa - Spirit of Winter)"
                  class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  v-model="form.card1ImageUrl"
                  type="url"
                  placeholder="URL illustration (https://...)"
                  class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
                <div v-if="form.card1ImageUrl" class="mt-1 flex items-center gap-2">
                  <img :src="form.card1ImageUrl" alt="Aperçu carte 1" class="w-10 h-14 object-cover rounded border border-slate-700" />
                  <span class="text-[11px] text-slate-400 truncate">{{ form.card1Name || 'Carte 1' }}</span>
                </div>
              </div>

              <!-- Carte clé 2 -->
              <div class="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                <span class="text-xs font-semibold text-indigo-400 uppercase tracking-wider block">
                  Carte Clé 2 (Optionnelle)
                </span>
                <input
                  v-model="form.card2Name"
                  type="text"
                  placeholder="Nom de la carte 2"
                  class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
                <input
                  v-model="form.card2ImageUrl"
                  type="url"
                  placeholder="URL illustration 2 (https://...)"
                  class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
                <div v-if="form.card2ImageUrl" class="mt-1 flex items-center gap-2">
                  <img :src="form.card2ImageUrl" alt="Aperçu carte 2" class="w-10 h-14 object-cover rounded border border-slate-700" />
                  <span class="text-[11px] text-slate-400 truncate">{{ form.card2Name || 'Carte 2' }}</span>
                </div>
              </div>

              <div class="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                  {{ isSubmitting ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Ajouter') }}
                </button>
                <button
                  v-if="isEditing"
                  type="button"
                  @click="resetForm"
                  class="py-2.5 px-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Grille des archétypes -->
        <div class="lg:col-span-2">
          <div class="glass-panel p-6 rounded-2xl border border-slate-800">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-bold text-white">
                Archétypes {{ activeMeta ? `(${activeMeta.name})` : '' }} ({{ archetypesList?.length || 0 }})
              </h2>
              <button
                @click="refreshArchetypes()"
                class="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                Actualiser
              </button>
            </div>

            <div v-if="loadingArchetypes === 'pending'" class="py-12 text-center text-slate-500 text-sm">
              Chargement des archétypes...
            </div>

            <div v-else-if="!archetypesList || archetypesList.length === 0" class="py-12 text-center">
              <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400 mb-3 shadow-inner">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect width="14" height="18" x="3" y="3" rx="2" />
                  <path d="M7 3v18" />
                  <path d="M10 7.5h4" />
                </svg>
              </div>
              <p class="text-slate-400 text-sm">
                Aucun archétype enregistré pour la méta {{ activeMeta ? `« ${activeMeta.name} »` : 'actuelle' }}.
              </p>
              <p class="text-slate-500 text-xs mt-1">Créez votre deck ou les archétypes adverses pour ce format.</p>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="arch in archetypesList"
                :key="arch.id"
                class="glass-card p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group overflow-hidden relative"
              >
                <div>
                  <!-- Images des cartes clés -->
                  <div class="flex items-center gap-2 mb-3">
                    <!-- Carte 1 -->
                    <div class="w-14 h-20 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shadow flex items-center justify-center flex-shrink-0">
                      <img
                        v-if="arch.card1ImageUrl"
                        :src="arch.card1ImageUrl"
                        :alt="arch.card1Name || 'Carte 1'"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                      />
                      <span v-else class="text-xs font-bold text-slate-600">C1</span>
                    </div>

                    <!-- Carte 2 (si présente) -->
                    <div
                      v-if="arch.card2ImageUrl || arch.card2Name"
                      class="w-14 h-20 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shadow flex items-center justify-center flex-shrink-0"
                    >
                      <img
                        v-if="arch.card2ImageUrl"
                        :src="arch.card2ImageUrl"
                        :alt="arch.card2Name || 'Carte 2'"
                        class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                      />
                      <span v-else class="text-xs font-bold text-slate-600">C2</span>
                    </div>

                    <div class="ml-1 min-w-0 flex-1">
                      <h3 class="font-bold text-white text-base group-hover:text-emerald-400 transition truncate">
                        {{ arch.name }}
                      </h3>
                      <div class="text-xs text-slate-400 mt-1 space-y-0.5">
                        <p v-if="arch.card1Name" class="truncate">• {{ arch.card1Name }}</p>
                        <p v-if="arch.card2Name" class="truncate">• {{ arch.card2Name }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    @click="editArchetype(arch)"
                    class="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                  >
                    Modifier
                  </button>
                  <button
                    @click="archiveArchetype(arch)"
                    class="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 transition"
                  >
                    Archiver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <GameMetaModal
      :is-open="isGameMetaModalOpen"
      @close="isGameMetaModalOpen = false"
    />
  </div>
</template>
