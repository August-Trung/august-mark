<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="d-flex align-center justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
      title="Failed to load sessions"
      :text="error"
    ></v-alert>

    <!-- Empty State -->
    <EmptyState
      v-else-if="sessions.length === 0"
      title="No sessions yet"
      description="There are no review sessions in this project. Create one below to organize your screen captures."
      action-text="Create Review Session"
      @action="showCreateDialog = true"
    />

    <!-- Sort Toolbar -->
    <div v-else-if="sessions.length > 0" class="d-flex justify-end mb-4 align-center">
      <span class="text-caption text-medium-emphasis mr-2">Sort by:</span>
      <div style="width: 220px;">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          density="compact"
          hide-details
          variant="solo-filled"
          flat
          bg-color="surface-variant"
        ></v-select>
      </div>
    </div>

    <!-- Sessions Grid -->
    <v-row v-if="sessions.length > 0">
      <v-col
        v-for="session in sortedSessions"
        :key="session.id"
        cols="12"
        sm="6"
        md="4"
      >
        <SessionCard
          :session="session"
          @delete="handleDelete"
          @complete="handleComplete"
          @activate="handleActivate"
          @rename="openRenameDialog"
          @export="openExportDialog"
        />
      </v-col>
    </v-row>

    <!-- Create Session Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="500px">
      <v-card bg-color="surface" class="pa-4">
        <v-card-title class="text-h5 font-weight-bold px-0 text-primary">
          New Review Session
        </v-card-title>
        <v-card-text class="px-0 py-4">
          <v-form ref="form" v-model="isFormValid" @submit.prevent="handleCreate">
            <v-text-field
              v-model="sessionTitle"
              label="Session Title"
              placeholder="e.g. Homepage UI Audit"
              :rules="[v => !!v || 'Session title is required']"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              required
            ></v-text-field>

            <v-textarea
              v-model="sessionDesc"
              label="Description (Optional)"
              placeholder="What are we reviewing in this session?"
              variant="outlined"
              density="comfortable"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="medium-emphasis" class="text-none" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            class="text-none px-4"
            :disabled="!isFormValid || isCreating"
            :loading="isCreating"
            @click="handleCreate"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Session Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Delete Session"
      message="Are you sure you want to delete this session? All screenshots and issues inside will be permanently deleted."
      confirm-text="Delete"
      confirm-color="error"
      @confirm="executeDelete"
    />

    <!-- Rename Session Dialog -->
    <v-dialog v-model="showRenameDialog" max-width="500px">
      <v-card bg-color="surface" class="pa-4">
        <v-card-title class="text-h5 font-weight-bold px-0 text-primary">
          Rename Session
        </v-card-title>
        <v-card-text class="px-0 py-4">
          <v-form ref="renameForm" v-model="isRenameFormValid" @submit.prevent="handleRenameSave">
            <v-text-field
              v-model="renameTitle"
              label="Session Title"
              placeholder="e.g. Homepage UI Audit"
              :rules="[v => !!v || 'Session title is required']"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              required
            ></v-text-field>

            <v-textarea
              v-model="renameDesc"
              label="Description (Optional)"
              placeholder="What are we reviewing in this session?"
              variant="outlined"
              density="comfortable"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="medium-emphasis" class="text-none" @click="closeRenameDialog">
            Cancel
          </v-btn>
          <v-btn
            variant="elevated"
            color="primary"
            class="text-none px-4"
            :disabled="!isRenameFormValid || isRenaming"
            :loading="isRenaming"
            @click="handleRenameSave"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Export Session Report Dialog -->
    <ExportDialog
      v-model="showExportDialog"
      :session-id="exportSessionId"
      :session-title="exportSessionTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/projectStore'
import { useSessionStore } from '@/stores/sessionStore'
import { listenToEvent } from '@/services/tauriEvents'
import SessionCard from './SessionCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ExportDialog from '@/components/export/ExportDialog.vue'
import type { Session } from '@/types/session'

const projectStore = useProjectStore()
const { activeProjectId } = storeToRefs(projectStore)

