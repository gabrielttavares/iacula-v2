const { invoke } = require('@tauri-apps/api/tauri');
const { listen } = require('@tauri-apps/api/event');
import { DailyContent } from '../domain/entities/DailyContent';

interface TauriEvent<T> {
    payload: T;
}

// Function to update the popup content
function updatePopupContent(content: DailyContent) {
    const container = document.querySelector('.container');
    if (!container) return;

    // Update content
    const contentElement = container.querySelector('.content');
    if (contentElement) {
        contentElement.textContent = content.quote.text;
    }

    // Update image
    const imageElement = container.querySelector('.image') as HTMLImageElement;
    if (imageElement) {
        imageElement.src = content.image.path;
    }

    // Show container with animation
    container.classList.add('show');
}

// Listen for content updates from the main process
listen('update-content', (event: TauriEvent<DailyContent>) => {
    updatePopupContent(event.payload);
});

// Handle window dragging
document.addEventListener('mousedown', (event) => {
    if (event.button === 0) { // Left click
        invoke('window-drag-start');
    }
});

// Handle window close button
document.querySelector('.close-button')?.addEventListener('click', () => {
    invoke('window-close');
}); 