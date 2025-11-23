import { PartialType } from '@nestjs/mapped-types';
import { CreateRentConfigDto } from './create-rent-config.dto';

export class UpdateRentConfigDto extends PartialType(CreateRentConfigDto) {}
