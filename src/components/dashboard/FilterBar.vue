<template>
  <v-card class="mb-6 filter-bar-card px-4 py-3" variant="outlined">
    <div class="d-flex flex-wrap align-center gap-3">
      <!-- Title / Icon -->
      <div class="d-flex align-center mr-2">
        <v-icon color="primary" class="mr-2">mdi-filter-variant</v-icon>
        <span class="text-subtitle-1 font-weight-medium text-white">Filters</span>
      </div>

      <!-- Type Select -->
      <div class="flex-grow-1 select-wrapper" style="min-width: 150px; max-width: 250px;">
        <v-select
          v-model="filters.types"
          :items="typeOptions"
          label="Issue Type"
          multiple
          chips
          closable-chips
          collapse-tags
          density="compact"
          hide-details
          variant="solo-filled"
          flat
          bg-color="surface-variant"
        ></v-select>
      </div>

      <!-- Severity Select -->
      <div class="flex-grow-1 select-wrapper" style="min-width: 150px; max-width: 250px;">
        <v-select
          v-model="filters.severities"
          :items="severityOptions"
          label="Severity"
          multiple
          chips
          closable-chips
          collapse-tags
          density="compact"
          hide-details
          variant="solo-filled"
          flat
          bg-color="surface-variant"
        ></v-select>
      </div>

      <!-- Status Select -->
      <div class="flex-grow-1 select-wrapper" style="min-width: 150px; max-width: 250px;">
        <v-select
          v-model="filters.statuses"
          :items="statusOptions"
          label="Status"
          multiple
          chips
          closable-chips
          collapse-tags
          density="compact"
          hide-details
          variant="solo-filled"
          flat
          bg-color="surface-variant"
        ></v-select>
      </div>

      <!-- Reset Button -->
      <v-btn
        v-if="hasActiveFilters"
        variant="text"
        color="secondary"
        prepend-icon="mdi-filter-off"
        class="text-none ml-auto"
        @click="clearFilters"
      >
        Clear Filters
      </v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useIssueStore } from '@/stores/issueStore'

const issueStore = useIssueStore()
const { filters } = storeToRefs(issueStore)
const { clearFilters } = issueStore

const typeOptions = ['Bug', 'UI', 'UX', 'Suggestion', 'Requirement', 'Question']
const severityOptions = ['Critical', 'Major', 'Minor', 'Info']
const statusOptions = ['Draft', 'Open', 'In Progress', 'Resolved', 'Closed']

const hasActiveFilters = computed(() => {
  return (
    filters.value.types.length > 0 ||
    filters.value.severities.length > 0 ||
    filters.value.statuses.length > 0
  )
})
</script>

<style scoped>
.filter-bar-card {
  background: rgba(30, 30, 30, 0.6) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 8px;
}

.gap-3 {
  gap: 12px;
}

.select-wrapper :deep(.v-field) {
  border-radius: 6px;
}
</style>
