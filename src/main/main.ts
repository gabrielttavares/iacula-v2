import { invoke } from '@tauri-apps/api/tauri';
import { WebviewWindow, Window } from '@tauri-apps/api/window';
import { appDataDir, join } from '@tauri-apps/api/path';
import { app } from '@tauri-apps/api/app';
import { platform } from '@tauri-apps/api/os';
import { ContentService } from '../core/services/contentService';
import { ConfigService } from '../core/services/configService';
import { EasterDateService } from '../core/services/EasterDate';
import { AngelusService } from '../core/services/AngelusService';
import { AngelusPopup } from '../presentation/components/angelus/AngelusPopup';
import * as schedule from 'node-schedule';

let settingsWindow: WebviewWindow | null = null;
let autoCloseTimer: NodeJS.Timeout | null = null;
let configService: ConfigService;
let contentService: ContentService;
let notificationJob: schedule.Job | null = null;
let angelusService: AngelusService;
let angelusPopup: AngelusPopup | null = null;
let angelusJob: schedule.Job | null = null;
let popupWindow: WebviewWindow | null = null;
let easterDateService: EasterDateService;

// Initialize services first
async function initializeServices() {
    const configPath = await join(await appDataDir(), 'config.json');
    configService = new ConfigService(configPath);
    contentService = new ContentService();
    angelusService = new AngelusService();
    easterDateService = new EasterDateService();
}

async function setupAutoStart(enabled: boolean) {
    if (!await app.isPackaged()) return; // Don't set up auto-start in development

    const currentPlatform = await platform();

    // Handle auto-start based on platform
    if (currentPlatform === 'win32') {
        await invoke('set_auto_start', { enabled });
    } else if (currentPlatform === 'darwin') {
        await invoke('set_auto_start', { enabled });
    }
    // Linux auto-start is handled through desktop entry files
}

async function createPopupWindow() {
    // Get screen dimensions using Tauri's API
    const { innerWidth, innerHeight } = window;

    const popupWindow = new WebviewWindow('popup', {
        url: 'popup.html',
        width: 220,
        height: 260,
        x: innerWidth - 240,
        y: innerHeight - 300,
        decorations: false,
        resizable: false,
        alwaysOnTop: true,
        transparent: true,
        visible: false
    });

    const config = await configService?.loadConfig();
    if (config?.showInTaskbar === false) {
        await popupWindow.setSkipTaskbar(true);
    }

    return popupWindow;
}

// Setup event listeners
async function setupEventListeners() {
    const currentWindow = await Window.getCurrent();

    // Listen for close-popup event
    await currentWindow.listen('close-popup', () => {
        console.log('Received close-popup event');
        if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
            autoCloseTimer = null;
        }
        hidePopup();
    });

    // Listen for window-close event
    await currentWindow.listen('window-close', () => {
        console.log('Received window-close event');
        hidePopup();
    });

    // Listen for content-ready event
    await currentWindow.listen('content-ready', async () => {
        console.log('Content ready, showing window');
        const popupWindow = await Window.getByLabel('popup');
        if (popupWindow) {
            await popupWindow.show();
            await popupWindow.setFocus();

            // Set up the auto-close timer
            const config = await configService.getConfig();
            const duration = Math.max(5, config.popupDuration || 10) * 1000;
            console.log('Setting auto-close timer for', duration, 'ms');

            autoCloseTimer = setTimeout(async () => {
                console.log('Auto-close timer triggered');
                await popupWindow.hide();
            }, duration);
        }
    });

    // Listen for get-settings event
    await currentWindow.listen('get-settings', async () => {
        const config = await configService.loadConfig();
        await currentWindow.emit('settings-updated', config);
    });

    // Listen for save-settings event
    await currentWindow.listen('save-settings', async (event: { payload: any }) => {
        const newConfig = event.payload;
        await configService.saveConfig(newConfig);
        await setupAutoStart(newConfig.autoStart);

        const popupWindow = await Window.getByLabel('popup');
        if (popupWindow) {
            await popupWindow.setSkipTaskbar(!newConfig.showInTaskbar);
        }

        if (settingsWindow) {
            await settingsWindow.emit('settings-updated', newConfig);
        }
    });

    // Listen for show-save-dialog event
    await currentWindow.listen('show-save-dialog', async () => {
        if (!settingsWindow) return;

        try {
            const choice = await invoke('show_save_dialog', {
                title: 'Alterações não salvas',
                message: 'Deseja salvar as alterações feitas nas configurações?',
                buttons: ['Salvar', 'Não Salvar', 'Cancelar'],
                defaultId: 0,
                cancelId: 2
            });

            // Don't do anything if Cancel was clicked
            if (choice === 2) {
                return;
            }

            // Send the response back to the renderer
            await settingsWindow.emit('save-dialog-response', choice === 0);
        } catch (error) {
            console.error('Error showing save dialog:', error);
        }
    });

    // Listen for close-settings event
    await currentWindow.listen('close-settings', async () => {
        if (settingsWindow) {
            await settingsWindow.close();
            settingsWindow = null;
        }
    });

    // Listen for close-settings-and-show-popup event
    await currentWindow.listen('close-settings-and-show-popup', async () => {
        if (settingsWindow) {
            await settingsWindow.close();
            settingsWindow = null;
            // Add a small delay before showing popup to ensure the settings window is fully closed
            setTimeout(() => showPopup(), 500);
        }
    });
}

