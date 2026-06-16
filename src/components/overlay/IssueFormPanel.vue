<template>
  <v-navigation-drawer
    v-slot:default
    v-model="showIssueForm"
    location="right"
    temporary
    persistent
    scrim="false"
    :width="340"
    class="issue-form-panel"
  >
    <div class="panel-header">
      <h3 class="text-h6 font-weight-bold">
        {{ t('overlay.issueAnnotation', 'Issue Annotation') }} #{{ nextMarkerNumber }}
      </h3>
      <v-chip size="small" color="primary" variant="flat">
        {{ activeToolLabel }}
      </v-chip>
    </div>

    <v-divider></v-divider>

    <v-form ref="formRef" v-slot:default v-model="isFormValid" class="panel-body" @submit.prevent="handleSave">
      <!-- Title -->
      <v-text-field
        v-model="title"
        :label="t('overlay.titleLabel')"
        :placeholder="t('overlay.titlePlaceholder')"
        variant="outlined"
        density="comfortable"
        :rules="[v => !!v || t('overlay.titleRequired', 'Title is required')]"
        required
      ></v-text-field>

      <!-- Type -->
      <v-select
        v-model="issueType"
        :label="t('common.type', 'Type')"
        :items="issueTypes"
        variant="outlined"
        density="comfortable"
      ></v-select>

      <!-- Severity -->
      <v-select
        v-model="severity"
        :label="t('overlay.severityLabel')"
        :items="severities"
        variant="outlined"
        density="comfortable"
      ></v-select>

      <!-- Description -->
      <v-textarea
        v-model="description"
        :label="t('overlay.descLabel')"
        :placeholder="t('overlay.descPlaceholder')"
        variant="outlined"
        density="comfortable"
        rows="4"
        max-rows="6"
        auto-grow
      ></v-textarea>

      <!-- Tags -->
      <v-combobox
        v-model="selectedTags"
        :label="t('issueDetail.tags')"
        :items="tagStore.tags.map(t => t.name)"
        variant="outlined"
        density="comfortable"
        multiple
        chips
        closable-chips
        :placeholder="t('issueDetail.tagPlaceholder')"
      ></v-combobox>
    </v-form>

    <div class="panel-footer">
      <v-btn
        color="secondary"
        variant="outlined"
        class="flex-grow-1"
        @click="handleCancel"
      >
        {{ t('overlay.discard') }}
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        class="flex-grow-1"
        :disabled="!isFormValid"
        @click="handleSave"
      >
        {{ t('overlay.saveIssue') }}
      </v-btn>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useOverlayStore } from '@/stores/overlayStore'
import { useTagStore } from '@/stores/tagStore'
import { useI18n } from '@/composables/useI18n'

const overlayStore = useOverlayStore()
const tagStore = useTagStore()
const { t } = useI18n()

const showIssueForm = computed({
  get: () => overlayStore.showIssueForm,
  set: (val) => {
    overlayStore.showIssueForm = val
  }
})

const nextMarkerNumber = computed(() => overlayStore.nextMarkerNumber)
const activeToolLabel = computed(() => {
  const tool = overlayStore.pendingAnnotation?.type || overlayStore.activeTool
  if (!tool) return t('overlay.annotation', 'Annotation')
  return t('overlay.drawTools.' + tool, tool)
})

const isFormValid = ref(false)
const formRef = ref<any>(null)

// Form Fields
const title = ref('')
const issueType = ref('Bug')
const severity = ref('Minor')
const description = ref('')
const selectedTags = ref<string[]>([])

const issueTypes = ['Bug', 'UI', 'UX', 'Suggestion', 'Requirement', 'Question']
const severities = ['Critical', 'Major', 'Minor', 'Info']

// Reset form values when the drawer is opened
watch(() => overlayStore.showIssueForm, (visible) => {
  if (visible) {
    title.value = ''
    issueType.value = 'Bug'
    severity.value = 'Minor'
    description.value = ''
    selectedTags.value = []
    tagStore.loadTags()
    if (formRef.value) {
      formRef.value.resetValidation()
    }
  }
})

const handleSave = async () => {
  if (formRef.value && !isFormValid.value) return

  if (overlayStore.pendingAnnotation) {
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

    // Attach issue metadata to the annotation
    overlayStore.pendingAnnotation.issue = {
      title: title.value,
      issueType: issueType.value,
      severity: severity.value,
      description: description.value,
      tags: tagNames
    }
    
    // Commit the annotation
    overlayStore.addAnnotation(overlayStore.pendingAnnotation)
  }

  // Clear states
  overlayStore.pendingAnnotation = null
  overlayStore.showIssueForm = false
}

const handleCancel = () => {
  // Discard pending annotation
  overlayStore.pendingAnnotation = null
  overlayStore.showIssueForm = false
}
</script>

<style scoped>
.issue-form-panel {
  background: #1a1d27 !important; /* Matches surface color from theme */
  border-left: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: #e8e8e8 !important;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.panel-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-body {
  flex-grow: 1;
  padding: 20px 16px;
  overflow-y: auto;
}

.panel-footer {
  padding: 16px;
  display: flex;
  gap: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: #151821;
}
</style>
