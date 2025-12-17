import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, InferSchemaType } from 'mongoose';
import * as mongoose from 'mongoose';
import { AbstractEntity } from 'src/db/abstract.entity';
import { Role } from 'src/common/types/role.enum';

@Schema({ timestamps: true })
export class User extends AbstractEntity<User> {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop()
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, enum: Role })
  role: Role;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  owner: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Flat', required: false })
  flat: any;

  @Prop({ default: 1 })
  minimumNoticePeriod: number;

  @Prop({ required: false })
  bKashNumber?: string;

  @Prop({ type: Object, required: false })
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
  };

  @Prop({ type: [{ from: Number, to: Number, rate: Number }], required: false })
  electricitySlabs?: { from: number; to: number; rate: number }[];
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserType = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserType>;
