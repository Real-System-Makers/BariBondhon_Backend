import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';
import { User } from './user.entities';

export type AuthDocument = HydratedDocument<Auth>;

@Schema()
export class Auth {

  @Prop({ type: SchemaTypes.String, default: null })
    refreshToken: string | null;
  @Prop({ type: User })
    user: User;

}

export const AuthSchema = SchemaFactory.createForClass(Auth);
