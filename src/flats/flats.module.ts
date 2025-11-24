import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlatsController } from './flats.controller';
import { FlatsService } from './flats.service';
import { Flat, FlatSchema } from './entities/flat.entity';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { Rent, RentSchema } from '../rents/entities/rent.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Flat.name, schema: FlatSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Rent.name, schema: RentSchema }]),
  ],
  controllers: [FlatsController],
  providers: [FlatsService],
})
export class FlatsModule {}
