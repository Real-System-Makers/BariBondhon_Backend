import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RecordPaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
