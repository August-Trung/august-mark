<template>
  <v-container class="py-6 px-8 max-width-container" fluid>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold text-white mb-1">Settings</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Configure August Mark to match your workflow</p>
      </div>
      <v-chip color="success" variant="outlined" prepend-icon="mdi-cloud-check" size="small">
        Settings saved automatically
      </v-chip>
    </div>

    <v-row>
      <v-col cols="12" md="4" lg="3">
        <v-card class="mb-4" border variant="flat">
          <v-tabs v-model="activeTab" direction="vertical" color="primary">
            <v-tab value="general" prepend-icon="mdi-cog">General</v-tab>
            <v-tab value="capture" prepend-icon="mdi-camera">Capture & Hotkeys</v-tab>
            <v-tab value="info" prepend-icon="mdi-information">System Info</v-tab>
          </v-tabs>
        </v-card>
      </v-col>

      <v-col cols="12" md="8" lg="9">
        <v-window v-model="activeTab">
          <!-- General Tab -->
          <v-window-item value="general">
            <v-card border variant="flat" class="pa-6">
              <h2 class="text-h5 font-weight-bold text-primary mb-6">General Preferences</h2>
              
              <!-- Theme Selection -->
              <div class="mb-6">
                <div class="text-subtitle-1 font-weight-bold mb-1">Interface Theme</div>
                <div class="text-body-2 text-medium-emphasis mb-3">Choose how August Mark looks on your screen</div>
                <v-radio-group v-model="settingsStore.theme" inline class="theme-radios">
                  <v-radio label="August Dark" value="dark" class="mr-4"></v-radio>
                  <v-radio label="August Light" value="light" class="mr-4"></v-radio>
                  <v-radio label="System Default" value="system"></v-radio>
                </v-radio-group>
              </div>

              <v-divider class="my-6"></v-divider>

              <!-- Language Selection -->
              <div class="mb-6">
                <div class="text-subtitle-1 font-weight-bold mb-1">Display Language</div>
                <div class="text-body-2 text-medium-emphasis mb-3">Select your preferred user interface language</div>
                <v-select
                  v-model="selectedLanguage"
                  :items="languages"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  max-width="300"
                ></v-select>
              </div>

              <v-divider class="my-6"></v-divider>

              <!-- Default Project -->
              <div>
                <div class="text-subtitle-1 font-weight-bold mb-1">Default Project</div>
                <div class="text-body-2 text-medium-emphasis mb-3">Select the default project for new sessions</div>
                <v-select
                  v-model="settingsStore.defaultProjectId"
                  :items="projects"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="comfortable"
                  max-width="400"
                  :loading="projectStore.isLoading"
                ></v-select>
              </div>
            </v-card>
          </v-window-item>

          <!-- Capture & Hotkeys Tab -->
          <v-window-item value="capture">
            <v-card border variant="flat" class="pa-6">
              <h2 class="text-h5 font-weight-bold text-primary mb-6">Capture & Trigger Options</h2>

              <!-- Delayed Capture -->
              <div class="mb-6">
                <div class="text-subtitle-1 font-weight-bold mb-1">Delayed Capture Timer</div>
                <div class="text-body-2 text-medium-emphasis mb-3">Set a delay timer to capture tooltips, menus, or transient UI states</div>
                <v-select
                  v-model="delayedCapture"
                  :items="delayOptions"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  max-width="300"
                ></v-select>
              </div>

              <v-divider class="my-6"></v-divider>

              <!-- Image Quality -->
              <div class="mb-6">
                <div class="text-subtitle-1 font-weight-bold mb-1">Screenshot Quality ({{ settingsStore.screenshotQuality }}%)</div>
                <div class="text-body-2 text-medium-emphasis mb-3">Adjust the JPEG/PNG export image compression level</div>
                <div class="d-flex align-center gap-4">
                  <v-slider
                    v-model="settingsStore.screenshotQuality"
                    :min="50"
                    :max="100"
                    :step="5"
                    color="primary"
                    track-color="surface-variant"
                    hide-details
                  ></v-slider>
                </div>
              </div>

              <v-divider class="my-6"></v-divider>

              <!-- Mouse Hold Duration -->
              <div class="mb-6">
                <div class="text-subtitle-1 font-weight-bold mb-1">Middle Mouse Trigger Duration ({{ settingsStore.holdDurationMs }}ms)</div>
                <div class="text-body-2 text-medium-emphasis mb-3">Time required to hold middle click to activate screen capture</div>
                <v-slider
                  v-model="settingsStore.holdDurationMs"
                  :min="500"
                  :max="2000"
                  :step="100"
                  color="primary"
                  track-color="surface-variant"
                  hide-details
                ></v-slider>
              </div>

              <v-divider class="my-6"></v-divider>

              <!-- Minimize to Tray -->
              <div>
                <div class="text-subtitle-1 font-weight-bold mb-1">Minimize to System Tray</div>
                <div class="text-body-2 text-medium-emphasis mb-3">Hide the main window in the system tray instead of closing it completely</div>
                <v-switch
                  v-model="settingsStore.minimizeToTray"
                  color="primary"
                  inset
                  hide-details
                ></v-switch>
              </div>
            </v-card>
          </v-window-item>

          <!-- System Info Tab -->
          <v-window-item value="info">
            <v-card border variant="flat" class="pa-6">
              <h2 class="text-h5 font-weight-bold text-primary mb-6">System & Database Statistics</h2>
              
              <v-row class="mb-4">
                <v-col cols="12" sm="6" md="4" v-for="stat in statCards" :key="stat.title">
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

              <div class="d-flex align-center justify-space-between py-2">
                <div>
                  <div class="font-weight-medium">App Version</div>
                  <div class="text-caption text-medium-emphasis">Current installed version of August Mark</div>
                </div>
                <div class="font-weight-bold text-white">{{ appVersion }}</div>
              </div>

              <v-divider></v-divider>

              <div class="d-flex align-center justify-space-between py-2">
                <div>
                  <div class="font-weight-medium">Database File Size</div>
                  <div class="text-caption text-medium-emphasis">Local SQLite database file size</div>
                </div>
                <div class="font-weight-bold text-white">{{ formatBytes(dbSize) }}</div>
              </div>

              <v-divider></v-divider>

              <div class="d-flex align-center justify-space-between py-2">
                <div>
                  <div class="font-weight-medium">Database Location</div>
                  <div class="text-caption text-medium-emphasis">Local storage directory for captures and DB</div>
                </div>
                <div class="text-caption font-weight-bold text-primary text-truncate max-width-path">
                  {{ dbLocation }}
                </div>
              </div>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProjectStore } from '@/stores/projectStore'
