<template>
  <v-app>
    <!-- Left Navigation Drawer -->
    <AppSidebar />

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/common/AppSidebar.vue'
import { useTauriEvents } from '@/composables/useTauriEvents'

// Initialize Tauri event listeners globally for the main window
useTauriEvents()
</script>

<style>
html, body {
  background-color: #0F1117;
  overflow-y: auto !important;
}
</style>
