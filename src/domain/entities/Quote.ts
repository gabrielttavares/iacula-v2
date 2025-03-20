export class Quote {
    constructor(
        public readonly text: string,
        public readonly theme: string
    ) { }

    static create(text: string, theme: string): Quote {
        if (!text || !theme) {
            throw new Error('Quote text and theme are required');
        }
        return new Quote(text, theme);
    }
} 