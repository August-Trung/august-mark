// lib.rs — module declarations for August Mark Tauri backend.
// Modules are added here as they are implemented in subsequent tasks.
//
// T1.01: baseline — no modules yet.
// T1.04: will add mod error, mod utils
// T1.05: will add mod models
// T1.06: will add mod db
// T1.07: will add mod state
// T1.08: will add mod commands

pub mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod services;
pub mod state;
pub mod utils;

use tauri::{Emitter, Manager};
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{TrayIconBuilder, TrayIconEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};
                    if event.state() == ShortcutState::Pressed {
                        if shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyM) {
                            // Ignore repeated hotkeys while the overlay is active.
                            if let Some(state) = app.try_state::<state::AppState>() {
                                if state
                                    .is_overlay_active
                                    .lock()
                                    .map(|active| *active)
                                    .unwrap_or(false)
                                {
                                    return;
                                }
                            }

                            let _ = app.emit("capture:trigger", ());
                        }
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::project_cmds::create_project,
            commands::project_cmds::get_projects,
            commands::project_cmds::get_project,
            commands::project_cmds::update_project,
            commands::project_cmds::delete_project,
            commands::session_cmds::create_session,
            commands::session_cmds::get_sessions,
            commands::session_cmds::get_sessions_by_project,
            commands::session_cmds::get_session,
            commands::session_cmds::update_session,
            commands::session_cmds::delete_session,
            commands::capture_cmds::trigger_capture,
            commands::capture_cmds::open_overlay,
            commands::capture_cmds::show_overlay,
            commands::capture_cmds::close_overlay,
            commands::capture_cmds::cancel_capture,
            commands::capture_cmds::get_capture,
            commands::capture_cmds::log_from_js,
            commands::issue_cmds::save_capture_annotations,
            commands::issue_cmds::get_issues,
            commands::issue_cmds::get_issue,
            commands::issue_cmds::update_issue,
            commands::issue_cmds::delete_issue,
            commands::export_cmds::export_session,
            commands::settings_cmds::get_all_settings,
            commands::settings_cmds::get_setting,
            commands::settings_cmds::update_setting,
            commands::app_cmds::get_app_stats,
            commands::tag_cmds::get_all_tags,
            commands::tag_cmds::create_tag,
            commands::tag_cmds::associate_tag_with_issue,
            commands::tag_cmds::get_tags_by_issue,
            commands::tag_cmds::clear_issue_tags,
            commands::search_cmds::search_all,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    let app = window.app_handle();
                    if let Some(state) = app.try_state::<state::AppState>() {
                        let conn = state.db.lock().unwrap();
                        let minimize = crate::db::settings_repo::get_setting(&conn, "minimize_to_tray")
                            .unwrap_or(None)
                            .map(|v| v == "true" || v == "\"true\"")
                            .unwrap_or(false);

                        if minimize {
                            api.prevent_close();
                            let _ = window.hide();
                        }
                    }
                }
            }
        })
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                log::info!("August Mark starting in debug mode");
            }

            // Resolve local app data directory (e.g. AppData/Roaming/August Mark)
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

            // Ensure database base directory and asset subdirectories exist
            db::ensure_app_dirs(&app_data_dir)?;

            // Database path
            let db_path = app_data_dir.join("august_mark.db");

            // Open database connection
            let mut conn = db::open_connection(&db_path)?;

            // Run schema migrations
            db::run_migrations(&mut conn)?;

            // Clean up uncommitted captures from previous runs/crashes
            let _ = db::capture_repo::cleanup_uncommitted_captures(&conn, &app_data_dir);

            // Instantiate and manage global AppState
            let state = state::AppState::new(conn, app_data_dir);
            app.manage(state);

            // Register global shortcut Ctrl+Shift+M
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
                let shortcut =
                    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyM);
                app.global_shortcut()
                    .register(shortcut)
                    .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
                
                // Start global mouse listener background thread (T5.04)
                services::mouse_hook::start_mouse_hook(app.handle().clone());

                // System Tray Setup (T1.05)
                let quit_i = MenuItemBuilder::with_id("quit", "Thoát").build(app)?;
                let capture_i = MenuItemBuilder::with_id("capture", "Chụp màn hình").build(app)?;
                let open_i = MenuItemBuilder::with_id("open", "Mở August Mark").build(app)?;
                let settings_i = MenuItemBuilder::with_id("settings", "Cài đặt").build(app)?;

                let menu = MenuBuilder::new(app)
                    .item(&capture_i)
                    .item(&open_i)
                    .item(&settings_i)
                    .separator()
                    .item(&quit_i)
                    .build()?;

                let _tray = TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .on_menu_event(move |app, event| {
                        match event.id.as_ref() {
                            "quit" => {
                                app.exit(0);
                            }
                            "capture" => {
                                let _ = app.emit("capture:trigger", ());
                            }
                            "open" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                            "settings" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                    let _ = window.emit("navigate", "/settings");
                                }
                            }
                            _ => {}
                        }
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running August Mark");
}
