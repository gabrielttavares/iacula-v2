export type LiturgicalSeason = 'ordinary' | 'lent' | 'easter' | 'advent';

export class EasterDateService {
    private calculateEasterDate(year: number): Date {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;

        return new Date(year, month - 1, day);
    }

    private calculatePentecostDate(easterDate: Date): Date {
        const pentecostDate = new Date(easterDate);
        pentecostDate.setDate(easterDate.getDate() + 49); // 7 weeks after Easter
        return pentecostDate;
    }

    public isEasterSeason(): boolean {
        const today = new Date();
        const year = today.getFullYear();

        // Calculate Easter Sunday
        const easterDate = this.calculateEasterDate(year);

        // Calculate Holy Saturday (day before Easter)
        const holySaturday = new Date(easterDate);
        holySaturday.setDate(easterDate.getDate() - 1);

        // Calculate Pentecost Sunday
        const pentecostDate = this.calculatePentecostDate(easterDate);

        // Check if today is between Holy Saturday and Pentecost Sunday
        return today >= holySaturday && today <= pentecostDate;
    }

    public getCurrentSeason(): LiturgicalSeason {
        if (this.isEasterSeason()) {
            return 'easter';
        }

        // Add other season calculations if needed
        return 'ordinary';
    }
} 