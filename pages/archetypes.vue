<script setup lang="ts">
import type { Archetype, Game } from '~/server/database/schema'

definePageMeta({
  middleware: 'auth'
})

// Jeux disponibles
const { data: gamesList } = await useFetch<Game[]>('/api/games')
const selectedGameId = ref<number | null>(null)

// Initialiser le jeu sélectionné
watch(gamesList, (newGames) => {
  if (newGames && newGames.length > 0 && selectedGameId.value === null) {
    selectedGameId.value = newGames[0].id
  }
}, { immediate: true })

// Charger les archétypes pour le jeu sélectionné
const { data: archetypesList, refresh: refreshArchetypes, status: loadingArchetypes } = await useFetch<Archetype[]>('/api/archetypes', {
  query: computed(() => ({
    gameId: selectedGameId.value || undefined,
    includeArchived: false
  })),
  watch: [selectedGameId]
})

const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Formulaire
const form = reactive({
  id: null as number | null,
  name: '',
  card1Name: '',
  card1ImageUrl: '',
  card2Name: '',
  card2ImageUrl: ''
})

const isEditing = computed(() => form.id !== null)

const resetForm = () => {
  form.id = null
  form.name = ''
  form.card1Name = ''
  form.card1ImageUrl = ''
  form.card2Name = ''
  form.card2ImageUrl = ''
  errorMessage.value = null
}

const editArchetype = (arch: Archetype) => {
  form.id = arch.id
  form.name = arch.name
  form.card1Name = arch.card1Name || ''
  form.card1ImageUrl = arch.card1ImageUrl || ''
  form.card2Name = arch.card2Name || ''
  form.card2ImageUrl = arch.card2ImageUrl || ''
  errorMessage.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const submitForm = async () => {
  if (!selectedGameId.value) {
    errorMessage.value = 'Veuillez sélectionner un jeu TCG'
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
    if (isEditing.value) {
      await $fetch(`/api/archetypes/${form.id}`, {
        method: 'PUT',
        body: {
          name: form.name,
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
          gameId: selectedGameId.value,
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

const archiveArchetype = async (arch: Archetype) => {
  if (!confirm(`Archiver l'archétype "${arch.name}" ? Il ne sera plus proposé pour les nouveaux matchs.`)) {
    return
  }

  try {
    await $fetch(`/api/archetypes/${arch.id}`, { method: 'DELETE' })
    await refreshArchetypes()
  } catch (err: any) {
    alert(err?.data?.statusMessage || "Erreur lors de l'archivage")
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-white">Mes Archétypes & Decks</h1>
          <p class="text-slate-400 text-sm mt-1">
            Gérez vos decks personnels et les archétypes du metagame que vous affrontez.
          </p>
        </div>

        <!-- Sélecteur de Jeu -->
        <div class="flex items-center gap-3">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jeu :</label>
          <select
            v-model="selectedGameId"
            class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option v-for="g in gamesList" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Messages de feedback -->
      <div v-if="successMessage" class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
        <span>{{ successMessage }}</span>
        <button @click="successMessage = null" class="text-emerald-400">✕</button>
      </div>

      <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
        <span>{{ errorMessage }}</span>
        <button @click="errorMessage = null" class="text-red-400">✕</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Formulaire de création / édition -->
        <div class="lg:col-span-1">
          <div class="glass-panel p-6 rounded-2xl border border-slate-800 sticky top-24">
            <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              {{ isEditing ? "Modifier l'archétype" : 'Nouvel Archétype' }}
            </h2>

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
                Archétypes enregistrés ({{ archetypesList?.length || 0 }})
              </h2>
              <button
                @click="refreshArchetypes()"
                class="text-xs text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                Actualiser
              </button>
            </div>

            <div v-if="loadingArchetypes === 'pending'" class="py-12 text-center text-slate-500 text-sm">
              Chargement des archétypes...
            </div>

            <div v-else-if="!archetypesList || archetypesList.length === 0" class="py-12 text-center">
              <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-2xl mb-3">
                🃏
              </div>
              <p class="text-slate-400 text-sm">Aucun archétype enregistré pour ce jeu.</p>
              <p class="text-slate-500 text-xs mt-1">Créez votre deck ou les archétypes adverses pour commencer le suivi.</p>
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
  </div>
</template>
