import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddReplyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}

