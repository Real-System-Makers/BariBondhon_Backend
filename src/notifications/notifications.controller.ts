import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { GetCurrentUser } from '../common/decorators/get-current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @GetCurrentUser('_id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const unread = unreadOnly === 'true';
    return this.notificationsService.findUserNotifications(userId, unread);
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  getUnreadCount(@GetCurrentUser('_id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(@Param('id') id: string, @GetCurrentUser('_id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@GetCurrentUser('_id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @GetCurrentUser('_id') userId: string) {
    return this.notificationsService.remove(id, userId);
  }
}
