import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { CreateRentDto } from './dto/create-rent.dto';
import { UpdateRentDto } from './dto/update-rent.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { GenerateRentsDto } from './dto/generate-rents.dto';
import { RentsService } from './rents.service';
import { RentStatus } from './types/rent-status.enum';

@Controller('rents')
export class RentsController {
  constructor(private readonly rentsService: RentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createRentDto: CreateRentDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.rentsService.create(createRentDto, userId);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generateMonthlyRents(
    @Body() generateRentsDto: GenerateRentsDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.rentsService.generateMonthlyRents(generateRentsDto, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @GetCurrentUser('_id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('status') status?: RentStatus,
    @Query('tenantId') tenantId?: string,
  ) {
    const filters: any = {};
    if (month) filters.month = month;
    if (year) filters.year = parseInt(year);
    if (status) filters.status = status;
    if (tenantId) filters.tenantId = tenantId;

    return this.rentsService.findAll(userId, filters);
  }

  @Get('tenant')
  @HttpCode(HttpStatus.OK)
  findByTenant(@GetCurrentUser('_id') userId: string) {
    return this.rentsService.findByTenant(userId);
  }

  @Get('stats/:month/:year')
  @HttpCode(HttpStatus.OK)
  getMonthlyStats(
    @Param('month') month: string,
    @Param('year') year: string,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.rentsService.getMonthlyStats(userId, month, parseInt(year));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @GetCurrentUser('_id') userId: string) {
    return this.rentsService.findOne(id, userId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateRentDto: UpdateRentDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.rentsService.update(id, updateRentDto, userId);
  }

  @Patch(':id/payment')
  async recordPayment(
    @Param('id') id: string,
    @Body() recordPaymentDto: RecordPaymentDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    console.log(`[RentsController] recordPayment called for id: ${id} by user: ${userId}`, recordPaymentDto);
    return this.rentsService.recordPayment(id, recordPaymentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @GetCurrentUser('_id') userId: string) {
    return this.rentsService.remove(id, userId);
  }
}
