import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { FlatStatus } from '../types/flat-status.enum';

export class CreateFlatDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  bedrooms: number;

  @IsNumber()
  @Min(1)
  bathrooms: number;

  @IsNumber()
  @Min(0)
  rent: number;

  @IsEnum(FlatStatus)
  status: FlatStatus;

  @IsString()
  @IsOptional()
  note?: string;
}
