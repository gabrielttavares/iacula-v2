import { Image } from '../entities/Image';
import { Quote } from '../entities/Quote';
import { DailyContent } from '../entities/DailyContent';

export interface IContentRepository {
    getDailyContent(date: Date): Promise<DailyContent>;
    getImagesBySeason(season: 'easter' | 'ordinary'): Promise<Image[]>;
    getQuotesByDayOfWeek(dayOfWeek: number): Promise<Quote[]>;
    saveDailyContent(content: DailyContent): Promise<void>;
} 