async function hidePopup() {
    console.log('Hiding popup');
    const popupWindow = await Window.getByLabel('popup');
    if (popupWindow) {
        await popupWindow.hide();
    }
}

async function createTray() {
    try {
        // Tauri handles tray icon automatically through tauri.conf.json
        await invoke('setup_tray', {
            tooltip: 'Iacula - Cultivar Presença de Deus',
            menu: [
                { label: 'Mostrar Jaculatória', id: 'show' },
                { label: 'Exibir Angelus', id: 'angelus' },
                { label: 'Exibir Regina Caeli (Tempo Pascal)', id: 'regina' },
                { type: 'separator' },
                { label: 'Configurações', id: 'settings' },
                { type: 'separator' },
                { label: 'Sair', id: 'quit' }
            ]
        });

        // Listen for tray menu events
        const currentWindow = await Window.getCurrent();
        await currentWindow.listen('tray-menu-event', async (event: { payload: unknown }) => {
            const id = event.payload as string;
            switch (id) {
                case 'show':
                    await showPopup();
                    break;
                case 'angelus':
                    await showAngelus();
                    break;
                case 'regina':
                    await showReginaCaeli();
                    break;
                case 'settings':
                    await showSettings();
                    break;
                case 'quit':
                    await app.exit();
                    break;
            }
        });
    } catch (error) {
        console.error('Error creating tray:', error);
    }
}

async function showSettings() {
    if (settingsWindow) {
        await settingsWindow.setFocus();
    } else {
        settingsWindow = new WebviewWindow('settings', {
            url: 'settings.html',
            width: 800,
            height: 600,
            title: 'Configurações',
            resizable: true,
            center: true
        });
    }
}

async function showPopup() {
    try {
        // Create popup window if it doesn't exist
        if (!popupWindow) {
            popupWindow = await createPopupWindow();
        }

        // Get new content
        const content = contentService.getCurrentContent();
        if (content && popupWindow) {
            await popupWindow.emit('update-content', {
                title: 'Jaculatória',
                content: content.text,
                responses: [],
                source: content.source,
                author: content.author
            });
            await popupWindow.show();
            await popupWindow.setFocus();

            // Set up auto-close timer
            const config = await configService.getConfig();
            const duration = Math.max(5, config.popupDuration || 10) * 1000;
            if (autoCloseTimer) {
                clearTimeout(autoCloseTimer);
            }
            autoCloseTimer = setTimeout(async () => {
                if (popupWindow) {
                    await popupWindow.hide();
                }
            }, duration);
        }
    } catch (error) {
        console.error('Error showing popup:', error);
    }
}

async function schedulePopups() {
    try {
        const config = await configService.getConfig();
        const interval = config.notificationInterval;

        if (notificationJob) {
            notificationJob.cancel();
        }

        if (interval > 0) {
            notificationJob = schedule.scheduleJob(`*/${interval} * * * *`, showPopup);
        }
    } catch (error) {
        console.error('Error scheduling popups:', error);
    }
}

// Setup Angelus check interval
async function setupAngelusCheck() {
    const prayerSchedule = '0 12 * * *'; // Every day at 12 PM

    // Cancel existing job if any
    if (angelusJob) {
        angelusJob.cancel();
    }

    angelusJob = schedule.scheduleJob(prayerSchedule, async () => {
        // Show either Angelus or Regina Caeli based on the liturgical season
        const prayer = await angelusService.getCurrentPrayer();
        if (prayer) {
            const isEaster = easterDateService.isEasterSeason();
            if (isEaster) {
                await showReginaCaeli();
            } else {
                await showAngelus();
            }
        }
    });

    console.log('Noon prayer (Angelus/Regina Caeli) scheduled for 12 PM');
}

async function showAngelus() {
    try {
        if (!angelusPopup) {
            angelusPopup = new AngelusPopup();
        }

        const prayer = await angelusService.getCurrentPrayer();
        if (prayer) {
            await angelusPopup.updateContent(prayer);
            await angelusPopup.show(false);
        }
    } catch (error) {
        console.error('Error showing Angelus:', error);
    }
}

async function showReginaCaeli() {
    try {
        if (!angelusPopup) {
            angelusPopup = new AngelusPopup();
        }

        const prayer = await angelusService.getCurrentPrayer();
        if (prayer) {
            await angelusPopup.updateContent(prayer);
            await angelusPopup.show(true);
        }
    } catch (error) {
        console.error('Error showing Regina Caeli:', error);
    }
}

// Initialize the app
async function initialize() {
    await initializeServices();
    await setupEventListeners();
    await createTray();
    console.log('Tray created');
    setupAngelusCheck();
    console.log('Angelus check setup');
    schedulePopups();
    console.log('Popups scheduled');

    // Create the popup window immediately
    console.log('Creating initial popup window...');
    popupWindow = await createPopupWindow();

    // Wait for the window to be ready before showing the popup
    if (popupWindow) {
        // Use Tauri's event system
        const currentWindow = await Window.getCurrent();
        await currentWindow.emit('window-ready');
        console.log('Window finished loading, showing popup...');
        await showPopup();
    }

    // Use Tauri's window close handler
    const mainWindow = await Window.getCurrent();
    await mainWindow.listen('tauri://close-requested', () => {
        // Instead of preventing default, we'll just ignore the close request
        // This keeps the app running in the background
        return;
    });
}

// Start the app
initialize().catch(console.error);