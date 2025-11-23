import {
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateRentConfigDto {
  @IsBoolean()
  @IsOptional()
  autoGenerateRents?: boolean;

  @IsNumber()
  @Min(1)
  @Max(28)
  @IsOptional()
  generationDay?: number;

  @IsNumber()
  @Min(1)
  @Max(28)
  @IsOptional()
  dueDayOffset?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gracePeriodDays?: number;

  @IsBoolean()
  @IsOptional()
  lateFeeEnabled?: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  lateFeePercentagePerWeek?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxLateFeePercentage?: number;
}
