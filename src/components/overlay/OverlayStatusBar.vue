<template>
  <div class="overlay-status-bar">
    <div class="bar-left">
      <span class="session-badge">Session</span>
      <span class="session-name">{{ sessionName }}</span>
      <span class="divider"></span>
      <span class="issue-count">{{ issueCount }} issues marked</span>
    </div>
    <div class="bar-right">
      <button class="btn-cancel" @click="$emit('cancel')">
        Cancel <kbd>Esc</kbd>
      </button>
      <button class="btn-done" @click="$emit('done')">
        Done
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  sessionName: string
  issueCount: number
}>()

defineEmits<{
  (e: 'cancel'): void
  (e: 'done'): void
}>()
</script>

<style scoped>
.overlay-status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(26, 29, 39, 0.90);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #E8E8E8;
  z-index: 9999;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.session-badge {
  background: rgba(255, 107, 53, 0.15);
  color: #FF6B35;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid rgba(255, 107, 53, 0.30);
}

.session-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #E8E8E8;
}

.divider {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.15);
}

.issue-count {
  font-size: 0.85rem;
  color: rgba(232, 232, 232, 0.55);
}

/* Buttons */
.btn-cancel,
.btn-done {
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.1s ease;
  font-family: inherit;
  line-height: 1;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: #E8E8E8;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-1px);
}

.btn-cancel:active {
  transform: translateY(0);
}

.btn-done {
  background: #FF6B35;
  color: #fff;
}

.btn-done:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.btn-done:active {
  transform: translateY(0);
}

kbd {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-family: monospace;
  font-size: 0.72rem;
  color: rgba(232, 232, 232, 0.75);
  vertical-align: middle;
}
</style>