import { getVersion } from '@tauri-apps/api/app'
import { invoke } from '@tauri-apps/api/core'

const settingsStore = useSettingsStore()
const projectStore = useProjectStore()

const activeTab = ref('general')
const appVersion = ref('Loading...')
const dbSize = ref(0)
const dbLocation = ref('Loading...')

// Statistics state (populated dynamically in T1.07)
const stats = ref({
  projects: 0,
  sessions: 0,
  issues: 0
})

const languages = [
  { title: 'English', value: 'en' },
  { title: 'Tiếng Việt', value: 'vi' }
]

const selectedLanguage = computed({
  get: () => settingsStore.getSettingValue<string>('language', 'en'),
  set: (value) => settingsStore.setSettingValue('language', value)
})

const delayOptions = [
  { label: 'None (Immediate)', value: 0 },
  { label: '3 seconds', value: 3 },
  { label: '5 seconds', value: 5 },
  { label: '10 seconds', value: 10 }
]

const delayedCapture = computed({
  get: () => settingsStore.getSettingValue<number>('delayed_capture', 0),
  set: (value) => settingsStore.setSettingValue('delayed_capture', value)
})

const projects = computed(() => projectStore.projects)

const statCards = computed(() => [
  { title: 'Total Projects', value: stats.value.projects, icon: 'mdi-folder', color: 'primary' },
  { title: 'Total Sessions', value: stats.value.sessions, icon: 'mdi-clipboard-list', color: 'secondary' },
  { title: 'Issues Logged', value: stats.value.issues, icon: 'mdi-alert-circle', color: 'error' }
])

onMounted(async () => {
  // Ensure projects are fetched
  if (projectStore.projects.length === 0) {
    await projectStore.fetchProjects()
  }

  try {
    appVersion.value = await getVersion()
  } catch (e) {
    console.error('Failed to get app version:', e)
    appVersion.value = '0.1.1'
  }

  // Load app stats if command exists (graceful fallback for early milestone steps)
  try {
    const appStats = await invoke<any>('get_app_stats')
    stats.value.projects = appStats.projectCount
    stats.value.sessions = appStats.sessionCount
    stats.value.issues = appStats.issueCount
    dbSize.value = appStats.dbSize
    dbLocation.value = appStats.dbLocation || 'Local Storage'
  } catch (e) {
    // Fallback values before T1.07 is implemented
    stats.value.projects = projectStore.projects.length
    stats.value.sessions = 0
    stats.value.issues = 0
    dbSize.value = 0
    dbLocation.value = '~/AppData/Roaming/AugustMark'
  }
})

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
</script>

<script lang="ts">
export default {
  name: 'SettingsView'
}
</script>

<style scoped>
.max-width-container {
  max-width: 1200px;
  margin: 0 auto;
}
.gap-3 {
  gap: 12px;
}
.gap-4 {
  gap: 16px;
}
.max-width-path {
  max-width: 300px;
  display: inline-block;
}
</style>
