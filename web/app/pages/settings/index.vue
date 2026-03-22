<script setup lang="ts">
import { navigateTo } from 'nuxt/app'

// Automatically redirect to the profile settings tab
navigateTo('/settings/profile', { replace: true })
</script>

<template>
  <div></div>
</template>
