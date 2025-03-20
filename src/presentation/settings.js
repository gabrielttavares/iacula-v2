let hasUnsavedChanges = false;
let originalSettings = {};
let isClosing = false;

// Load current settings
window.addEventListener('DOMContentLoaded', async () => {
    const config = await invoke('get_config');
    originalSettings = { ...config };
    document.getElementById('autoStart').checked = config.auto_start || false;
    document.getElementById('popupInterval').value = config.notification_interval || 20;
    document.getElementById('popupDuration').value = config.popup_duration || 10;

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

function getCurrentSettings() {
    return {
        auto_start: document.getElementById('autoStart').checked,
        notification_interval: parseInt(document.getElementById('popupInterval').value) || 20,
        popup_duration: parseInt(document.getElementById('popupDuration').value) || 10
    };
}

async function saveSettings() {
    const config = getCurrentSettings();
    await invoke('save_config', { config });
    hasUnsavedChanges = false;
    await invoke('close_settings_and_show_popup');
}

// Handle window close
window.addEventListener('beforeunload', async (e) => {
    if (hasUnsavedChanges && !isClosing) {
        e.preventDefault();
        const choice = await invoke('show_save_dialog', {
            title: 'Alterações não salvas',
            message: 'Deseja salvar as alterações feitas nas configurações?',
            buttons: ['Salvar', 'Não Salvar', 'Cancelar'],
            defaultId: 0,
            cancelId: 2
        });

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