<script setup lang="ts">
import type { Meta } from '~/server/db/schema'

const props = defineProps<{
  isOpen: boolean
  gameId: string | null
  gameName?: string
  sourceMetaId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created', meta: Meta): void
}>()

const metaName = ref('')
const isSubmitting = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const { toast } = useNotify()

watch(() => props.isOpen, (open) => {
  if (open) {
    metaName.value = ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

const handleCreate = async () => {
  const trimmed = metaName.value.trim()
  if (!trimmed) {
    toast.warning('Veuillez saisir un nom pour la méta.')
    return
  }

  if (!props.gameId) {
    toast.error('Aucun jeu sélectionné.')
    return
  }

  isSubmitting.value = true
  try {
    const newMeta = await $fetch<Meta>('/api/metas', {
      method: 'POST',
      body: {
        gameId: props.gameId,
        name: trimmed,
        sourceMetaId: props.sourceMetaId || undefined
      }
    })

    toast.success(`Méta "${trimmed}" créée avec succès (archétypes dupliqués) !`)
    emit('created', newMeta)
    emit('close')
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || err?.message || 'Erreur lors de la création de la méta')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto p-4 flex min-h-full items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      @click.self="emit('close')"
    >
      <div
        class="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 my-auto"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Nouvelle Méta / Format
            </h3>
            <p v-if="gameName" class="text-xs text-slate-400 mt-0.5">
              Jeu : <span class="text-emerald-400 font-medium">{{ gameName }}</span>
            </p>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleCreate" class="mt-5 space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Nom de la méta ou du set *
            </label>
            <input
              ref="inputRef"
              v-model="metaName"
              type="text"
              required
              maxlength="100"
              placeholder="Ex: OP-07, Set 1 - Origin, Format Standard 2026..."
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm shadow-inner"
            />
            <p class="text-[11px] text-slate-500 mt-1">
              Permet de regrouper vos archétypes et statistiques par extension ou saison compétitive.
            </p>
            <div class="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
              <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>Tous vos archétypes existants seront automatiquement dupliqués dans ce nouveau format.</span>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              @click="emit('close')"
              class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="isSubmitting || !metaName.trim()"
              class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50 shadow-md shadow-emerald-950/40 cursor-pointer flex items-center gap-1.5"
            >
              <span v-if="isSubmitting">Création...</span>
              <span v-else>Créer la méta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
