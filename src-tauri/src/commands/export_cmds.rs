use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;
use crate::services::export_html;
use std::path::Path;

#[tauri::command]
pub fn export_session_to_html(
    state: State<'_, AppState>,
    session_id: String,
    output_path: String,
) -> AppResult<()> {
    let conn = state.db.lock().unwrap();
    let path = Path::new(&output_path);
    export_html::export_session_html(&conn, &state.app_data_dir, &session_id, path)
}
