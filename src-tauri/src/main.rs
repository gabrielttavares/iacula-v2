#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use std::sync::Mutex;
use tauri::State;
use serde::{Serialize, Deserialize};

#[derive(Default, Serialize, Deserialize, Clone)]
struct Config {
    auto_start: bool,
    show_in_taskbar: bool,
    popup_duration: u32,
    notification_interval: u32,
}

struct AppState {
    config: Mutex<Config>,
}

#[tauri::command]
fn get_config(state: State<'_, AppState>) -> Result<Config, String> {
    Ok(state.config.lock().unwrap().clone())
}

#[tauri::command]
fn save_config(config: Config, state: State<'_, AppState>) -> Result<(), String> {
    *state.config.lock().unwrap() = config;
    Ok(())
}

#[tauri::command]
fn show_save_dialog(_title: &str, _message: &str, _buttons: Vec<&str>, _default_id: u32, _cancel_id: u32) -> Result<u32, String> {
    // TODO: Implement native dialog
    Ok(0)
}

#[tauri::command]
fn close_settings(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("settings") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn close_settings_and_show_popup(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_window("settings") {
        window.close().map_err(|e| e.to_string())?;
    }
    if let Some(window) = app.get_window("main") {
        window.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn create_tray_menu() -> SystemTrayMenu {
    SystemTrayMenu::new()
        .add_item(tauri::CustomMenuItem::new("show", "Mostrar Jaculatória"))
        .add_item(tauri::CustomMenuItem::new("angelus", "Exibir Angelus"))
        .add_item(tauri::CustomMenuItem::new("regina", "Exibir Regina Caeli"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(tauri::CustomMenuItem::new("settings", "Configurações"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(tauri::CustomMenuItem::new("quit", "Sair"))
}

fn main() {
    println!("Starting application...");
    
    let app_state = AppState {
        config: Mutex::new(Config::default()),
    };
    
    println!("Initializing Tauri builder...");

    tauri::Builder::default()
        .manage(app_state)
        .system_tray(SystemTray::new().with_menu(create_tray_menu()))
        .on_system_tray_event(|app, event| {
            println!("System tray event received");
            match event {
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "show" => {
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                        }
                        "settings" => {
                            if let Some(window) = app.get_window("settings") {
                                window.set_focus().unwrap();
                            } else {
                                let window = app.get_window("settings").unwrap();
                                window.show().unwrap();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            show_save_dialog,
            close_settings,
            close_settings_and_show_popup
        ])
        .setup(|app| {
            println!("Setup complete, all windows defined in tauri.conf.json");
            if let Some(window) = app.get_window("main") {
                window.hide()?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 