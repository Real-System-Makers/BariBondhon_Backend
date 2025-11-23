import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';
import {
  NotificationType,
  NotificationPriority,
} from '../types/notification.enum';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  relatedRentId?: string;

  @IsString()
  @IsOptional()
  relatedBillingId?: string;

  @IsArray()
  @IsOptional()
  channels?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
