<template>
  <div>
    <!-- Empty State -->
    <div v-if="issues.length === 0" class="d-flex flex-column align-center justify-center py-12 text-center">
      <v-icon size="64" color="medium-emphasis" class="mb-4">mdi-clipboard-text-outline</v-icon>
      <h3 class="text-h6 font-weight-bold text-white mb-2">No Issues Found</h3>
      <p class="text-body-2 text-medium-emphasis max-width-text">
        No issues match the active filter criteria or there are no issues recorded in this session.
      </p>
    </div>

    <!-- Issues Grid -->
    <v-row v-else>
      <v-col
        v-for="issue in issues"
        :key="issue.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <IssueCard :issue="issue" @delete="$emit('delete', $event)" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import type { Issue } from '@/types/issue'
import IssueCard from './IssueCard.vue'

defineProps<{
  issues: Issue[]
}>()

defineEmits<{
  (e: 'delete', id: string): void
}>()
</script>

<style scoped>
.max-width-text {
  max-width: 400px;
}
</style>
