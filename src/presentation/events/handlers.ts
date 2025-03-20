import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';
import { Window } from '@tauri-apps/api/window';

interface Content {
    text: string;
    author?: string;
    source?: string;
}

interface Prayer {
    title: string;
    content: string[];
    responses: string[];
    imagePath?: string;
}

export async function setupEventHandlers() {
    const currentWindow = await Window.getCurrent();

    // Listen for content updates
    await listen<Content>('update-content', async (event) => {
        const content = event.payload;
        const contentElement = document.getElementById('content');
        if (contentElement) {
            contentElement.textContent = content.text;
        }

        const authorElement = document.getElementById('author');
        if (authorElement && content.author) {
            authorElement.textContent = content.author;
        }

        const sourceElement = document.getElementById('source');
        if (sourceElement && content.source) {
            sourceElement.textContent = content.source;
        }
    });

    // Listen for auto-close event
    await listen('auto-close', async () => {
        await currentWindow.hide();
    });

    // Listen for angelus content updates
    await listen<Prayer>('angelus-window-ready', async (event) => {
        const prayer = event.payload;
        const titleElement = document.getElementById('prayer-title');
        const contentElement = document.getElementById('prayer-content');
        const responsesElement = document.getElementById('prayer-responses');
        const imageElement = document.getElementById('prayer-image') as HTMLImageElement;

        if (titleElement) {
            titleElement.textContent = prayer.title;
        }

        if (contentElement) {
            contentElement.innerHTML = prayer.content
                .map((line: string) => `<p>${line}</p>`)
                .join('');
        }

        if (responsesElement) {
            responsesElement.innerHTML = prayer.responses
                .map((response: string) => `<p class="response">${response}</p>`)
                .join('');
        }

        if (imageElement && prayer.imagePath) {
            imageElement.src = prayer.imagePath;
        }
    });

    // Handle close button clicks
    const closeButton = document.getElementById('close-button');
    if (closeButton) {
        closeButton.addEventListener('click', async () => {
            await currentWindow.hide();
        });
    }

    // Handle settings form submission
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const config = {
                autoStart: formData.get('autoStart') === 'true',
                showInTaskbar: formData.get('showInTaskbar') === 'true',
                popupDuration: parseInt(formData.get('popupDuration') as string) || 10
            };
            await invoke('save_settings', { config });
        });
    }
}

// Initialize event handlers when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupEventHandlers().catch(console.error);
}); 