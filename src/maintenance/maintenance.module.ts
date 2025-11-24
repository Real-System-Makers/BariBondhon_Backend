import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import {
  MaintenanceRequest,
  MaintenanceRequestSchema,
} from './entities/maintenance-request.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Flat, FlatSchema } from '../flats/entities/flat.entity';
import { HousesModule } from '../houses/houses.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MaintenanceRequest.name, schema: MaintenanceRequestSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Flat.name, schema: FlatSchema }]),
    HousesModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}

