export type LiturgicalSeason = 'lent' | 'easter' | 'advent' | 'ordinary';

export class EasterDateService {
    /**
     * Calculate the date of Easter Sunday for a given year
     * using the Meeus/Jones/Butcher algorithm
     */
    public static calculateEasterDate(year: number): Date {
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

    /**
     * Check if a given date is during Easter season
     * (from Ash Wednesday to Pentecost Sunday)
     */
    public static isEasterSeason(date: Date): boolean {
        const year = date.getFullYear();
        const easterDate = this.calculateEasterDate(year);

        // Calculate Ash Wednesday (46 days before Easter)
        const ashWednesday = new Date(easterDate);
        ashWednesday.setDate(easterDate.getDate() - 46);

        // Calculate Pentecost Sunday (49 days after Easter)
        const pentecostSunday = new Date(easterDate);
        pentecostSunday.setDate(easterDate.getDate() + 49);

        return date >= ashWednesday && date <= pentecostSunday;
    }

    /**
     * Get the current liturgical season
     */
    public static getCurrentSeason(): LiturgicalSeason {
        // For now, return 'ordinary' as default
        // TODO: Implement actual season calculation based on Easter dates
        return 'ordinary';
    }
} 