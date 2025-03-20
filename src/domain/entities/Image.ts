export class Image {
    constructor(
        public readonly path: string,
        public readonly season: 'easter' | 'ordinary',
        public readonly metadata?: {
            title?: string;
            description?: string;
            source?: string;
        }
    ) { }

    static create(
        path: string,
        season: 'easter' | 'ordinary',
        metadata?: {
            title?: string;
            description?: string;
            source?: string;
        }
    ): Image {
        if (!path || !season) {
            throw new Error('Image path and season are required');
        }
        return new Image(path, season, metadata);
    }
} 