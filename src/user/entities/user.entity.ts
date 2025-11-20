import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, InferSchemaType } from 'mongoose';
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
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserType = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserType>;
