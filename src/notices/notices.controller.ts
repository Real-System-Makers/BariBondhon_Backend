import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createNoticeDto: CreateNoticeDto,
    @GetCurrentUser('_id') userId: string,
  ) {
    return this.noticesService.create(createNoticeDto, userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@GetCurrentUser('_id') userId: string) {
    return this.noticesService.findAll(userId);
  }
}

