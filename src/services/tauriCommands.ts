import { invoke } from '@tauri-apps/api/core'
import { Project, CreateProjectPayload, UpdateProjectPayload } from '@/types/project'
import { Session, CreateSessionPayload, UpdateSessionPayload } from '@/types/session'

/**
 * Tauri IPC command wrappers for August Mark.
 * Maps frontend calls directly to Rust backend command handlers.
 */

// ============================================================================
// Project Commands
// ============================================================================

/**
 * Retrieve all projects, optionally including archived ones.
 */
export async function getProjects(includeArchived?: boolean): Promise<Project[]> {
  return invoke<Project[]>('get_projects', { includeArchived })
}

/**
 * Retrieve a single project by its ID.
 */
export async function getProject(id: string): Promise<Project> {
  return invoke<Project>('get_project', { id })
}

/**
 * Create a new project.
 */
export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  return invoke<Project>('create_project', { payload })
}

/**
 * Update an existing project's metadata or status.
 */
export async function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  return invoke<Project>('update_project', { id, payload })
}

/**
 * Delete a project and all associated sessions, captures, and issues.
 */
export async function deleteProject(id: string): Promise<void> {
  return invoke<void>('delete_project', { id })
}

// ============================================================================
// Session Commands
// ============================================================================

/**
 * Retrieve all sessions.
 */
export async function getSessions(): Promise<Session[]> {
  return invoke<Session[]>('get_sessions')
}

/**
 * Retrieve all sessions associated with a specific project ID.
 */
export async function getSessionsByProject(projectId: string): Promise<Session[]> {
  return invoke<Session[]>('get_sessions_by_project', { projectId })
}

/**
 * Retrieve a single session by its ID.
 */
export async function getSession(id: string): Promise<Session> {
  return invoke<Session>('get_session', { id })
}

/**
 * Create a new session.
 */
export async function createSession(payload: CreateSessionPayload): Promise<Session> {
  return invoke<Session>('create_session', { payload })
}

/**
 * Update an existing session's metadata or status.
 */
export async function updateSession(id: string, payload: UpdateSessionPayload): Promise<Session> {
  return invoke<Session>('update_session', { id, payload })
}

/**
 * Delete a session. Downstream captures, issues, and files will be automatically cascade cleaned.
 */
export async function deleteSession(id: string): Promise<void> {
  return invoke<void>('delete_session', { id })
}
