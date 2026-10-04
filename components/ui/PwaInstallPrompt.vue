<script setup lang="ts">
import { Download, X, Share, PlusSquare, Sparkles, RefreshCw } from 'lucide-vue-next'

const { $pwa } = useNuxtApp()
const { t } = useI18n()

const {
  isStandalone,
  canInstall,
  isIos,
  showIosGuide,
  isDismissed,
  init,
  install: handleInstall,
  dismiss: handleDismiss
} = usePwaInstall()

onMounted(() => {
  init()
})

const shouldShowBanner = computed(() => {
  if (isStandalone.value) return false
  if (isDismissed.value) return false
  return canInstall.value || isIos.value
})

const handleReloadApp = () => {
  if ($pwa?.updateServiceWorker) {
    $pwa.updateServiceWorker()
  } else {
    window.location.reload()
  }
}
</script>

<template>
  <div class="pointer-events-none">
    <!-- 1. Toast de Mise à jour disponible (Workbox PWA Update) -->
    <Transition
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in transform"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <aside
        v-if="$pwa?.needRefresh"
        aria-label="Mise à jour disponible"
        class="pointer-events-auto fixed top-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] p-4 rounded-2xl bg-slate-900/95 text-white border border-emerald-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <RefreshCw class="w-5 h-5 animate-spin" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-white truncate">
              {{ t('pwa.update_available') }}
            </p>
            <p class="text-xs text-slate-300">
              {{ t('pwa.app_ready_offline') }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
          @click="handleReloadApp"
        >
          {{ t('pwa.reload') }}
        </button>
      </aside>
    </Transition>

    <!-- 2. Bannière d'installation PWA (Flottante, non intrusive) -->
    <Transition
      enter-active-class="transition duration-400 ease-out transform"
      enter-from-class="opacity-0 translate-y-8 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in transform"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-8 scale-95"
    >
      <aside
        v-if="shouldShowBanner"
        aria-label="Installation de l'application Metadex"
        class="pointer-events-auto fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-40 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl backdrop-blur-xl transition-all"
      >
        <div class="flex items-start gap-3.5">
          <!-- Icône Metadex -->
          <div class="relative shrink-0">
            <img
              src="/pwa-192x192.png"
              alt="Metadex Icon"
              class="w-12 h-12 rounded-xl shadow-md border border-slate-200 dark:border-slate-700/80 object-cover"
            />
            <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow">
              <Sparkles class="w-3 h-3" />
            </div>
          </div>

          <!-- Contenu texte -->
          <div class="flex-1 min-w-0 pr-6">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {{ t('pwa.install_title') }}
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {{ t('pwa.install_desc') }}
            </p>

            <div class="flex items-center gap-2 mt-3">
              <button
                type="button"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/20 transition-all active:scale-95"
                @click="handleInstall"
              >
                <Download class="w-3.5 h-3.5" />
                <span>{{ t('pwa.install_btn') }}</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                @click="handleDismiss"
              >
                {{ t('pwa.dismiss') }}
              </button>
            </div>
          </div>

          <!-- Bouton Fermer -->
          <button
            type="button"
            class="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
            :title="t('common.close')"
            @click="handleDismiss"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </aside>
    </Transition>

    <!-- 3. Modal / Fiche explicative d'installation pour iOS -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showIosGuide"
        class="pointer-events-auto fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        @click.self="showIosGuide = false"
      >
        <div
          class="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl space-y-4"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img src="/pwa-192x192.png" alt="Metadex" class="w-10 h-10 rounded-xl" />
              <div>
                <h3 class="font-bold text-base text-white">
                  {{ t('pwa.ios_instruction_title') }}
                </h3>
                <p class="text-xs text-slate-400">Safari iOS</p>
              </div>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              @click="showIosGuide = false"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-3 pt-2 text-sm text-slate-300">
            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Share class="w-4 h-4" />
              </div>
              <p class="text-xs leading-relaxed self-center">
                1. {{ t('pwa.ios_instruction_step1') }}
              </p>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <PlusSquare class="w-4 h-4" />
              </div>
              <p class="text-xs leading-relaxed self-center">
                2. {{ t('pwa.ios_instruction_step2') }}
              </p>
            </div>

            <div class="flex items-start gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <div class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles class="w-4 h-4" />
              </div>
              <p class="text-xs leading-relaxed self-center">
                3. {{ t('pwa.ios_instruction_step3') }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            @click="showIosGuide = false"
          >
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
