import { IsBoolean, IsEnum } from 'class-validator';

export enum ReportIntensity {
  NotFelt = 'not_felt',
  Weak = 'weak',
  Light = 'light',
  Moderate = 'moderate',
  Strong = 'strong',
  Severe = 'severe',
}

export class CreateReportDto {
  @IsBoolean()
  felt!: boolean;

  @IsEnum(ReportIntensity)
  intensity!: ReportIntensity;
}
