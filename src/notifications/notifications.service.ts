import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';
import { NotificationPriority } from './types/notification.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Create and send a notification
   */
  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const {
      recipientId,
      relatedRentId,
      relatedBillingId,
      ...notificationData
    } = createNotificationDto;

    const notification = new this.notificationModel({
      ...notificationData,
      recipient: recipientId,
      relatedRent: relatedRentId,
      relatedBilling: relatedBillingId,
      priority:
        createNotificationDto.priority || NotificationPriority.MEDIUM,
      channels: createNotificationDto.channels || ['in-app'],
    });

    await notification.save();

    // Send notification through specified channels
    const channels = notification.channels || ['in-app'];

    if (channels.includes('email')) {
      await this.sendEmail(notification);
    }

    if (channels.includes('sms')) {
      await this.sendSMS(notification);
    }

    this.logger.log(
      `Notification sent to user ${recipientId}: ${notification.title}`,
    );

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async findUserNotifications(
    userId: string,
    unreadOnly = false,
  ): Promise<Notification[]> {
    const query: any = { recipient: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    return this.notificationModel
      .find(query)
      .populate('relatedRent')
      .populate('relatedBilling')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({
        recipient: userId,
        isRead: false,
      })
      .exec();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOne({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    return notification.save();
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification
   */
  async remove(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  /**
   * Send email notification (stub - to be implemented with actual email service)
   */
  private async sendEmail(notification: NotificationDocument): Promise<void> {
    // TODO: Implement email sending using Nodemailer or SendGrid
    // For now, just log
    this.logger.log(`Email would be sent: ${notification.title}`);

    // Example implementation:
    // await this.mailerService.sendMail({
    //   to: user.email,
    //   subject: notification.title,
    //   template: './rent-notification',
    //   context: {
    //     title: notification.title,
    //     message: notification.message,
    //   },
    // });
  }

  /**
   * Send SMS notification (stub - to be implemented with SMS service)
   */
  private async sendSMS(notification: NotificationDocument): Promise<void> {
    // TODO: Implement SMS sending using Twilio or similar
    // For now, just log
    this.logger.log(`SMS would be sent: ${notification.title}`);
  }
}
