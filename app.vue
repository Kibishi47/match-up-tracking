<script setup lang="ts">
import AppToastContainer from '~/components/ui/AppToastContainer.vue'
import AppConfirmModal from '~/components/ui/AppConfirmModal.vue'
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <!-- Modale de confirmation globale & Container de Toasts -->
    <AppConfirmModal />
    <AppToastContainer />
  </div>
</template>
