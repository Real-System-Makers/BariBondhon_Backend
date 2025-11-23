import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { FlatStatus } from '../types/flat-status.enum';

export type FlatDocument = Flat & Document;

@Schema({ timestamps: true })
export class Flat {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  bedrooms: number;

  @Prop({ required: true })
  bathrooms: number;

  @Prop({ required: true })
  rent: number;

  @Prop({ required: true, enum: FlatStatus, default: FlatStatus.VACANT })
  status: FlatStatus;

  @Prop({ required: false })
  note: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  tenant: User;
}

export const FlatSchema = SchemaFactory.createForClass(Flat);
