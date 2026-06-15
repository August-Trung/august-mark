use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;
use crate::models::{Session, CreateSessionPayload, UpdateSessionPayload};
use crate::db::session_repo;

#[tauri::command]
pub fn get_sessions(state: State<'_, AppState>) -> AppResult<Vec<Session>> {
    let conn = state.db.lock().unwrap();
    session_repo::get_sessions(&conn)
}

#[tauri::command]
pub fn get_sessions_by_project(
    state: State<'_, AppState>,
    project_id: String,
) -> AppResult<Vec<Session>> {
    let conn = state.db.lock().unwrap();
    session_repo::get_sessions_by_project(&conn, &project_id)
}

#[tauri::command]
pub fn get_session(state: State<'_, AppState>, id: String) -> AppResult<Session> {
    let conn = state.db.lock().unwrap();
    session_repo::get_session(&conn, &id)
}

#[tauri::command]
pub fn create_session(
    state: State<'_, AppState>,
    payload: CreateSessionPayload,
) -> AppResult<Session> {
    let conn = state.db.lock().unwrap();
    session_repo::create_session(&conn, payload)
}

#[tauri::command]
pub fn update_session(
    state: State<'_, AppState>,
    id: String,
    payload: UpdateSessionPayload,
) -> AppResult<Session> {
    let conn = state.db.lock().unwrap();
    session_repo::update_session(&conn, &id, payload)
}

#[tauri::command]
pub fn delete_session(state: State<'_, AppState>, id: String) -> AppResult<()> {
    let conn = state.db.lock().unwrap();
    session_repo::delete_session(&conn, &id)
}
