<template>
  <v-dialog v-model="visible" max-width="500px" persistent>
    <v-card class="export-dialog-card pa-4">
      <v-card-title class="d-flex align-center pb-2 border-bottom">
        <v-icon color="secondary" class="mr-2">mdi-export</v-icon>
        <span class="text-h6 font-weight-bold text-white">Export Session Report</span>
      </v-card-title>

      <v-card-text class="pt-4">
        <p class="text-body-1 text-white mb-2 font-weight-medium">
          Session: <span class="text-secondary">{{ sessionTitle }}</span>
        </p>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ formatDescription }}
        </p>

        <!-- Options Form -->
        <div v-if="!isExporting && !statusMessage" class="mt-4">
          <!-- Format Selector -->
          <v-select
            v-model="selectedFormat"
            :items="formats"
            label="Export Format"
            variant="outlined"
            density="comfortable"
            class="mb-4"
          ></v-select>

          <!-- Severity Filter -->
          <div class="mb-4">
            <span class="text-subtitle-2 text-white d-block mb-1 font-weight-medium">Include Severities</span>
            <div class="d-flex flex-wrap">
              <v-checkbox
                v-for="sev in severityOptions"
                :key="sev"
                v-model="selectedSeverities"
                :label="sev"
                :value="sev"
                density="compact"
                hide-details
                color="secondary"
                class="mr-3 mb-1"
              ></v-checkbox>
            </div>
          </div>

          <!-- Status Filter -->
          <div class="mb-4">
            <span class="text-subtitle-2 text-white d-block mb-1 font-weight-medium">Include Statuses</span>
            <div class="d-flex flex-wrap">
              <v-checkbox
                v-for="stat in statusOptions"
                :key="stat"
                v-model="selectedStatuses"
                :label="stat"
                :value="stat"
                density="compact"
                hide-details
                color="secondary"
                class="mr-3 mb-1"
              ></v-checkbox>
            </div>
          </div>
        </div>

        <!-- Loading State / Success Status -->
        <div v-if="isExporting" class="d-flex flex-column align-center justify-center py-4">
          <v-progress-circular indeterminate color="secondary" class="mb-2"></v-progress-circular>
          <span class="text-caption text-secondary">Generating report...</span>
        </div>

        <v-alert
          v-else-if="statusMessage"
          :type="statusType"
          variant="tonal"
          class="mb-0"
          closable
          @click:close="statusMessage = ''"
        >
          {{ statusMessage }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="d-flex justify-end gap-2 px-4 pb-2">
        <v-btn
          variant="text"
          color="medium-emphasis"
          class="text-none"
          :disabled="isExporting"
          @click="close"
        >
          Close
        </v-btn>
        <v-btn
          v-if="!isExporting && !statusMessage"
          variant="elevated"
          color="secondary"
          class="text-none"
          prepend-icon="mdi-file-document-outline"
          :disabled="isExportDisabled"
          @click="handleExport"
        >
          Choose Save Path
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { save } from '@tauri-apps/plugin-dialog'
import { exportSession } from '@/services/tauriCommands'

const props = defineProps<{
  modelValue: boolean
  sessionId: string
  sessionTitle: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const isExporting = ref(false)
const statusMessage = ref('')
const statusType = ref<'success' | 'error'>('success')

const selectedFormat = ref<'html' | 'pdf' | 'markdown' | 'csv'>('html')
const formats = [
  { title: 'HTML Webpage (.html)', value: 'html' },
  { title: 'PDF Document (.pdf)', value: 'pdf' },
  { title: 'Markdown Document (.md)', value: 'markdown' },
  { title: 'CSV Tabular Sheet (.csv)', value: 'csv' },
]

const severityOptions = ['Critical', 'Major', 'Minor', 'Info']
const selectedSeverities = ref<string[]>(['Critical', 'Major', 'Minor', 'Info'])

const statusOptions = ['Draft', 'Open', 'In Progress', 'Resolved', 'Closed']
const selectedStatuses = ref<string[]>(['Draft', 'Open', 'In Progress', 'Resolved', 'Closed'])

const isExportDisabled = computed(() => {
  return selectedSeverities.value.length === 0 || selectedStatuses.value.length === 0
})

const formatDescription = computed(() => {
  switch (selectedFormat.value) {
    case 'html':
      return 'This will generate a self-contained HTML document containing all annotated screenshots, crops, details, and metadata. All assets are base64-embedded, meaning the file can be shared and opened offline in any web browser.'
    case 'pdf':
      return "This will generate a portable PDF document of the session report using the system's Edge browser printer. Ideal for sharing and printing."
    case 'markdown':
      return 'This will generate a Markdown (.md) document of the session report. Images will be saved inside a folder alongside the markdown file, making the report portable.'
    case 'csv':
      return 'This will generate a spreadsheet-compatible CSV file containing tabular data of the issues (ID, Title, Severity, Type, Status, Description, ScreenshotPath).'
    default:
      return ''
  }
})

const close = () => {
  if (isExporting.value) return
  visible.value = false
  statusMessage.value = ''
}

const handleExport = async () => {
  statusMessage.value = ''
  try {
    const format = selectedFormat.value
    const safeTitle = props.sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    let defaultFilename = `${safeTitle}_report`
    let extension = 'html'
    let formatFilterName = 'HTML Document'
    
    if (format === 'pdf') {
      extension = 'pdf'
      formatFilterName = 'PDF Document'
    } else if (format === 'markdown') {
      extension = 'md'
      formatFilterName = 'Markdown Document'
    } else if (format === 'csv') {
      extension = 'csv'
      formatFilterName = 'CSV File'
    }
    
    defaultFilename = `${defaultFilename}.${extension}`

    const selectedPath = await save({
      title: `Export ${format.toUpperCase()} Report`,
      defaultPath: defaultFilename,
      filters: [
        {
          name: formatFilterName,
          extensions: [extension],
        },
      ],
    })

    if (!selectedPath) {
      return
    }

    isExporting.value = true
    await exportSession(
      props.sessionId,
      selectedPath,
      format,
      selectedSeverities.value,
      selectedStatuses.value
    )
    
    statusType.value = 'success'
    statusMessage.value = `Report exported successfully to: ${selectedPath}`
  } catch (err: any) {
    console.error('Failed to export session:', err)
    statusType.value = 'error'
    statusMessage.value = `Export failed: ${err.message || String(err)}`
  } finally {
    isExporting.value = false
  }
}
</script>

<style scoped>
.export-dialog-card {
  background: #1e1e1e !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 8px;
}

.border-bottom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.gap-2 {
  gap: 8px;
}
</style>
