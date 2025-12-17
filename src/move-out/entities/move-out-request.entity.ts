import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { Flat } from '../../flats/entities/flat.entity';

export enum MoveOutRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED', // Moveout has been processed by scheduler
}

export type MoveOutRequestDocument = MoveOutRequest & Document;

@Schema({ timestamps: true })
export class MoveOutRequest {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  tenant: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true })
  flat: Flat;

  @Prop({ required: true })
  requestDate: Date;

  @Prop({ required: true })
  moveOutMonth: Date; // First day of the month

  @Prop({ required: false })
  note: string;

  @Prop({
    type: String,
    enum: MoveOutRequestStatus,
    default: MoveOutRequestStatus.PENDING,
  })
  status: MoveOutRequestStatus;
}

export const MoveOutRequestSchema =
  SchemaFactory.createForClass(MoveOutRequest);
