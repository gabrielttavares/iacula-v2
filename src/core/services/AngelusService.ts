import { EasterDateService } from './easterDateService';
import { readTextFile, readDir, BaseDirectory } from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';

export interface AngelusPrayer {
    title: string;
    content: string;
    responses: string[];
    imagePath?: string;
}

interface AngelusContent {
    prayers: AngelusPrayer[];
}

export class AngelusService {
    private prayers: AngelusPrayer[] = [];

    constructor() {
        this.loadPrayers();
    }

    private async loadPrayers(): Promise<void> {
        try {
            const prayersPath = await join('prayers', 'prayers.json');
            const prayersContent = await readTextFile(prayersPath, { dir: BaseDirectory.Resource });
            const content: AngelusContent = JSON.parse(prayersContent);
            this.prayers = content.prayers;
        } catch (error) {
            console.error('Error loading prayers:', error);
            this.prayers = [];
        }
    }

    public async getCurrentPrayer(): Promise<AngelusPrayer | null> {
        if (this.prayers.length === 0) {
            return null;
        }

        const isEaster = EasterDateService.isEasterSeason(new Date());
        const prayer = this.prayers.find(p => isEaster ? p.title === 'Regina Caeli' : p.title === 'Angelus');
        return prayer || null;
    }

    public async getImagePath(imageName: string): Promise<string | null> {
        try {
            const imagePath = await join('images', imageName);
            // Using an alternative method without convertFileSrc in Tauri v1
            return 'asset:///' + imagePath;
        } catch (error) {
            console.error('Error getting image path:', error);
            return null;
        }
    }

    public shouldShowAngelus(): boolean {
        const now = new Date();
        return now.getHours() === 12 && now.getMinutes() === 0;
    }

    public async getAngelusImagePath(): Promise<string | null> {
        try {
            const imagesDir = await join('images', 'angelus');
            const entries = await readDir(imagesDir, { dir: BaseDirectory.Resource });
            const images = entries.filter((entry) => {
                const filename = entry.name?.toLowerCase() || '';
                return !entry.children && (filename.endsWith('.jpg') || filename.endsWith('.png'));
            });

            if (images.length === 0) {
                return null;
            }

            const randomImage = images[Math.floor(Math.random() * images.length)];
            const imagePath = await join(imagesDir, randomImage.name || '');
            // Using an alternative method without convertFileSrc in Tauri v1
            return 'asset:///' + imagePath;
        } catch (error) {
            console.error('Error getting Angelus image:', error);
            return null;
        }
    }

    public async getReginaCaeliImagePath(): Promise<string | null> {
        try {
            const imagesDir = await join('images', 'reginaCaeli');
            const entries = await readDir(imagesDir, { dir: BaseDirectory.Resource });
            const images = entries.filter((entry) => {
                const filename = entry.name?.toLowerCase() || '';
                return !entry.children && (filename.endsWith('.jpg') || filename.endsWith('.png'));
            });

            if (images.length === 0) {
                return null;
            }

            const randomImage = images[Math.floor(Math.random() * images.length)];
            const imagePath = await join(imagesDir, randomImage.name || '');
            // Using an alternative method without convertFileSrc in Tauri v1
            return 'asset:///' + imagePath;
        } catch (error) {
            console.error('Error getting Regina Caeli image:', error);
            return null;
        }
    }
} 