<template>
  <v-container class="py-8 px-8 max-width-container" fluid>
    <v-row>
      <v-col cols="12" md="10" lg="8" class="mx-auto">
        <v-card class="pa-8 mb-6" border variant="flat">
          <div class="d-flex align-center gap-4 mb-6">
            <v-avatar size="64" color="primary" rounded>
              <v-icon size="40" icon="mdi-draw" color="white"></v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h3 font-weight-bold text-white mb-1">August Mark</h1>
              <div class="text-subtitle-1 text-primary font-weight-medium">Version {{ appVersion }}</div>
            </div>
          </div>

          <v-card-text class="px-0 text-body-1 text-medium-emphasis">
            <p class="mb-4">
              <strong>August Mark</strong> is a professional offline-first screen annotation and markup desktop application designed for designers, developers, and QA engineers. It streamlines bug reporting and layout feedback by letting you capture, draw annotations, and export complete reports instantly.
            </p>
            <p class="mb-6">
              This application is built using a state-of-the-art stack: <strong>Tauri 2</strong> for the native window management shell, <strong>Rust</strong> for fast and secure background processing, <strong>Vue 3 + Vuetify 3</strong> for the user interface, and <strong>SQLite</strong> for structured local data persistence.
            </p>

            <v-divider class="my-6"></v-divider>

            <h3 class="text-h6 font-weight-bold text-white mb-4">Application Statistics</h3>
            <v-row>
              <v-col cols="12" sm="4" v-for="stat in statCards" :key="stat.title">
                <v-card border variant="flat" class="pa-4 bg-surface-variant d-flex align-center gap-3">
                  <v-avatar size="40" :color="stat.color" rounded>
                    <v-icon :icon="stat.icon" color="white"></v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-caption text-medium-emphasis">{{ stat.title }}</div>
                    <div class="text-h5 font-weight-bold text-white">{{ stat.value }}</div>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <h3 class="text-h6 font-weight-bold text-white mb-4">Tech Stack & Credits</h3>
            <div class="d-flex flex-wrap gap-2">
              <v-chip variant="outlined" color="primary">Tauri 2.0</v-chip>
              <v-chip variant="outlined" color="secondary">Rust 1.77+</v-chip>
              <v-chip variant="outlined" color="info">Vue 3.0</v-chip>
              <v-chip variant="outlined" color="warning">Vuetify 3.0</v-chip>
              <v-chip variant="outlined" color="error">SQLite 3</v-chip>
              <v-chip variant="outlined" color="medium-emphasis">TypeScript 5</v-chip>
            </div>
          </v-card-text>

          <v-card-actions class="px-0 pt-6">
            <v-btn color="primary" variant="elevated" to="/" prepend-icon="mdi-arrow-left" class="text-none px-6">
              Back to Dashboard
            </v-btn>
            <v-btn color="medium-emphasis" variant="text" to="/settings" prepend-icon="mdi-cog" class="text-none px-4">
              Open Settings
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'

const appVersion = ref('Loading...')
const stats = ref({
  projects: 0,
  sessions: 0,
  issues: 0
})

const statCards = computed(() => [
  { title: 'Projects', value: stats.value.projects, icon: 'mdi-folder', color: 'primary' },
  { title: 'Sessions', value: stats.value.sessions, icon: 'mdi-clipboard-list', color: 'secondary' },
  { title: 'Issues Logged', value: stats.value.issues, icon: 'mdi-alert-circle', color: 'error' }
])

onMounted(async () => {
  try {
    appVersion.value = await getVersion()
  } catch (e) {
    appVersion.value = '0.1.1'
  }

  try {
    const appStats = await invoke<any>('get_app_stats')
    stats.value.projects = appStats.projectCount
    stats.value.sessions = appStats.sessionCount
    stats.value.issues = appStats.issueCount
  } catch (e) {
    console.error('Failed to load app stats:', e)
  }
})
</script>

<style scoped>
.max-width-container {
  max-width: 1000px;
  margin: 0 auto;
}
.gap-3 {
  gap: 12px;
}
.gap-4 {
  gap: 16px;
}
</style>
