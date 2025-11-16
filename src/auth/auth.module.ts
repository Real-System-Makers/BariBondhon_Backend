import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Auth, AuthSchema } from './entities/auth.entity';
import { AtStrategy } from './strategies/access-token.strategies';
import { RtStrategy } from './strategies/refresh-token.strategies';
import { UserModule } from 'src/user/user.module';
import { HashService } from 'src/common/services/hash.service';

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Auth.name, schema: AuthSchema }]),
    UserModule,
  ],
  providers: [AuthService, HashService, AtStrategy, RtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
