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
  UseGuards,
} from '@nestjs/common';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateFlatDto } from './dto/create-flat.dto';
import { UpdateFlatDto } from './dto/update-flat.dto';
import { UpdateElectricityDto } from './dto/update-electricity.dto';
import { BatchUpdateElectricityDto } from './dto/batch-update-electricity.dto';
import { FlatsService } from './flats.service';

@Controller('flats')
export class FlatsController {
  constructor(private readonly flatsService: FlatsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createFlatDto: CreateFlatDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.flatsService.create(createFlatDto, userId);
  }

  @Public()
  @Get('public/vacant')
  @HttpCode(HttpStatus.OK)
  findVacant() {
    return this.flatsService.findVacant();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@GetCurrentUser('_id') userId: string) {
    return this.flatsService.findAll(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @GetCurrentUser('_id') userId: string) {
    return this.flatsService.findOne(id, userId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateFlatDto: UpdateFlatDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.flatsService.update(id, updateFlatDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @GetCurrentUser('_id') userId: string) {
    return this.flatsService.remove(id, userId);
  }

  @Patch(':id/electricity')
  @HttpCode(HttpStatus.OK)
  updateElectricity(
    @Param('id') flatId: string,
    @Body() updateElectricityDto: UpdateElectricityDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.flatsService.updateElectricityReading(
      flatId,
      updateElectricityDto.currentReading,
      userId,
      updateElectricityDto.ratePerUnit,
    );
  }

  @Post('electricity/batch')
  @HttpCode(HttpStatus.OK)
  batchUpdateElectricity(
    @Body() batchUpdateDto: BatchUpdateElectricityDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.flatsService.batchUpdateElectricity(
      batchUpdateDto.updates,
      userId,
    );
  }
}
