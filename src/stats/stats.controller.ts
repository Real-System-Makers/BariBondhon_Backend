import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Public()
  @Get('public')
  @HttpCode(HttpStatus.OK)
  getPublicStats() {
    return this.statsService.getPublicStats();
  }
}
