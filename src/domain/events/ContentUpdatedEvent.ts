import { DailyContent } from '../entities/DailyContent';

export class ContentUpdatedEvent {
    constructor(public readonly content: DailyContent) { }

    static create(content: DailyContent): ContentUpdatedEvent {
        return new ContentUpdatedEvent(content);
    }
} 