import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { Flat } from '../../flats/entities/flat.entity';
import { House } from '../../houses/entities/house.entity';
import { MaintenanceStatus } from '../types/maintenance-status.enum';
import { MaintenanceIssueType } from '../types/maintenance-issue-type.enum';
import { Role } from '../../common/types/role.enum';

export type MaintenanceRequestDocument = MaintenanceRequest & Document;

const MaintenanceReplySchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: { type: String, enum: Role, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const MaintenanceStatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: MaintenanceStatus, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { _id: false },
);

@Schema({ timestamps: true })
export class MaintenanceRequest {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  tenant: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true })
  flat: Flat;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  owner: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true })
  house: House;

  @Prop({ required: true, enum: MaintenanceIssueType })
  issueType: MaintenanceIssueType;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: true,
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDING,
  })
  status: MaintenanceStatus;

  @Prop({ type: [MaintenanceReplySchema], default: [] })
  replies: mongoose.Types.Array<any>;

  @Prop({ type: [MaintenanceStatusHistorySchema], default: [] })
  statusHistory: mongoose.Types.Array<any>;
}

export const MaintenanceRequestSchema =
  SchemaFactory.createForClass(MaintenanceRequest);

