import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { UpdateElectricityDto } from './update-electricity.dto';

class ElectricityUpdate {
  @IsString()
  @IsNotEmpty()
  flatId: string;

  @IsNumber()
  @Min(0)
  currentReading: number;
}

export class BatchUpdateElectricityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElectricityUpdate)
  updates: ElectricityUpdate[];
}
