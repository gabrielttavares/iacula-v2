import { WebviewWindow } from '@tauri-apps/api/window';
import { type AngelusPrayer } from '../../../core/services/AngelusService';

export class AngelusPopup {
    private window: WebviewWindow | null = null;

    constructor() {
        this.createWindow();
    }

    private createWindow() {
        this.window = new WebviewWindow('angelus', {
            url: 'angelus.html',
            width: 400,
            height: 600,
            decorations: false,
            resizable: false,
            alwaysOnTop: true,
            center: true,
            transparent: true,
            visible: false,
            title: 'Angelus'
        });
    }

    public async show(isReginaCaeli: boolean) {
        if (!this.window) {
            this.createWindow();
        }

        if (this.window) {
            await this.window.emit('prayer-type', { isReginaCaeli });
            await this.window.show();
            await this.window.setFocus();
        }
    }

    public async hide() {
        if (this.window) {
            await this.window.hide();
        }
    }

    public async destroy() {
        if (this.window) {
            await this.window.close();
            this.window = null;
        }
    }

    public async updateContent(prayer: AngelusPrayer) {
        if (this.window) {
            await this.window.emit('update-content', prayer);
        }
    }
} 