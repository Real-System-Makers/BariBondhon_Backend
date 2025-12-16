import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateHouseDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  waterBill?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gasBill?: number;

  @IsNotEmpty()
  @IsString()
  division: string;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsNotEmpty()
  @IsString()
  policeStation: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  registrationNumber: string;
}
