<script setup lang="ts">
import type { Match, Archetype } from '~/server/db/schema'

interface MatchWithRelations extends Match {
  myArchetype?: Archetype
  opponentArchetype?: Archetype
}

const props = defineProps<{
  match: MatchWithRelations | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', match: Match): void
}>()

const result = ref<'win' | 'loss' | 'draw'>('win')
const notes = ref('')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)

watch(() => props.match, (newMatch) => {
  if (newMatch) {
    result.value = newMatch.result
    notes.value = newMatch.notes || ''
    errorMessage.value = null
  }
}, { immediate: true })

const saveMatch = async () => {
  if (!props.match) return
  isSubmitting.value = true
  errorMessage.value = null

  try {
    const updated = await $fetch<Match>(`/api/matches/${props.match.id}`, {
      method: 'PUT',
      body: {
        result: result.value,
        notes: notes.value
      }
    })
    emit('updated', updated)
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.data?.statusMessage || 'Erreur lors de la mise à jour'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="match" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-white">Modifier le Match</h3>
        <button @click="emit('close')" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
      </div>

      <div class="mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-sm">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Deck : <strong class="text-white">{{ match.myArchetype?.name || 'Mon Deck' }}</strong></span>
          <span>vs</span>
          <span>Adversaire : <strong class="text-white">{{ match.opponentArchetype?.name || 'Adversaire' }}</strong></span>
        </div>
      </div>

      <form @submit.prevent="saveMatch" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Résultat
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="result = 'win'"
              :class="[
                'py-2.5 rounded-xl font-bold text-xs sm:text-sm transition border flex items-center justify-center gap-1',
                result === 'win'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              ]"
            >
              <span>Victoire</span>
            </button>

            <button
              type="button"
              @click="result = 'loss'"
              :class="[
                'py-2.5 rounded-xl font-bold text-xs sm:text-sm transition border flex items-center justify-center gap-1',
                result === 'loss'
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              ]"
            >
              <span>Défaite</span>
            </button>

            <button
              type="button"
              @click="result = 'draw'"
              :class="[
                'py-2.5 rounded-xl font-bold text-xs sm:text-sm transition border flex items-center justify-center gap-1',
                result === 'draw'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              ]"
            >
              <span>Nul</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Notes / Détails de partie (optionnel)
          </label>
          <textarea
            v-model="notes"
            rows="3"
            placeholder="Ex: Main de départ parfaite, mauvaise sortie adverse, carte clé jouée au tour 4..."
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm resize-none"
          />
        </div>

        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {{ errorMessage }}
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white bg-slate-800 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