const sessionStore = useSessionStore()
const { sessions, sortedSessions, sortBy, isLoading, error } = storeToRefs(sessionStore)
const { fetchSessionsByProject, createSession, deleteSession, updateSession } = sessionStore

const sortOptions = [
  { title: 'Newest First', value: 'newest' },
  { title: 'Oldest First', value: 'oldest' },
  { title: 'Most Issues', value: 'issues_desc' },
  { title: 'Status (Active First)', value: 'status' }
]

const showCreateDialog = ref(false)
const isFormValid = ref(false)
const sessionTitle = ref('')
const sessionDesc = ref('')
const isCreating = ref(false)

const showDeleteDialog = ref(false)
const sessionToDelete = ref<string | null>(null)

// Expose openCreateDialog so dashboard parent can call it
defineExpose({
  openCreateDialog: () => {
    showCreateDialog.value = true
  }
})

// Refetch sessions when active project changes
watch(activeProjectId, (newId) => {
  if (newId) {
    fetchSessionsByProject(newId)
  }
}, { immediate: true })

let unlistenSessionUpdated: (() => void) | null = null

onMounted(async () => {
  if (activeProjectId.value) {
    fetchSessionsByProject(activeProjectId.value)
  }

  unlistenSessionUpdated = await listenToEvent<string>('session-updated', (_sessionId) => {
    if (activeProjectId.value) {
      fetchSessionsByProject(activeProjectId.value)
    }
  })
})

onUnmounted(() => {
  if (unlistenSessionUpdated) {
    unlistenSessionUpdated()
  }
})

function closeDialog() {
  showCreateDialog.value = false
  sessionTitle.value = ''
  sessionDesc.value = ''
}

async function handleCreate() {
  if (!sessionTitle.value || !activeProjectId.value) return
  isCreating.value = true
  try {
    await createSession({
      projectId: activeProjectId.value,
      title: sessionTitle.value,
      description: sessionDesc.value,
    })
    closeDialog()
  } catch (err) {
    console.error('Failed to create session:', err)
  } finally {
    isCreating.value = false
  }
}

function handleDelete(id: string) {
  sessionToDelete.value = id
  showDeleteDialog.value = true
}

async function executeDelete() {
  if (!sessionToDelete.value) return
  try {
    await deleteSession(sessionToDelete.value)
  } catch (err) {
    console.error('Failed to delete session:', err)
  } finally {
    sessionToDelete.value = null
  }
}

async function handleComplete(id: string) {
  try {
    await updateSession(id, { status: 'completed' })
  } catch (err) {
    console.error('Failed to complete session:', err)
  }
}

async function handleActivate(id: string) {
  try {
    await updateSession(id, { status: 'active' })
  } catch (err) {
    console.error('Failed to reactivate session:', err)
  }
}

const showRenameDialog = ref(false)
const isRenameFormValid = ref(false)
const renameSessionId = ref<string | null>(null)
const renameTitle = ref('')
const renameDesc = ref('')
const isRenaming = ref(false)

function openRenameDialog(session: Session) {
  renameSessionId.value = session.id
  renameTitle.value = session.title
  renameDesc.value = session.description || ''
  showRenameDialog.value = true
}

function closeRenameDialog() {
  showRenameDialog.value = false
  renameSessionId.value = null
  renameTitle.value = ''
  renameDesc.value = ''
}

async function handleRenameSave() {
  if (!renameSessionId.value || !renameTitle.value) return
  isRenaming.value = true
  try {
    await updateSession(renameSessionId.value, {
      title: renameTitle.value,
      description: renameDesc.value,
    })
    closeRenameDialog()
  } catch (err) {
    console.error('Failed to rename session:', err)
  } finally {
    isRenaming.value = false
  }
}

const showExportDialog = ref(false)
const exportSessionId = ref('')
const exportSessionTitle = ref('')

function openExportDialog(session: Session) {
  exportSessionId.value = session.id
  exportSessionTitle.value = session.title
  showExportDialog.value = true
}
</script>

<style scoped>
.border-dashed {
  border: 2px dashed rgba(255, 255, 255, 0.12) !important;
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
