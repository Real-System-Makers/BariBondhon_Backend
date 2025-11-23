import { IsNumber, IsPositive, Min } from 'class-validator';

export class UpdateElectricityDto {
  @IsNumber()
  @Min(0)
  currentReading: number;

  @IsNumber()
  @IsPositive()
  ratePerUnit?: number; // Optional, defaults to 8 BDT
}
