import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @Length(1, 255)
  @Matches(/^\S+$/)
  fcm_token!: string;

  @IsOptional()
  @IsString()
  @Matches(/^web$/)
  platform?: string;
}
