import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export type HouseDocument = House & Document;

@Schema({ timestamps: true })
export class House {
  @Prop({ required: false, default: 0 })
  waterBill: number;

  @Prop({ required: false, default: 0 })
  gasBill: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;
}

export const HouseSchema = SchemaFactory.createForClass(House);
