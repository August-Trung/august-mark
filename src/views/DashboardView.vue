<template>
  <div class="w-100 fill-height d-flex flex-column">
    <!-- View Header -->
    <AppHeader />

    <v-container class="flex-grow-1 align-start pa-6" fluid>
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center mb-6">
            <div>
              <h1 class="text-h4 font-weight-bold text-white mb-1">
                Sessions
              </h1>
              <p class="text-subtitle-1 text-medium-emphasis">
                Manage and review screenshot markups in this project
              </p>
            </div>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              size="large"
              prepend-icon="mdi-plus"
              class="text-none"
              @click="triggerNewSession"
            >
              New Session
            </v-btn>
          </div>

          <!-- Dynamic Sessions List -->
          <SessionList ref="sessionList" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from '@/components/common/AppHeader.vue'
import SessionList from '@/components/dashboard/SessionList.vue'

const sessionList = ref<InstanceType<typeof SessionList> | null>(null)

function triggerNewSession() {
  if (sessionList.value) {
    sessionList.value.openCreateDialog()
  }
}
</script>

<style scoped>
/* Scoped styles if needed */
</style>
