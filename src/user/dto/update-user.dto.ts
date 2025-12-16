import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  minimumNoticePeriod?: number;

  @IsOptional()
  bKashNumber?: string;

  @IsOptional()
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
  };
}
