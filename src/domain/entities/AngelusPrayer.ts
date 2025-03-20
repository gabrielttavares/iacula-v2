export interface Verse {
    verse: string;
    response: string;
}

export interface AngelusPrayer {
    title: string;
    verses: Verse[];
    prayer: string;
}

export interface AngelusContent {
    regular: AngelusPrayer;
    easter: AngelusPrayer;
} 