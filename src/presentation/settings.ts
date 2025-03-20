const { invoke } = require('@tauri-apps/api/tauri');

interface AppConfig {
    auto_start: boolean;
    notification_interval: number;
    popup_duration: number;
}

let hasUnsavedChanges = false;
let isClosing = false;

// Load current settings
window.addEventListener('DOMContentLoaded', async () => {
    const config = await invoke('get_config') as AppConfig;
    const autoStartInput = document.getElementById('autoStart') as HTMLInputElement;
    const popupIntervalInput = document.getElementById('popupInterval') as HTMLInputElement;
    const popupDurationInput = document.getElementById('popupDuration') as HTMLInputElement;

    if (autoStartInput) autoStartInput.checked = config.auto_start;
    if (popupIntervalInput) popupIntervalInput.value = config.notification_interval.toString();
    if (popupDurationInput) popupDurationInput.value = config.popup_duration.toString();

    // Add change listeners to all inputs
    addChangeListeners();
});

function addChangeListeners() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            hasUnsavedChanges = true;
        });
    });
}

function getCurrentSettings(): AppConfig {
    return {
        auto_start: (document.getElementById('autoStart') as HTMLInputElement).checked,
        notification_interval: parseInt((document.getElementById('popupInterval') as HTMLInputElement).value) || 20,
        popup_duration: parseInt((document.getElementById('popupDuration') as HTMLInputElement).value) || 10
    };
}

// Save settings function
async function saveSettings(): Promise<void> {
    const config = getCurrentSettings();
    await invoke('save_config', { config });
    hasUnsavedChanges = false;
    await invoke('close_settings_and_show_popup');
}

// Handle window close
window.addEventListener('beforeunload', async (e) => {
    if (hasUnsavedChanges && !isClosing) {
        e.preventDefault();
        const choice = await invoke('show_save_dialog') as number;
        if (choice === 2) {
            e.preventDefault();
            return;
        }

        isClosing = true;
        if (choice === 0) {
            const config = getCurrentSettings();
            await invoke('save_config', { config });
        }
        await invoke('close_settings');
    }
});

// Attach save function to window for HTML access
(window as any).saveSettings = saveSettings; 