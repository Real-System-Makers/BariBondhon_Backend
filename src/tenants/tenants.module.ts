import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { Flat, FlatSchema } from '../flats/entities/flat.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Flat.name, schema: FlatSchema }]),
    UserModule,
    AuthModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
