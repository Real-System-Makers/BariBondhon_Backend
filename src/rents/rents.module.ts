import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RentsController } from './rents.controller';
import { RentsService } from './rents.service';
import { Rent, RentSchema } from './entities/rent.entity';
import { RentConfig, RentConfigSchema } from './entities/rent-config.entity';
import { Flat, FlatSchema } from '../flats/entities/flat.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { RentAutomationService } from './services/rent-automation.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rent.name, schema: RentSchema }]),
    MongooseModule.forFeature([
      { name: RentConfig.name, schema: RentConfigSchema },
    ]),
    MongooseModule.forFeature([{ name: Flat.name, schema: FlatSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    NotificationsModule,
  ],
  controllers: [RentsController],
  providers: [RentsService, RentAutomationService],
  exports: [RentsService, RentAutomationService],
})
export class RentsModule {}


