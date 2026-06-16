<template>
  <v-sheet
    color="background"
    class="d-flex align-center justify-space-between px-6 py-3 border-bottom"
    flat
  >
    <div class="d-flex align-center gap-2">
      <!-- Active Project Info -->
      <v-icon
        icon="mdi-folder-outline"
        :color="activeProject?.color || 'primary'"
        class="mr-1"
      ></v-icon>
      <span class="text-subtitle-1 font-weight-bold text-white">
        {{ activeProject ? activeProject.name : 'No Active Project' }}
      </span>
      <v-chip
        v-if="activeSessionsCount > 0"
        color="secondary"
        size="x-small"
        class="ml-2 font-weight-bold"
        variant="flat"
      >
        {{ activeSessionsCount }} Active
      </v-chip>
    </div>

    <!-- Hotkey hint / Action area -->
    <div class="d-flex align-center gap-4">
      <div class="d-flex align-center text-caption text-medium-emphasis bg-surface px-3 py-1 rounded border">
        <v-icon size="14" class="mr-1" color="primary">mdi-keyboard</v-icon>
        <span class="mr-1">Trigger Capture:</span>
        <kbd class="kbd-key mr-1">Middle Click</kbd> or <kbd class="kbd-key ml-1">Ctrl + Shift + M</kbd>
      </div>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/projectStore'
import { useSessionStore } from '@/stores/sessionStore'

const projectStore = useProjectStore()
const { activeProject } = storeToRefs(projectStore)

const sessionStore = useSessionStore()
const { sessions } = storeToRefs(sessionStore)

const activeSessionsCount = computed(() => {
  return sessions.value.filter(s => s.status === 'active').length
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.gap-4 {
  gap: 16px;
}
.border-bottom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}
.kbd-key {
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 3px;
  color: #fff;
  font-family: monospace;
  font-size: 0.8rem;
  padding: 1px 5px;
}
</style>
