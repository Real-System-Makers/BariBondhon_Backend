import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlatsService } from './flats.service';
import { FlatsController } from './flats.controller';
import { Flat, FlatSchema } from './entities/flat.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { ToLetModule } from '../to-let/to-let.module';
import { Rent, RentSchema } from '../rents/entities/rent.entity';
import { ToLetModule } from 'src/to-let/to-let.module'; // Assuming this import is needed for ToLetModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Flat.name, schema: FlatSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ToLetModule,
    MongooseModule.forFeature([{ name: Rent.name, schema: RentSchema }]),
  ],
  controllers: [FlatsController],
  providers: [FlatsService],
})
export class FlatsModule { }
