import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { Flat, FlatSchema } from '../flats/entities/flat.entity';
import { Rent, RentSchema } from '../rents/entities/rent.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Flat.name, schema: FlatSchema }]),
    MongooseModule.forFeature([{ name: Rent.name, schema: RentSchema }]),
    UserModule,
    AuthModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
