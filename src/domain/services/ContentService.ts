import { IContentRepository } from '../repositories/IContentRepository';
import { DailyContent } from '../entities/DailyContent';

export class ContentService {
    constructor(private readonly repository: IContentRepository) { }

    async getDailyContent(date: Date = new Date()): Promise<DailyContent> {
        // Try to get existing content for the date
        try {
            const existingContent = await this.repository.getDailyContent(date);
            return existingContent;
        } catch (error) {
            // If no content exists, generate new content
            return this.generateDailyContent(date);
        }
    }

    private async generateDailyContent(date: Date): Promise<DailyContent> {
        const dayOfWeek = date.getDay();
        const season = this.determineSeason(date);

        // Get available content
        const [images, quotes] = await Promise.all([
            this.repository.getImagesBySeason(season),
            this.repository.getQuotesByDayOfWeek(dayOfWeek)
        ]);

        // Select random content
        const image = this.selectRandomItem(images);
        const quote = this.selectRandomItem(quotes);

        // Create and save daily content
        const content = DailyContent.create(image, quote, date);
        await this.repository.saveDailyContent(content);

        return content;
    }

    private determineSeason(date: Date): 'easter' | 'ordinary' {
        // TODO: Implement proper liturgical calendar logic
        // For now, using a simple date-based approach
        const month = date.getMonth();
        const day = date.getDate();

        // Easter season: March 22 to May 31
        if (month === 2 && day >= 22) return 'easter';
        if (month === 3) return 'easter';
        if (month === 4 && day <= 31) return 'easter';

        return 'ordinary';
    }

    private selectRandomItem<T>(items: T[]): T {
        if (items.length === 0) {
            throw new Error('No items available for selection');
        }
        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex];
    }
} 