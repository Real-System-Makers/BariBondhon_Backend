import { IsNotEmpty, IsString } from 'class-validator';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

export class SignUpDto extends CreateUserDto {
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
