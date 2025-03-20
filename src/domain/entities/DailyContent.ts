import { Image } from './Image';
import { Quote } from './Quote';

export class DailyContent {
    constructor(
        public readonly image: Image,
        public readonly quote: Quote,
        public readonly date: Date
    ) { }

    static create(image: Image, quote: Quote, date: Date = new Date()): DailyContent {
        if (!image || !quote) {
            throw new Error('Image and quote are required');
        }
        return new DailyContent(image, quote, date);
    }
} 