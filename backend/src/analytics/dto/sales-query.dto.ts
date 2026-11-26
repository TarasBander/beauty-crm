import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

/** Перший рік, з якого CRM показує історію продажів. */
export const SALES_START_YEAR = 2020;

export enum SalesPeriod {
  MONTH = 'month',
  YEAR = 'year',
}

/**
 * `GET /analytics/sales?period=month&year=2024` — 12 місяців одного року;
 * `GET /analytics/sales?period=year` — по роках від SALES_START_YEAR.
 * Верхню межу року (поточний рік) перевіряє сервіс: декоратор рахувався б
 * один раз при старті і "застряг" би в минулому році після 1 січня.
 */
export class SalesQueryDto {
  @IsOptional()
  @IsEnum(SalesPeriod)
  period: SalesPeriod = SalesPeriod.MONTH;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(SALES_START_YEAR)
  year?: number;
}
