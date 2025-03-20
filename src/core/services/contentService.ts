import { readTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';

export interface Content {
    text: string;
    author?: string;
    source?: string;
}

export class ContentService {
    private contents: Content[] = [];
    private currentIndex: number = -1;

    constructor() {
        this.loadContents().catch(console.error);
    }

    private async loadContents(): Promise<void> {
        try {
            const contentsPath = await join('contents.json');
            const fileContent = await readTextFile(contentsPath, { dir: BaseDirectory.Resource });
            this.contents = JSON.parse(fileContent);
            this.currentIndex = Math.floor(Math.random() * this.contents.length);
        } catch (error) {
            console.error('Error loading contents:', error);
            // Fallback content if file can't be loaded
            this.contents = [{
                text: "Senhor, tende piedade de nós.",
                author: "Oração tradicional",
                source: "Igreja Católica"
            }];
            this.currentIndex = 0;
        }
    }

    public getCurrentContent(): Content {
        return this.contents[this.currentIndex];
    }

    public getNextContent(): Content {
        this.currentIndex = (this.currentIndex + 1) % this.contents.length;
        return this.getCurrentContent();
    }

    public getRandomContent(): Content {
        const oldIndex = this.currentIndex;
        while (this.currentIndex === oldIndex) {
            this.currentIndex = Math.floor(Math.random() * this.contents.length);
        }
        return this.getCurrentContent();
    }
} 