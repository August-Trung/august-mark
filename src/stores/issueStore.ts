import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Issue, UpdateIssuePayload } from '@/types/issue'
import { useUiStore } from './uiStore'
import {
  getIssues as apiGetIssues,
  getIssue as apiGetIssue,
  updateIssue as apiUpdateIssue,
  deleteIssue as apiDeleteIssue,
} from '@/services/tauriCommands'

export const useIssueStore = defineStore('issue', () => {
  const issues = ref<Issue[]>([])
  const activeIssue = ref<Issue | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const filters = ref({
    types: [] as string[],
    severities: [] as string[],
    statuses: [] as string[],
  })

  const filteredIssues = computed(() => {
    return issues.value.filter(issue => {
      if (filters.value.types.length > 0 && !filters.value.types.includes(issue.issueType)) {
        return false
      }
      if (filters.value.severities.length > 0 && !filters.value.severities.includes(issue.severity)) {
        return false
      }
      if (filters.value.statuses.length > 0 && !filters.value.statuses.includes(issue.status)) {
        return false
      }
      return true
    })
  })

  function clearFilters() {
    filters.value.types = []
    filters.value.severities = []
    filters.value.statuses = []
  }


  async function fetchIssuesBySession(sessionId: string) {
    isLoading.value = true
    error.value = null
    try {
      issues.value = await apiGetIssues(sessionId)
    } catch (err: any) {
      error.value = err.message || String(err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchIssue(id: string) {
    isLoading.value = true
    error.value = null
    try {
      activeIssue.value = await apiGetIssue(id)
      return activeIssue.value
    } catch (err: any) {
      error.value = err.message || String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateIssue(id: string, payload: UpdateIssuePayload) {
    const uiStore = useUiStore()
    uiStore.setLoading(true)
    error.value = null
    try {
      const updated = await apiUpdateIssue(id, payload)
      // Update in issues list
      const idx = issues.value.findIndex(iss => iss.id === id)
      if (idx !== -1) {
        issues.value[idx] = updated
      }
      // Update active issue
      if (activeIssue.value && activeIssue.value.id === id) {
        activeIssue.value = updated
      }
      uiStore.showToast({ message: 'Issue details updated', type: 'success' })
      return updated
    } catch (err: any) {
      const msg = err.message || String(err)
      error.value = msg
      uiStore.showToast({ message: `Failed to update issue: ${msg}`, type: 'error' })
      throw err
    } finally {
      uiStore.setLoading(false)
    }
  }

  async function deleteIssue(id: string) {
    const uiStore = useUiStore()
    uiStore.setLoading(true)
    error.value = null
    try {
      await apiDeleteIssue(id)
      issues.value = issues.value.filter(iss => iss.id !== id)
      if (activeIssue.value && activeIssue.value.id === id) {
        activeIssue.value = null
      }
      uiStore.showToast({ message: 'Issue deleted', type: 'success' })
    } catch (err: any) {
      const msg = err.message || String(err)
      error.value = msg
      uiStore.showToast({ message: `Failed to delete issue: ${msg}`, type: 'error' })
      throw err
    } finally {
      uiStore.setLoading(false)
    }
  }

  return {
    issues,
    activeIssue,
    isLoading,
    error,
    filters,
    filteredIssues,
    clearFilters,
    fetchIssuesBySession,
    fetchIssue,
    updateIssue,
    deleteIssue,
  }
})
