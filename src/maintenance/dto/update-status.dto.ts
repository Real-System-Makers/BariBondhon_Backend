import { IsEnum, IsNotEmpty } from 'class-validator';
import { MaintenanceStatus } from '../types/maintenance-status.enum';

export class UpdateStatusDto {
  @IsEnum(MaintenanceStatus)
  @IsNotEmpty()
  status: MaintenanceStatus;
}

