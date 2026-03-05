declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getWeekInChinese(): string;
    getJieQi(): string;
    getYearWuXing(): string;
    getMonthWuXing(): string;
    getDayWuXing(): string;
    getDayChongDesc(): string;
    getDaySha(): string;
    getZheng(): string;
    getFu(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getYearShengXiao(): string;
  }

  export class HolidayUtil {
    static getHoliday(year: number, month: number, day: number): Holiday | null;
  }

  export class Holiday {
    getName(): string;
    isWork(): boolean;
  }
}
