<template>
  <v-app>
    <!-- Left Navigation Drawer -->
    <AppSidebar />

    <v-main>
      <router-view />
    </v-main>

    <!-- Global Snackbar for Toasts -->
    <v-snackbar
      v-model="uiStore.toastVisible"
      :color="toastColor"
      location="bottom right"
      :timeout="-1"
      class="mb-4 mr-4"
    >
      <div class="d-flex align-center gap-2">
        <v-icon :icon="toastIcon" size="small"></v-icon>
        <span>{{ uiStore.toastMessage }}</span>
      </div>
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" size="small" @click="uiStore.hideToast"></v-btn>
      </template>
    </v-snackbar>

    <!-- Global Loading Overlay -->
    <v-overlay
      v-model="uiStore.isLoading"
      class="align-center justify-center"
      persistent
      scrim="#000000"
      opacity="0.5"
      z-index="9999"
    >
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </v-overlay>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import { useTauriEvents } from '@/composables/useTauriEvents'
import { useUiStore } from '@/stores/uiStore'

const uiStore = useUiStore()

// Initialize Tauri event listeners globally for the main window
useTauriEvents()

const toastColor = computed(() => {
  switch (uiStore.toastType) {
    case 'success': return 'success'
    case 'error': return 'error'
    case 'info': return 'info'
    default: return 'info'
  }
})

const toastIcon = computed(() => {
  switch (uiStore.toastType) {
    case 'success': return 'mdi-check-circle'
    case 'error': return 'mdi-alert-circle'
    case 'info': return 'mdi-information'
    default: return 'mdi-information'
  }
})
</script>

<style>
html, body {
  background-color: #0F1117;
  overflow-y: auto !important;
}
.gap-2 {
  gap: 8px;
}
</style>
