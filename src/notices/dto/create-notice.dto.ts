import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { NoticeType } from '../types/notice-type.enum';

export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  details: string;

  @IsEnum(NoticeType)
  @IsNotEmpty()
  type: NoticeType;

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;
}

