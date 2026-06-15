import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Project, CreateProjectPayload, UpdateProjectPayload } from '@/types/project'
import {
  getProjects as apiGetProjects,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
} from '@/services/tauriCommands'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const activeProjectId = ref<string>('default')
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const activeProject = computed(() => {
    return projects.value.find(p => p.id === activeProjectId.value) || null
  })

  async function fetchProjects(includeArchived: boolean = false) {
    isLoading.value = true
    error.value = null
    try {
      projects.value = await apiGetProjects(includeArchived)
      // Default to the first project or 'default' if not present
      if (!projects.value.some(p => p.id === activeProjectId.value)) {
        if (projects.value.length > 0) {
          activeProjectId.value = projects.value[0].id
        } else {
          activeProjectId.value = 'default'
        }
      }
    } catch (err: any) {
      error.value = err.message || String(err)
    } finally {
      isLoading.value = false
    }
  }

  function selectProject(id: string) {
    activeProjectId.value = id
  }

  async function createProject(payload: CreateProjectPayload) {
    isLoading.value = true
    error.value = null
    try {
      const newProj = await apiCreateProject(payload)
      projects.value.push(newProj)
      activeProjectId.value = newProj.id
      return newProj
    } catch (err: any) {
      error.value = err.message || String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateProject(id: string, payload: UpdateProjectPayload) {
    isLoading.value = true
    error.value = null
    try {
      const updatedProj = await apiUpdateProject(id, payload)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = updatedProj
      }
      return updatedProj
    } catch (err: any) {
      error.value = err.message || String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteProject(id: string) {
    isLoading.value = true
    error.value = null
    try {
      await apiDeleteProject(id)
      projects.value = projects.value.filter(p => p.id !== id)
      if (activeProjectId.value === id) {
        activeProjectId.value = projects.value[0]?.id || 'default'
      }
    } catch (err: any) {
      error.value = err.message || String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    projects,
    activeProjectId,
    activeProject,
    isLoading,
    error,
    fetchProjects,
    selectProject,
    createProject,
    updateProject,
    deleteProject,
  }
})
