<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <OpponentCardSkeleton v-for="i in 8" :key="i" />
  </div>
</template>
