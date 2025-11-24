import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AddReplyDto } from './dto/add-reply.dto';
import { MaintenanceStatus } from './types/maintenance-status.enum';
import { Role } from '../common/types/role.enum';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createMaintenanceRequestDto: CreateMaintenanceRequestDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.maintenanceService.create(createMaintenanceRequestDto, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @GetCurrentUser('_id') userId: string,
    @GetCurrentUser('role') userRole: Role,
    @Query('status') status?: MaintenanceStatus,
  ) {
    if (userRole === Role.TENANT) {
      return this.maintenanceService.findAllForTenant(userId);
    } else {
      return this.maintenanceService.findAllForOwner(
        userId,
        status as MaintenanceStatus,
      );
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  getStats(@GetCurrentUser('_id') userId: string) {
    return this.maintenanceService.getStats(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(
    @Param('id') id: string,
    @GetCurrentUser('_id') userId: string,
    @GetCurrentUser('role') userRole: Role,
  ) {
    return this.maintenanceService.findOne(id, userId, userRole);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.maintenanceService.updateStatus(id, updateStatusDto, userId);
  }

  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  addReply(
    @Param('id') id: string,
    @Body() addReplyDto: AddReplyDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.maintenanceService.addReply(id, addReplyDto, userId);
  }
}

