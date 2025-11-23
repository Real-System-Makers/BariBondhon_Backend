import { IsNotEmpty, IsString } from 'class-validator';

export class AssignTenantDto {
  @IsNotEmpty()
  @IsString()
  tenantId: string;

  @IsNotEmpty()
  @IsString()
  flatId: string;
}
