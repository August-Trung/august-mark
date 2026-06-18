use std::thread;
use std::time::{Duration, Instant};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};
use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, GetMessageW, SetWindowsHookExW, UnhookWindowsHookEx,
    HHOOK, MSG, WH_MOUSE_LL, WM_MBUTTONDOWN, WM_MBUTTONUP,
};

static mut HOOK: Option<HHOOK> = None;
static mut PRESSED_STATE: Option<Arc<Mutex<Option<Instant>>>> = None;
static mut APP_HANDLE: Option<AppHandle> = None;

unsafe extern "system" fn mouse_callback(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let msg_id = wparam.0 as u32;
        if msg_id == WM_MBUTTONDOWN || msg_id == WM_MBUTTONUP {
            if let Some(app) = APP_HANDLE.as_ref() {
                // Guard: Ignore events if the overlay is already active
                let active = if let Some(state) = app.try_state::<crate::state::AppState>() {
                    state.is_overlay_active.lock().map(|active| *active).unwrap_or(false)
                } else {
                    false
                };

                if !active {
                    if msg_id == WM_MBUTTONDOWN {
                        let now = Instant::now();
                        if let Some(pressed_state) = PRESSED_STATE.as_ref() {
                            let mut lock = pressed_state.lock().unwrap();
                            *lock = Some(now);
                        }

                        let timer_app = app.clone();
                        let timer_state = PRESSED_STATE.as_ref().map(|s| s.clone());
                        thread::spawn(move || {
                            thread::sleep(Duration::from_millis(1000));
                            if let Some(state) = timer_state {
                                let lock = state.lock().unwrap();
                                if let Some(press_time) = *lock {
                                    if press_time.elapsed() >= Duration::from_millis(950) {
                                        println!("[Mouse Hook] Middle mouse button held for 1s. Triggering screen capture!");
                                        let _ = timer_app.emit("capture:trigger", ());
                                    }
                                }
                            }
                        });
                    } else if msg_id == WM_MBUTTONUP {
                        if let Some(pressed_state) = PRESSED_STATE.as_ref() {
                            let mut lock = pressed_state.lock().unwrap();
                            *lock = None;
                        }
                    }
                }
            }
        }
    }
    CallNextHookEx(HOOK.unwrap_or_default(), code, wparam, lparam)
}

/// Start the global mouse listener background thread.
/// Detects middle mouse button holds >= 1 second and triggers capture.
/// Uses native Win32 WH_MOUSE_LL hook instead of WH_KEYBOARD_LL to avoid conflicts with IME keyboards.
pub fn start_mouse_hook(app_handle: AppHandle) {
    println!("[Mouse Hook] Initializing global middle click hold listener using WH_MOUSE_LL...");
    
    thread::spawn(move || {
        unsafe {
            APP_HANDLE = Some(app_handle);
            PRESSED_STATE = Some(Arc::new(Mutex::new(None)));
            
            let hook = SetWindowsHookExW(
                WH_MOUSE_LL,
                Some(mouse_callback),
                None,
                0,
            );
            
            match hook {
                Ok(h) => {
                    HOOK = Some(h);
                    println!("[Mouse Hook] Global Windows mouse hook registered successfully.");
                    
                    let mut msg = MSG::default();
                    while GetMessageW(&mut msg, HWND::default(), 0, 0).as_bool() {
                        // Keep processing messages for the hook
                    }
                    
                    let _ = UnhookWindowsHookEx(h);
                }
                Err(e) => {
                    eprintln!("[Mouse Hook] Error starting global mouse hook: {:?}", e);
                }
            }
        }
    });
}
