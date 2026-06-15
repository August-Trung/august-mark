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

    <!-- Sessions Grid -->
    <v-row v-else>
      <v-col
        v-for="session in sessions"
        :key="session.id"
        cols="12"
        sm="6"
        md="4"
      >
        <SessionCard
          :session="session"
          @delete="handleDelete"
          @complete="handleComplete"
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/projectStore'
import { useSessionStore } from '@/stores/sessionStore'
import SessionCard from './SessionCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const projectStore = useProjectStore()
const { activeProjectId } = storeToRefs(projectStore)

const sessionStore = useSessionStore()
const { sessions, isLoading, error } = storeToRefs(sessionStore)
const { fetchSessionsByProject, createSession, deleteSession, updateSession } = sessionStore

const showCreateDialog = ref(false)
const isFormValid = ref(false)
const sessionTitle = ref('')
const sessionDesc = ref('')
const isCreating = ref(false)

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

onMounted(() => {
  if (activeProjectId.value) {
    fetchSessionsByProject(activeProjectId.value)
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

async function handleDelete(id: string) {
  if (confirm('Are you sure you want to delete this session? All screenshots and issues inside will be permanently deleted.')) {
    try {
      await deleteSession(id)
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }
}

async function handleComplete(id: string) {
  try {
    await updateSession(id, { status: 'completed' })
  } catch (err) {
    console.error('Failed to complete session:', err)
  }
}
</script>

<style scoped>
.border-dashed {
  border: 2px dashed rgba(255, 255, 255, 0.12) !important;
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
