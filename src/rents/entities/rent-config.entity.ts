import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export type RentConfigDocument = RentConfig & Document;

@Schema({ timestamps: true })
export class RentConfig {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true })
  owner: User;

  @Prop({ required: true, default: true })
  autoGenerateRents: boolean;

  @Prop({ required: true, default: 1, min: 1, max: 28 })
  generationDay: number; // Day of month to generate rents (1-28)

  @Prop({ required: true, default: 5, min: 1, max: 28 })
  dueDayOffset: number; // Day of month when rent is due (1-28)

  @Prop({ required: true, default: 0, min: 0 })
  gracePeriodDays: number; // Days after due date before late fees apply

  @Prop({ required: true, default: true })
  lateFeeEnabled: boolean;

  @Prop({ required: true, default: 2, min: 0, max: 100 })
  lateFeePercentagePerWeek: number; // Percentage of rent per week overdue

  @Prop({ required: true, default: 10, min: 0, max: 100 })
  maxLateFeePercentage: number; // Maximum late fee percentage
}

export const RentConfigSchema = SchemaFactory.createForClass(RentConfig);
