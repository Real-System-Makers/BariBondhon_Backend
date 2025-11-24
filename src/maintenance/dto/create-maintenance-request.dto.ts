import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MaintenanceIssueType } from '../types/maintenance-issue-type.enum';

export class CreateMaintenanceRequestDto {
  @IsEnum(MaintenanceIssueType)
  @IsNotEmpty()
  issueType: MaintenanceIssueType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;
}

