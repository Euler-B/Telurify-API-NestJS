import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { SismoFilters } from '../domain/sismo.repository';

const toNumber = ({ value }: { value: unknown }) => value === undefined ? value : Number(value);
export class SismoFiltersDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',') : value)
  @IsString({ each: true })
  mag_type?: string[];

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  mag_min?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber()
  mag_max?: number;

  @IsOptional()
  @Transform(({ value }) => value === undefined ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T00:00:00.000Z` : String(value)))
  @IsDate()
  date_from?: Date;

  @IsOptional()
  @Transform(({ value }) => value === undefined ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T23:59:59.999Z` : String(value)))
  @IsDate()
  date_to?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    const normalized = String(value).toLowerCase();
    return ['true', '1', 't'].includes(normalized) ? true : ['false', '0', 'f'].includes(normalized) ? false : value;
  })
  @IsBoolean()
  tsunami?: boolean;

  toFilters(): SismoFilters {
    return { magType: this.mag_type, magMin: this.mag_min, magMax: this.mag_max, dateFrom: this.date_from, dateTo: this.date_to, tsunami: this.tsunami };
  }
}

export class SismoQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === undefined ? 1 : Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => value === undefined ? 25 : Number(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  per_page = 25;

  @IsOptional()
  @Type(() => SismoFiltersDto)
  @ValidateNested()
  filters?: SismoFiltersDto;
}
