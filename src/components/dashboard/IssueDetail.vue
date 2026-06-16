<template>
  <v-card v-if="issue" class="fill-height bg-transparent border-0" flat>
    <!-- Card Toolbar -->
    <div class="d-flex align-center justify-space-between mb-6">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        class="text-none pl-0"
        color="medium-emphasis"
        @click="goBack"
      >
        {{ t('issueDetail.backToSession') }}
      </v-btn>

      <div class="d-flex gap-2">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-robot"
          class="text-none"
          @click="showExportDialog = true"
        >
          {{ t('issueDetail.aiFixPack') }}
        </v-btn>

        <v-btn
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete"
          class="text-none"
          @click="confirmDelete"
        >
          {{ t('issueDetail.deleteIssue') }}
        </v-btn>
      </div>
    </div>

    <!-- Layout Grid -->
    <v-row>
      <!-- Left side: Screenshot and Crop preview -->
      <v-col cols="12" md="8">
        <v-card bg-color="surface" variant="outlined" color="surface-variant" class="pa-4 mb-4">
          <div class="text-subtitle-1 font-weight-bold text-white mb-3">
            {{ t('issueDetail.annotatedScreenshot', 'Annotated Screenshot') }}
          </div>
          <div class="screenshot-container bg-black rounded overflow-hidden">
            <v-img
              v-if="annotatedUrl"
              :src="annotatedUrl"
              contain
              max-height="600"
              class="mx-auto"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height bg-grey-darken-3">
                  <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
                </div>
              </template>
            </v-img>
          </div>
        </v-card>

        <!-- Crop Preview -->
        <v-card bg-color="surface" variant="outlined" color="surface-variant" class="pa-4">
          <div class="text-subtitle-1 font-weight-bold text-white mb-3">
            {{ t('issueDetail.issueCrop', 'Issue Crop (Zoomed View)') }}
          </div>
          <div class="crop-container d-flex align-center justify-center py-4 bg-grey-darken-4 rounded">
            <v-img
              v-if="cropUrl"
              :src="cropUrl"
              width="200"
              height="200"
              class="border rounded"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height bg-grey-darken-3">
                  <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
                </div>
              </template>
            </v-img>
            <div v-else class="text-caption text-medium-emphasis">{{ t('issueDetail.noCropImage', 'No crop image generated') }}</div>
          </div>
        </v-card>
      </v-col>

      <!-- Right side: Editable Metadata Form -->
      <v-col cols="12" md="4">
        <v-card bg-color="surface" variant="outlined" color="surface-variant" class="pa-4 sticky-panel">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold text-white">
              {{ t('issueDetail.issueMetadata', 'Issue Metadata') }}
            </div>
            <v-avatar color="primary" size="32" class="text-white font-weight-bold">
              {{ issue.markerNumber }}
            </v-avatar>
          </div>

          <!-- Form Fields with Auto-Save -->
          <v-form ref="formRef">
            <!-- Title -->
            <v-text-field
              v-model="title"
              :label="t('common.title')"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              @blur="autoSave"
            ></v-text-field>

            <!-- Issue Type -->
            <v-select
              v-model="issueType"
              :label="t('common.type', 'Type')"
              :items="issueTypes"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              @update:model-value="autoSave"
            ></v-select>

            <!-- Severity -->
            <v-select
              v-model="severity"
              :label="t('common.severity')"
              :items="severities"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              @update:model-value="autoSave"
            ></v-select>

            <!-- Status -->
            <v-select
              v-model="status"
              :label="t('common.status')"
              :items="statuses"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              @update:model-value="autoSave"
            ></v-select>

            <!-- Description -->
            <v-textarea
              v-model="description"
              :label="t('common.description')"
              variant="outlined"
              density="comfortable"
              rows="6"
              class="mb-3"
              @blur="autoSave"
            ></v-textarea>

            <!-- Tags -->
            <v-combobox
              v-model="selectedTags"
              :label="t('issueDetail.tags', 'Tags')"
              :items="tagStore.tags.map(t => t.name)"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              closable-chips
              :placeholder="t('issueDetail.tagPlaceholder', 'Type tag and press Enter')"
              class="mb-3"
              @update:model-value="autoSave"
            ></v-combobox>
          </v-form>

          <v-divider class="my-4"></v-divider>

          <!-- System Details -->
          <div class="system-details text-caption text-medium-emphasis">
            <div class="d-flex justify-space-between mb-1">
              <span>{{ t('sessionView.createdOn') }}:</span>
              <span>{{ formatDate(issue.createdAt) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span>{{ t('issueDetail.updatedOn', 'Updated') }}:</span>
              <span>{{ formatDate(issue.updatedAt) }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span>{{ t('issueDetail.colorBadge', 'Color badge') }}:</span>
              <span :style="{ color: issue.color }" class="font-weight-bold">
                {{ issue.color }}
              </span>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Export Dialog for AI Context Pack -->
    <ExportDialog
      v-model="showExportDialog"
      :session-id="issue.sessionId"
      :session-title="sessionTitle"
      :issue-id="issue.id"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useIssueStore } from '@/stores/issueStore'
import { useTagStore } from '@/stores/tagStore'
import { getCapture, getSession } from '@/services/tauriCommands'
import type { Issue } from '@/types/issue'
import { formatDateTime as formatDate } from '@/utils/date'
import ExportDialog from '@/components/export/ExportDialog.vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const props = defineProps<{
  issue: Issue
}>()

const emit = defineEmits<{
  (e: 'delete', id: string): void
}>()

const router = useRouter()
const issueStore = useIssueStore()
const tagStore = useTagStore()

const showExportDialog = ref(false)
const sessionTitle = ref('Session Report')

watch(() => props.issue.sessionId, async (newId) => {
  if (newId) {
    try {
      const session = await getSession(newId)
      sessionTitle.value = session.title
    } catch (err) {
      console.error('Failed to load session details:', err)
    }
  }
}, { immediate: true })

tagStore.loadTags()

// Local Form States
const title = ref(props.issue.title)
const description = ref(props.issue.description)
const issueType = ref(props.issue.issueType)
const severity = ref(props.issue.severity)
const status = ref(props.issue.status)
const selectedTags = ref<string[]>((props.issue.tags || []).map(t => t.name))

const issueTypes = ['Bug', 'UI', 'UX', 'Suggestion', 'Requirement', 'Question']
const severities = ['Critical', 'Major', 'Minor', 'Info']
const statuses = ['Draft', 'Open', 'In Progress', 'Resolved', 'Closed']

const screenshotPath = ref('')

// Load capture details to get original screenshot path
const loadCapturePath = async () => {
  try {
    const capture = await getCapture(props.issue.captureId)
    screenshotPath.value = capture.screenshotPath
  } catch (err) {
    console.error('Failed to load capture info:', err)
  }
}
loadCapturePath()

// Converted asset URLs
const cropUrl = computed(() => {
  if (!props.issue.cropPath) return ''
  return convertFileSrc(props.issue.cropPath)
})

const annotatedUrl = computed(() => {
  if (!screenshotPath.value) return ''
  // Annotated screenshot path has _annotated.png suffix
  const annotatedPath = screenshotPath.value.replace('.png', '_annotated.png')
  return convertFileSrc(annotatedPath)
})

// Update form states when issue prop changes
watch(() => props.issue, (newIssue) => {
  if (newIssue) {
    title.value = newIssue.title
    description.value = newIssue.description
    issueType.value = newIssue.issueType
    severity.value = newIssue.severity
    status.value = newIssue.status
    selectedTags.value = (newIssue.tags || []).map(t => t.name)
    loadCapturePath()
  }
}, { deep: true })

const goBack = () => {
  router.push(`/session/${props.issue.sessionId}`)
}

const confirmDelete = () => {
  emit('delete', props.issue.id)
}

const autoSave = async () => {
  const currentTags = (props.issue.tags || []).map(t => t.name).sort()
  const newTags = [...selectedTags.value].map(t => t.trim()).filter(Boolean).sort()
  const tagsChanged = JSON.stringify(currentTags) !== JSON.stringify(newTags)

  // Only update if changed
  if (
    title.value === props.issue.title &&
    description.value === props.issue.description &&
    issueType.value === props.issue.issueType &&
    severity.value === props.issue.severity &&
    status.value === props.issue.status &&
    !tagsChanged
  ) {
    return
  }

  try {
    // Process tags: if they are new, create them in SQLite
    const tagNames: string[] = []
    for (const name of selectedTags.value) {
      const trimmed = name.trim()
      if (!trimmed) continue
      const existing = tagStore.tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase())
      if (existing) {
        tagNames.push(existing.name)
      } else {
        try {
          const newTag = await tagStore.addTag(trimmed)
          tagNames.push(newTag.name)
        } catch (e) {
          console.error('Failed to create new tag:', e)
          tagNames.push(trimmed)
        }
      }
    }

    await issueStore.updateIssue(props.issue.id, {
      title: title.value,
      description: description.value,
      issueType: issueType.value,
      severity: severity.value,
      status: status.value,
      tags: tagNames
    })
  } catch (err) {
    console.error('Failed to auto-save issue:', err)
  }
}

</script>

<style scoped>
.screenshot-container {
  border: 1px solid rgba(255, 255, 255, 0.12);
  min-height: 200px;
  display: flex;
  align-items: center;
}

.sticky-panel {
  position: sticky;
  top: 24px;
}

.gap-2 {
  gap: 8px;
}
</style>
