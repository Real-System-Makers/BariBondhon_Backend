import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateHouseDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  waterBill?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gasBill?: number;
}
