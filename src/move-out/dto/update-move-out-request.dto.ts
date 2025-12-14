import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { MoveOutRequestStatus } from '../entities/move-out-request.entity';

export class UpdateMoveOutRequestDto {
  @IsEnum(MoveOutRequestStatus)
  status: MoveOutRequestStatus;

  @IsOptional()
  @IsDateString()
  moveOutMonth?: string; // Owner can override the month
}
