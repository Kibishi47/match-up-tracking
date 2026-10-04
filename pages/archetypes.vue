<script setup lang="ts">
import type { Archetype, Meta } from '~/server/db/schema'
import GameMetaModal from '~/components/modal/GameMetaModal.vue'
import ArchetypeModal from '~/components/modal/ArchetypeModal.vue'

definePageMeta({
  middleware: 'auth'
})

const isGameMetaModalOpen = ref(false)
const isArchetypeModalOpen = ref(false)
const selectedArchetypeToEdit = ref<Archetype | null>(null)
const searchQuery = ref('')

// Utiliser la session de jeu partagée (synchronisée avec le Header)
const { activeGame, activeGameId, isSessionReady } = useGameSession()

// Utiliser la session de méta active
const { metas, activeMeta, activeMetaId, refreshMetas, setActiveMeta } = useMetaSession()

// Charger les archétypes pour le jeu et la méta sélectionnés sans bloquer le rendu initial
const { data: archetypesList, refresh: refreshArchetypes, status: loadingArchetypes } = useLazyFetch<Archetype[]>('/api/archetypes', {
  key: 'archetypes-list',
  query: computed(() => ({
    gameId: activeGameId.value || undefined,
    metaId: activeMetaId.value || undefined,
    includeArchived: false
  })),
  watch: [activeGameId, activeMetaId]
})

const isLoading = computed(() => {
  return !isSessionReady.value || (loadingArchetypes.value === 'pending' && !archetypesList.value)
})

const { toast, confirmAction } = useNotify()
const { t } = useI18n()

const openCreateModal = () => {
  if (!activeGameId.value || !activeMetaId.value) {
    isGameMetaModalOpen.value = true
    return
  }
  selectedArchetypeToEdit.value = null
  isArchetypeModalOpen.value = true
}

const openEditModal = (arch: Archetype) => {
  selectedArchetypeToEdit.value = arch
  isArchetypeModalOpen.value = true
}

const handleArchetypeSaved = async () => {
  await refreshArchetypes()
}

// Filtrage instantané des archétypes par nom et cartes clés
const filteredArchetypes = computed(() => {
  const list = archetypesList.value || []
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter((arch) => {
    const nameMatch = arch.name.toLowerCase().includes(q)
    const card1Match = arch.card1Name?.toLowerCase().includes(q) || false
    const card2Match = arch.card2Name?.toLowerCase().includes(q) || false
    return nameMatch || card1Match || card2Match
  })
})

