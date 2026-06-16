import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllSettings, updateSetting } from '@/services/tauriCommands'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Record<string, string>>({})
  const loading = ref(false)

  async function loadSettings() {
    loading.value = true
    try {
      const allSettings = await getAllSettings()
      settings.value = allSettings
    } catch (e) {
      console.error('Failed to load settings:', e)
    } finally {
      loading.value = false
    }
  }

  // Get a parsed setting value, or return a default value if not set
  function getSettingValue<T>(key: string, defaultValue: T): T {
    const rawValue = settings.value[key]
    if (rawValue === undefined) {
      return defaultValue
    }
    try {
      return JSON.parse(rawValue) as T
    } catch (e) {
      console.error(`Failed to parse setting key: ${key}, value: ${rawValue}`, e)
      return defaultValue
    }
  }

  async function setSettingValue(key: string, value: any) {
    const serialized = JSON.stringify(value)
    settings.value[key] = serialized
    try {
      await updateSetting(key, serialized)
    } catch (e) {
      console.error(`Failed to update setting ${key}:`, e)
    }
  }

  // Helper computed properties
  const theme = computed({
    get: () => getSettingValue<'dark' | 'light' | 'system'>('theme', 'dark'),
    set: (value) => setSettingValue('theme', value)
  })

  const overlayTrigger = computed({
    get: () => getSettingValue<string>('overlay_trigger', 'middle_mouse_hold'),
    set: (value) => setSettingValue('overlay_trigger', value)
  })

  const holdDurationMs = computed({
    get: () => getSettingValue<number>('hold_duration_ms', 1000),
    set: (value) => setSettingValue('hold_duration_ms', value)
  })

  const screenshotQuality = computed({
    get: () => getSettingValue<number>('screenshot_quality', 90),
    set: (value) => setSettingValue('screenshot_quality', value)
  })

  const defaultProjectId = computed({
    get: () => getSettingValue<string>('default_project_id', 'default'),
    set: (value) => setSettingValue('default_project_id', value)
  })

  const autoBackup = computed({
    get: () => getSettingValue<boolean>('auto_backup', false),
    set: (value) => setSettingValue('auto_backup', value)
  })

  const gdriveConnected = computed({
    get: () => getSettingValue<boolean>('gdrive_connected', false),
    set: (value) => setSettingValue('gdrive_connected', value)
  })

  const minimizeToTray = computed({
    get: () => getSettingValue<boolean>('minimize_to_tray', false),
    set: (value) => setSettingValue('minimize_to_tray', value)
  })

  return {
    settings,
    loading,
    loadSettings,
    getSettingValue,
    setSettingValue,
    theme,
    overlayTrigger,
    holdDurationMs,
    screenshotQuality,
    defaultProjectId,
    autoBackup,
    gdriveConnected,
    minimizeToTray
  }
})
