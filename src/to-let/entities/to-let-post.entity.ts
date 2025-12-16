
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Flat } from '../../flats/entities/flat.entity';

export type ToLetPostDocument = ToLetPost & Document;

@Schema({ timestamps: true })
export class ToLetPost {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: true, unique: true })
    flat: Flat;

    @Prop({ required: true })
    availabilityStatus: string; // "Vacant" or "Available from..."

    @Prop({ required: true, default: true })
    isAvailable: boolean;

    @Prop({ required: false })
    availableFromDate: Date;
}

export const ToLetPostSchema = SchemaFactory.createForClass(ToLetPost);
