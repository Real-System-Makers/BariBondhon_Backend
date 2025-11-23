import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateRentDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  flatId: string;

  @IsString()
  @IsNotEmpty()
  month: string; // Format: "2025-11"

  @IsNumber()
  @Min(2000)
  year: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  electricityBill?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  gasBill?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  waterBill?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceBill?: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsOptional()
  note?: string;
}
