<script setup lang="ts">
import { useUserStore } from '~/stores/user'

const userStore = useUserStore()

// Disable default layout for this page since we handle it manually
definePageMeta({ layout: false })
</script>

<template>
  <div class="w-full h-full">
    <template v-if="userStore.isLoggedIn">
      <NuxtLayout name="default">
        <AppHomeTimeline />
      </NuxtLayout>
    </template>
    <template v-else>
      <AppWelcome />
    </template>
  </div>
</template>
