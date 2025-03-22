import { readTextFile, BaseDirectory, readDir } from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';
import { DailyContent } from '../../domain/entities/DailyContent';
import { Image } from '../../domain/entities/Image';
import { Quote } from '../../domain/entities/Quote';

export interface Content {
    text: string;
    author?: string;
    source?: string;
}

export class ContentService {
    private contents: Content[] = [];
    private currentIndex: number = -1;
    private images: string[] = [];
    private currentSeason: 'easter' | 'ordinary' = 'ordinary'; // Default to ordinary time

    constructor() {
        this.loadContents().catch(console.error);
        this.loadImages().catch(console.error);
        this.determineSeason();
    }

    private determineSeason() {
        // Simple season determination logic - can be expanded
        // Easter season is typically from Easter Sunday to Pentecost Sunday
        // This is a simplified approach - in a real app, you'd use a liturgical calendar
        this.currentSeason = 'ordinary';
    }

    private async loadImages(): Promise<void> {
        try {
            // Get a list of available image directories based on season
            const imagePath = await join('src', 'assets', 'images', this.currentSeason);
            const directories = await readDir(imagePath);

            if (directories.length > 0) {
                // Randomly select a directory
                const randomDirIndex = Math.floor(Math.random() * directories.length);
                const selectedDir = directories[randomDirIndex];

                // Get all images from this directory
                if (selectedDir.name) {
                    const imagesDir = await readDir(await join(imagePath, selectedDir.name));
                    this.images = imagesDir
                        .filter(entry => !entry.children && entry.name && /\.(jpg|jpeg|png)$/i.test(entry.name))
                        .map(entry => `src/assets/images/${this.currentSeason}/${selectedDir.name}/${entry.name}`);
                }
            }

            if (this.images.length === 0) {
                // Fallback to a default image if none found
                this.images = ['src/assets/images/icon.png'];
            }
        } catch (error) {
            console.error('Error loading images:', error);
            // Fallback to icon if there's an error
            this.images = ['src/assets/images/icon.png'];
        }
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

    public getCurrentContent(): DailyContent {
        const content = this.contents[this.currentIndex];
        const randomImageIndex = Math.floor(Math.random() * this.images.length);
        const imagePath = this.images[randomImageIndex];

        const quote = Quote.create(content.text, 'Jaculatória');
        const image = Image.create(imagePath, this.currentSeason);

        return DailyContent.create(image, quote);
    }

    public getNextContent(): DailyContent {
        this.currentIndex = (this.currentIndex + 1) % this.contents.length;
        return this.getCurrentContent();
    }

    public getRandomContent(): DailyContent {
        const oldIndex = this.currentIndex;
        while (this.currentIndex === oldIndex) {
            this.currentIndex = Math.floor(Math.random() * this.contents.length);
        }
        return this.getCurrentContent();
    }
} 