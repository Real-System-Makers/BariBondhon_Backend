import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User, UserSchema } from './entities/user.entities';
import { Auth, AuthSchema } from './entities/auth.entity';
import { AtStrategy } from './stratagies/access-token.strategies';
import { RtStrategy } from './stratagies/refresh-token.strategies';

@Module({
    imports: [
        JwtModule.register({}),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: Auth.name, schema: AuthSchema }]),
    ],
    providers: [AuthService, AtStrategy, RtStrategy],
    controllers: [AuthController],
})
export class AuthModule {}