use rdev::{listen, Event, EventType};
use std::thread;
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};

/// Start the global mouse listener background thread.
/// Detects middle mouse button holds >= 1 second and triggers capture.
pub fn start_mouse_hook(app_handle: AppHandle) {
    println!("[Mouse Hook] Initializing global middle click hold listener...");
    
    thread::spawn(move || {
        let is_middle_pressed = Arc::new(Mutex::new(None));
        
        let handler_app = app_handle.clone();
        let pressed_state = is_middle_pressed.clone();
        
        if let Err(error) = listen(move |event: Event| {
            // Guard: Ignore events if the overlay is already active
            if let Some(state) = handler_app.try_state::<crate::state::AppState>() {
                if state.is_overlay_active.lock().map(|active| *active).unwrap_or(false) {
                    return;
                }
            }

            match event.event_type {
                EventType::ButtonPress(rdev::Button::Middle) => {
                    let now = Instant::now();
                    {
                        let mut lock = pressed_state.lock().unwrap();
                        *lock = Some(now);
                    }
                    
                    let timer_app = handler_app.clone();
                    let timer_state = pressed_state.clone();
                    thread::spawn(move || {
                        thread::sleep(Duration::from_millis(1000));
                        let lock = timer_state.lock().unwrap();
                        if let Some(press_time) = *lock {
                            // Ensure the button has been held continuously for ~1 second
                            if press_time.elapsed() >= Duration::from_millis(950) {
                                println!("[Mouse Hook] Middle mouse button held for 1s. Triggering screen capture!");
                                let _ = timer_app.emit("capture:trigger", ());
                            }
                        }
                    });
                }
                EventType::ButtonRelease(rdev::Button::Middle) => {
                    let mut lock = pressed_state.lock().unwrap();
                    *lock = None;
                }
                _ => {}
            }
        }) {
            eprintln!("[Mouse Hook] Error starting global mouse hook: {:?}", error);
        }
    });
}
