<script setup lang="ts">
import type { Archetype } from '~/server/db/schema'

const props = defineProps<{
  isOpen: boolean
  myArchetype: Archetype | null
  opponentArchetype: Archetype | null
  initialNotes?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', newNotes: string): void
}>()

const notesText = ref('')
const isSaving = ref(false)
const hasJustSaved = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const { toast } = useNotify()

// Initialiser le contenu dès l'ouverture
watch(() => props.isOpen, (open) => {
  if (open) {
    notesText.value = props.initialNotes || ''
    hasJustSaved.value = false
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
})

watch(() => props.initialNotes, (newVal) => {
  if (props.isOpen && newVal !== undefined) {
    notesText.value = newVal
  }
})

// Sauvegarde de la note
const saveNotes = async () => {
  if (!props.myArchetype || !props.opponentArchetype) {
    toast.error('Archétypes manquants pour enregistrer la note.')
    return
  }

  isSaving.value = true
  try {
    const res = await $fetch<{ success: boolean; notes: string }>('/api/matchups/notes', {
      method: 'PUT',
      body: {
        myArchetypeId: props.myArchetype.id,
        opponentArchetypeId: props.opponentArchetype.id,
        notes: notesText.value
      }
    })

    hasJustSaved.value = true
    emit('saved', res.notes)
    setTimeout(() => {
      hasJustSaved.value = false
    }, 2500)
  } catch (err: any) {
    toast.error(err?.data?.statusMessage || err?.message || 'Erreur lors de la sauvegarde des notes')
  } finally {
    isSaving.value = false
  }
}

// Auto-save au blur
const handleBlur = () => {
  if (notesText.value !== (props.initialNotes || '')) {
    saveNotes()
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
        class="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- En-tête : Duel & Archétypes -->
        <div class="px-6 py-5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm flex-shrink-0">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>Notes de Matchup</span>
              </h3>
              <!-- Contexte des decks -->
              <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span class="text-emerald-400 font-semibold truncate max-w-[140px]" :title="myArchetype?.name">
                  {{ myArchetype?.name || 'Mon Deck' }}
                </span>
                <span class="text-slate-500 font-bold">vs</span>
                <span class="text-indigo-400 font-semibold truncate max-w-[140px]" :title="opponentArchetype?.name">
                  {{ opponentArchetype?.name || 'Adversaire' }}
                </span>
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

        <!-- Corps : Textarea & Conseils -->
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400 font-medium">Plan de jeu, mulligans & conseils tactiques :</span>
            <span v-if="hasJustSaved" class="text-emerald-400 font-bold animate-pulse flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Enregistré !
            </span>
            <span v-else-if="isSaving" class="text-indigo-400 font-medium animate-pulse">
              Sauvegarde en cours...
            </span>
          </div>

          <div class="relative">
            <textarea
              ref="textareaRef"
              v-model="notesText"
              rows="6"
              maxlength="2000"
              @blur="handleBlur"
              placeholder="Ex: Garder l'accélérateur en main de départ. Attention à son tour 4 létal. Ne pas trop over-extend sur le board..."
              class="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 shadow-inner resize-y transition"
            ></textarea>
          </div>

          <p class="text-[11px] text-slate-500 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Ces notes sont partagées par tous vos matchs entre ce deck et cet adversaire. Sauvegarde auto au clic en dehors.</span>
          </p>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Fermer
          </button>

          <button
            type="button"
            @click="saveNotes"
            :disabled="isSaving"
            class="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs transition disabled:opacity-50 shadow-md shadow-amber-950/40 flex items-center gap-2 cursor-pointer"
          >
            <svg v-if="!isSaving" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span v-if="isSaving">Sauvegarde...</span>
            <span v-else>Sauvegarder</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
