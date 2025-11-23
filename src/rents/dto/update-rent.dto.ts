import { PartialType } from '@nestjs/mapped-types';
import { CreateRentDto } from './create-rent.dto';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsString,
  Min,
} from 'class-validator';
import { RentStatus } from '../types/rent-status.enum';

export class UpdateRentDto extends PartialType(CreateRentDto) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @IsEnum(RentStatus)
  @IsOptional()
  status?: RentStatus;

  @IsDateString()
  @IsOptional()
  paidDate?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
