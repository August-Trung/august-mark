<template>
  <v-container class="fill-height align-start" fluid>
    <v-row>
      <v-col cols="12" md="8" class="mx-auto mt-12">
        <v-card class="pa-6" variant="outlined" color="surface-variant">
          <v-card-title class="text-h4 font-weight-bold text-primary px-0 pb-4">
            About August Mark
          </v-card-title>
          <v-card-text class="px-0 text-body-1 text-medium-emphasis">
            <p class="mb-4">
              <strong>August Mark</strong> is a screen annotation and markup tool for digital reviews. It enables developers, designers, and testers to highlight bugs, UI discrepancies, UX flaws, and feedback right on their screens and export them for easy review.
            </p>
            <p class="mb-4">
              Built with Tauri, Rust, Vue 3, Vuetify 3, and SQLite.
            </p>
            <p>
              Version 0.1.0 (MVP)
            </p>
          </v-card-text>
          <v-card-actions class="px-0 pt-4">
            <v-btn color="secondary" variant="elevated" to="/" prepend-icon="mdi-arrow-left" class="text-none">
              Back to Dashboard
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// Simple About View for T1.02 Verification
</script>
