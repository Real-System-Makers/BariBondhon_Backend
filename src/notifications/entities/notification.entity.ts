import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { Rent } from '../../rents/entities/rent.entity';

import {
  NotificationType,
  NotificationPriority,
} from '../types/notification.enum';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  recipient: User;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({
    required: true,
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Rent', required: false })
  relatedRent: Rent;

  @Prop({ required: false, default: false })
  isRead: boolean;

  @Prop({ required: false })
  readAt: Date;

  @Prop({ type: [String], required: true, default: ['in-app'] })
  channels: string[]; // ['in-app', 'email', 'sms']

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  metadata: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
