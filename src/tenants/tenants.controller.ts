import { Controller, Post, Body, Get, HttpCode, HttpStatus, Patch, Param, Delete } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { AssignTenantDto } from './dto/assign-tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  assign(
    @Body() assignTenantDto: AssignTenantDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.tenantsService.assign(
      assignTenantDto.tenantId,
      assignTenantDto.flatId,
      userId,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.tenantsService.findAll();
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}
