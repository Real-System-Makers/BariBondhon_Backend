import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { ToLetService } from './to-let.service';

@Controller('to-let')
export class ToLetController {
  constructor(private readonly toLetService: ToLetService) { }

  @Public()
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync() {
    return this.toLetService.syncPosts();
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.toLetService.findAll();
  }
}
