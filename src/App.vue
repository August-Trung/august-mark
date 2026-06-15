<template>
  <v-app>
    <!-- Left Navigation Drawer -->
    <AppSidebar />

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/common/AppSidebar.vue'
</script>

<style>
html, body {
  background-color: #0F1117;
  overflow-y: auto !important;
}
</style>
