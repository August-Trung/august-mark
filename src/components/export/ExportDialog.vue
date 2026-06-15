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
          This will generate a self-contained HTML document containing all annotated screenshots, crops, details, and metadata. All assets are base64-embedded, meaning the file can be shared and opened offline in any web browser.
        </p>

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
          v-if="!isExporting"
          variant="elevated"
          color="secondary"
          class="text-none"
          prepend-icon="mdi-file-document-outline"
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
import { exportSessionToHtml } from '@/services/tauriCommands'

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

const close = () => {
  if (isExporting.value) return
  visible.value = false
  statusMessage.value = ''
}

const handleExport = async () => {
  statusMessage.value = ''
  try {
    // Generate default filename
    const safeTitle = props.sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const defaultFilename = `${safeTitle}_report.html`

    // Ask user for save location
    const selectedPath = await save({
      title: 'Export HTML Report',
      defaultPath: defaultFilename,
      filters: [
        {
          name: 'HTML Document',
          extensions: ['html'],
        },
      ],
    })

    if (!selectedPath) {
      // User cancelled
      return
    }

    isExporting.value = true
    await exportSessionToHtml(props.sessionId, selectedPath)
    
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
