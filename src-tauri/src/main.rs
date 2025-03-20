#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use std::sync::Mutex;
use std::time::Duration;
use tauri::State;
use serde::{Serialize, Deserialize};
use std::fs;
use std::path::PathBuf;

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
fn show_save_dialog(title: &str, message: &str, buttons: Vec<&str>, default_id: u32, cancel_id: u32) -> Result<u32, String> {
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
    let app_state = AppState {
        config: Mutex::new(Config::default()),
    };

    tauri::Builder::default()
        .manage(app_state)
        .system_tray(SystemTray::new().with_menu(create_tray_menu()))
        .on_system_tray_event(|app, event| match event {
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
                            let settings_window = tauri::WindowBuilder::new(app, "settings", tauri::WindowUrl::App("settings.html".into()))
                                .title("Configurações")
                                .inner_size(800.0, 600.0)
                                .resizable(true)
                                .center()
                                .build()
                                .unwrap();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            show_save_dialog,
            close_settings,
            close_settings_and_show_popup
        ])
        .setup(|app| {
            let main_window = tauri::WindowBuilder::new(app, "main", tauri::WindowUrl::App("index.html".into()))
                .title("Iacula")
                .transparent(true)
                .decorations(false)
                .always_on_top(true)
                .resizable(false)
                .inner_size(220.0, 260.0)
                .position(0.0, 0.0)
                .build()?;
            
            main_window.hide()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 