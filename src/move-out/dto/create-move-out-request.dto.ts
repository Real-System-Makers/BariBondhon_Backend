import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateMoveOutRequestDto {
  @IsDateString()
  moveOutMonth: string; // ISO Date string (e.g., "2024-02-01")

  @IsOptional()
  @IsString()
  note?: string;
}
