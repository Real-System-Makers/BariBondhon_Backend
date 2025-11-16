import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, InferSchemaType, HydratedDocument } from 'mongoose';
import { User } from 'src/user/entities/user.entity';
import { AbstractEntity } from 'src/db/abstract.entity';

@Schema()
export class Auth extends AbstractEntity<Auth> {
  @Prop({ type: SchemaTypes.ObjectId, ref: User.name })
  user: User;

  @Prop({ type: SchemaTypes.String, default: null })
  refreshToken: string | null;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);

export type AuthType = InferSchemaType<typeof AuthSchema>;
export type AuthDocument = HydratedDocument<AuthType>;
