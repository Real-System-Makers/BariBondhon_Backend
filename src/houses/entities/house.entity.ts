import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { BillingSystem } from '../enums/billing-system.enum';

export type HouseDocument = House & Document;

@Schema({ timestamps: true })
export class House {
  @Prop({ required: false, default: 0 })
  waterBill: number;

  @Prop({ required: false, default: 0 })
  gasBill: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: false })
  division?: string;

  @Prop({ required: false })
  district?: string;

  @Prop({ required: false })
  policeStation?: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ type: String, enum: BillingSystem, default: BillingSystem.POSTPAID })
  billingSystem: BillingSystem;

  @Prop({ required: false })
  registrationNumber?: string;
}

export const HouseSchema = SchemaFactory.createForClass(House);
