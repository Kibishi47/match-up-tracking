<script setup lang="ts">
import AppToastContainer from '~/components/ui/AppToastContainer.vue'
import AppConfirmModal from '~/components/ui/AppConfirmModal.vue'
import BottomNav from '~/components/layout/BottomNav.vue'
import PwaInstallPrompt from '~/components/ui/PwaInstallPrompt.vue'
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
    <VitePwaManifest />
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <!-- Navigation mobile basse fixe -->
    <BottomNav />

    <!-- Modale de confirmation globale & Container de Toasts -->
    <AppConfirmModal />
    <AppToastContainer />

    <!-- Bannière & invite d'installation PWA -->
    <PwaInstallPrompt />
  </div>
</template>