const archiveArchetype = async (arch: Archetype) => {
  const confirmed = await confirmAction({
    title: t('archetypes_page.archive_confirm_title', { name: arch.name }),
    message: t('archetypes_page.archive_confirm_msg'),
    confirmText: t('archetypes_page.archive'),
    isDestructive: false
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/archetypes/${arch.id}`, { method: 'DELETE' })
    toast.success(t('archetypes_page.archived_success', { name: arch.name }))
    await refreshArchetypes()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || "Error")
  }
}

const deleteArchetype = async (arch: Archetype) => {
  const confirmed = await confirmAction({
    title: t('archetypes_page.delete_confirm_title', { name: arch.name }),
    message: t('archetypes_page.delete_confirm_msg'),
    confirmText: t('common.delete'),
    isDestructive: true
  })
  if (!confirmed) return

  try {
    await $fetch(`/api/archetypes/${arch.id}?force=true`, { method: 'DELETE' })
    toast.success(t('archetypes_page.deleted_success', { name: arch.name }))
    await refreshArchetypes()
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || 'Error')
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 pb-28 transition-colors">
    <AppHeader />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 space-y-6">
      <!-- En-tête de la page -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {{ $t('archetypes_page.title') }}
            </h1>
            <span
              v-if="activeGame"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              {{ activeGame.name }}
            </span>
            <span
              v-if="activeMeta"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
            >
              {{ activeMeta.name }}
            </span>
          </div>
          <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            {{ $t('archetypes_page.subtitle') }}
          </p>
        </div>

        <!-- Actions globales : Nouvel archétype & Actualiser -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            @click="openCreateModal"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{{ $t('archetypes_page.new_archetype') }}</span>
          </button>

          <button
            type="button"
            @click="refreshArchetypes()"
            class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            :title="$t('nav.refresh')"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span class="hidden sm:inline">{{ $t('nav.refresh') }}</span>
          </button>
        </div>
      </div>

      <!-- État bloqué : aucun jeu ou aucune méta active -->
      <div
        v-if="!activeGameId || !activeMetaId"
        class="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center space-y-4 max-w-md mx-auto shadow-sm my-12"
      >
        <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="20" height="12" x="2" y="6" rx="6" />
            <path d="M6 12h4m-2-2v4m9-2h.01m3 0h.01" />
          </svg>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('archetypes_page.no_game_meta_title') }}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {{ $t('archetypes_page.no_game_meta_desc') }}
          </p>
        </div>
        <button
          type="button"
          @click="isGameMetaModalOpen = true"
          class="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{{ $t('archetypes_page.choose_game_format') }}</span>
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14m-7-7 7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Contenu principal : Barre de recherche + Grille des Archétypes pleine largeur -->
      <div v-else class="space-y-4">
        <!-- Barre de recherche instantanée & compteur -->
        <div class="glass-panel p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-md">
            <svg
              class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="$t('archetypes_page.search_placeholder')"
              class="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              :title="$t('common.cancel')"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
            <span>{{ $t('archetypes_page.archetypes_count', { count: filteredArchetypes.length }, filteredArchetypes.length) }}</span>
            <span v-if="searchQuery" class="text-emerald-600 dark:text-emerald-400">
              {{ $t('archetypes_page.filtered_on', { total: archetypesList?.length || 0 }) }}
            </span>
          </div>
        </div>

        <!-- Chargement Skeleton (8 cartes) -->
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ArchetypeCardSkeleton v-for="i in 8" :key="i" />
        </div>

        <!-- Aucun archétype du tout pour ce format -->
        <div
          v-else-if="!archetypesList || archetypesList.length === 0"
          class="glass-panel p-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center shadow-sm"
        >
          <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 mb-3 shadow-inner">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="18" x="3" y="3" rx="2" />
              <path d="M7 3v18" />
              <path d="M10 7.5h4" />
            </svg>
          </div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('archetypes_page.no_archetypes_registered') }}</h3>
          <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            {{ $t('archetypes_page.no_archetypes_registered_desc') }}
          </p>
          <button
            type="button"
            @click="openCreateModal"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
          >
            <span>+ {{ $t('archetypes_page.create_first_archetype') }}</span>
          </button>
        </div>

        <!-- Aucun résultat de recherche -->
        <div
          v-else-if="filteredArchetypes.length === 0"
          class="glass-panel p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center shadow-sm"
        >
          <p class="text-slate-600 dark:text-slate-300 text-sm font-semibold">
            {{ $t('archetypes_page.no_search_results', { query: searchQuery }) }}
          </p>
          <button
            type="button"
            @click="searchQuery = ''"
            class="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {{ $t('archetypes_page.reset_filter') }}
          </button>
        </div>

        <!-- Grille Responsive des Archétypes -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="arch in filteredArchetypes"
            :key="arch.id"
            class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 transition flex flex-col justify-between group overflow-hidden relative shadow-sm hover:shadow-md"
          >
            <div>
              <!-- Images des cartes clés : Éventail si 2 cartes, Carte droite si 1 seule -->
              <div class="flex items-start gap-3 mb-3">
                <!-- Éventail de 2 cartes -->
                <div v-if="arch.card2ImageUrl || arch.card2Name" class="relative w-14 h-16 flex-shrink-0">
                  <!-- Carte 1 (Arrière / Inclinée gauche) -->
                  <div class="absolute left-0 top-1 w-10 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transform -rotate-6 group-hover:-rotate-12 transition-transform duration-300 flex items-center justify-center">
                    <img
                      v-if="arch.card1ImageUrl"
                      :src="arch.card1ImageUrl"
                      :alt="arch.card1Name || $t('common.card_1')"
                      class="w-full h-full object-cover"
                      @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                    />
                    <span v-else class="text-[10px] font-bold text-slate-400 dark:text-slate-600">C1</span>
                  </div>

                  <!-- Carte 2 (Avant / Inclinée droite) -->
                  <div class="absolute left-3.5 top-0.5 w-10 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md transform rotate-6 group-hover:rotate-12 transition-transform duration-300 flex items-center justify-center">
                    <img
                      v-if="arch.card2ImageUrl"
                      :src="arch.card2ImageUrl"
                      :alt="arch.card2Name || $t('common.card_2')"
                      class="w-full h-full object-cover"
                      @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                    />
                    <span v-else class="text-[10px] font-bold text-slate-400 dark:text-slate-600">C2</span>
                  </div>
                </div>

                <!-- 1 seule carte droite -->
                <div v-else class="w-12 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                  <img
                    v-if="arch.card1ImageUrl"
                    :src="arch.card1ImageUrl"
                    :alt="arch.card1Name || $t('common.card_1')"
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    @error="(e) => (e.target as HTMLElement).style.display = 'none'"
                  />
                  <span v-else class="text-xs font-bold text-slate-400 dark:text-slate-600">C1</span>
                </div>

                <div class="min-w-0 flex-1">
                  <h3 class="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate" :title="arch.name">
                    {{ arch.name }}
                  </h3>
                  <p v-if="arch.card1Name || arch.card2Name" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" :title="[arch.card1Name, arch.card2Name].filter(Boolean).join(' // ')">
                    {{ [arch.card1Name, arch.card2Name].filter(Boolean).join(' // ') }}
                  </p>
                </div>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-1.5 flex-wrap">
              <button
                type="button"
                @click="openEditModal(arch)"
                class="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {{ $t('archetypes_page.modify') }}
              </button>
              <button
                type="button"
                @click="archiveArchetype(arch)"
                class="px-2.5 py-1 rounded-lg text-xs font-medium text-amber-600 dark:text-amber-400/80 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 transition cursor-pointer"
                :title="$t('archetypes_page.archive')"
              >
                {{ $t('archetypes_page.archive') }}
              </button>
              <button
                type="button"
                @click="deleteArchetype(arch)"
                class="px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 dark:text-red-400/80 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
                :title="$t('common.delete')"
              >
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modale de configuration Jeu & Méta -->
    <GameMetaModal
      :is-open="isGameMetaModalOpen"
      @close="isGameMetaModalOpen = false"
    />

    <!-- Modale & Bottom Sheet Responsive Création / Édition d'Archétype -->
    <ArchetypeModal
      :is-open="isArchetypeModalOpen"
      :game-id="activeGameId"
      :meta-id="activeMetaId"
      :meta-name="activeMeta?.name"
      :archetype="selectedArchetypeToEdit"
      @close="isArchetypeModalOpen = false"
      @saved="handleArchetypeSaved"
    />
  </div>
</template>
