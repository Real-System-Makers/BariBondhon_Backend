import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlatsService } from './flats.service';
import { FlatsController } from './flats.controller';
import { Flat, FlatSchema } from './entities/flat.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Rent, RentSchema } from '../rents/entities/rent.entity';
import { MoveOutRequest, MoveOutRequestSchema } from '../move-out/entities/move-out-request.entity';
import { ToLetModule } from '../to-let/to-let.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Flat.name, schema: FlatSchema },
      { name: User.name, schema: UserSchema },
      { name: Rent.name, schema: RentSchema },
      { name: MoveOutRequest.name, schema: MoveOutRequestSchema },
    ]),
    ToLetModule,
  ],
  controllers: [FlatsController],
  providers: [FlatsService],
})
export class FlatsModule {}
