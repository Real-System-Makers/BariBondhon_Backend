import { IsString, IsNotEmpty, IsNumber, Min, IsDateString } from 'class-validator';

export class GenerateRentsDto {
  @IsString()
  @IsNotEmpty()
  month: string; // Format: "2025-11"

  @IsNumber()
  @Min(2000)
  year: number;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}
