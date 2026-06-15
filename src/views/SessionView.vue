<template>
  <div class="w-100 fill-height d-flex flex-column">
    <AppHeader />

    <v-container class="flex-grow-1 align-start pa-6" fluid>
      <!-- Loading State -->
      <div v-if="isLoadingSession" class="d-flex align-center justify-center py-12">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
      </div>

      <!-- Main Content -->
      <div v-else-if="session">
        <!-- Session Header -->
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              class="text-none pl-0 mb-2"
              color="medium-emphasis"
              @click="goBack"
            >
              Back to Dashboard
            </v-btn>
            <div class="d-flex align-center gap-2">
              <h1 class="text-h4 font-weight-bold text-white mb-1">
                {{ session.title }}
              </h1>
              <v-chip :color="statusColor" size="small" class="text-uppercase font-weight-bold ml-3">
                {{ session.status }}
              </v-chip>
            </div>
            <p class="text-subtitle-1 text-medium-emphasis">
              {{ session.description || 'No description provided' }}
            </p>
          </div>

          <div class="d-flex gap-2">
            <!-- Export Button -->
            <v-btn
              color="secondary"
              variant="outlined"
              size="large"
              prepend-icon="mdi-export"
              class="text-none"
              @click="handleExport"
            >
              Export
            </v-btn>

            <!-- Capture Button -->
            <v-btn
              color="primary"
              size="large"
              prepend-icon="mdi-camera"
              class="text-none"
              :loading="isCapturing"
              @click="handleCapture"
            >
              Capture markup
            </v-btn>
          </div>
        </div>

        <v-divider class="mb-6"></v-divider>

        <!-- Issues Section Header -->
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5 font-weight-bold text-white">Issues in this Session</h2>
          <span class="text-caption text-medium-emphasis">
            Showing {{ filteredIssues.length }} of {{ issues.length }} issue(s)
          </span>
        </div>

        <!-- Filter Bar -->
        <FilterBar class="mb-4" />

        <!-- Issue List -->
        <div v-if="isLoadingIssues" class="d-flex align-center justify-center py-8">
          <v-progress-circular indeterminate color="secondary" size="36"></v-progress-circular>
        </div>
        <div v-else>
          <IssueList :issues="filteredIssues" @delete="handleDeleteIssue" />
        </div>
      </div>
    </v-container>

    <!-- Delete Issue Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Delete Issue"
      message="Are you sure you want to delete this issue? The crop file on disk will also be deleted."
      confirm-text="Delete"
      confirm-color="error"
      @confirm="executeDeleteIssue"
    />

    <!-- Export Session Report Dialog -->
    <ExportDialog
      v-if="session"
      v-model="showExportDialog"
      :session-id="session.id"
      :session-title="session.title"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { getSession, triggerCapture, openOverlay } from '@/services/tauriCommands'
import { useIssueStore } from '@/stores/issueStore'
import { listenToEvent } from '@/services/tauriEvents'
import AppHeader from '@/components/common/AppHeader.vue'
import FilterBar from '@/components/dashboard/FilterBar.vue'
import IssueList from '@/components/dashboard/IssueList.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import ExportDialog from '@/components/export/ExportDialog.vue'
import type { Session } from '@/types/session'

const route = useRoute()
const router = useRouter()
const sessionId = route.params.id as string

const session = ref<Session | null>(null)
const isLoadingSession = ref(true)
const isCapturing = ref(false)

const issueStore = useIssueStore()
const { issues, filteredIssues, isLoading: isLoadingIssues } = storeToRefs(issueStore)

const showDeleteDialog = ref(false)
const issueToDelete = ref<string | null>(null)
const showExportDialog = ref(false)

const loadSessionDetails = async () => {
  isLoadingSession.value = true
  try {
    session.value = await getSession(sessionId)
  } catch (err) {
    console.error('Failed to load session details:', err)
  } finally {
    isLoadingSession.value = false
  }
}

const loadIssues = async () => {
  try {
    await issueStore.fetchIssuesBySession(sessionId)
  } catch (err) {
    console.error('Failed to load issues for session:', err)
  }
}

let unlistenSessionUpdated: (() => void) | null = null

onMounted(async () => {
  issueStore.clearFilters()
  if (sessionId) {
    await loadSessionDetails()
    await loadIssues()
  }

  unlistenSessionUpdated = await listenToEvent<string>('session-updated', async (updatedSessionId) => {
    if (updatedSessionId === sessionId) {
      await loadSessionDetails()
      await loadIssues()
    }
  })
})

onUnmounted(() => {
  if (unlistenSessionUpdated) {
    unlistenSessionUpdated()
  }
})

const goBack = () => {
  router.push('/')
}

const handleCapture = async () => {
  if (!sessionId) return
  isCapturing.value = true
  try {
    const res = await triggerCapture(sessionId)
    await openOverlay(res.captureId, res.screenshotPath)
  } catch (err) {
    console.error('Capture trigger failed:', err)
  } finally {
    isCapturing.value = false
  }
}

const handleDeleteIssue = (id: string) => {
  issueToDelete.value = id
  showDeleteDialog.value = true
}

const executeDeleteIssue = async () => {
  if (!issueToDelete.value) return
  try {
    await issueStore.deleteIssue(issueToDelete.value)
  } catch (err) {
    console.error('Failed to delete issue:', err)
  } finally {
    issueToDelete.value = null
  }
}

const handleExport = () => {
  showExportDialog.value = true
}

const statusColor = computed(() => {
  if (!session.value) return 'medium-emphasis'
  switch (session.value.status) {
    case 'active': return 'secondary'
    case 'completed': return 'success'
    case 'archived': return 'warning'
    default: return 'medium-emphasis'
  }
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
