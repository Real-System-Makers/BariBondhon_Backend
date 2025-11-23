import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { HousesService } from './houses.service';
import { UpdateHouseDto } from './dto/update-house.dto';

@Controller('houses')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findOrCreate(@GetCurrentUser('_id') userId: string) {
    return this.housesService.findOrCreate(userId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  update(
    @GetCurrentUser('_id') userId: string,
    @Body() updateHouseDto: UpdateHouseDto,
  ) {
    return this.housesService.update(userId, updateHouseDto);
  }
}
