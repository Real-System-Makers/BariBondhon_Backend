import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { House } from '../../houses/entities/house.entity';
import { NoticeType } from '../types/notice-type.enum';

export type NoticeDocument = Notice & Document;

@Schema({ timestamps: true })
export class Notice {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  details: string;

  @Prop({ required: true, enum: NoticeType })
  type: NoticeType;

  @Prop({ required: false, default: false })
  isUrgent: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true })
  house: House;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;
}

export const NoticeSchema = SchemaFactory.createForClass(Notice);

