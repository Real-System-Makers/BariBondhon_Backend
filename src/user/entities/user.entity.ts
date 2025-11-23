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
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserType = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserType>;
