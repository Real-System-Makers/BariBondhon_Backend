import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoveOutService } from './move-out.service';
import { MoveOutController } from './move-out.controller';
import {
  MoveOutRequest,
  MoveOutRequestSchema,
} from './entities/move-out-request.entity';
import { ToLetModule } from '../to-let/to-let.module';
import { Flat, FlatSchema } from '../flats/entities/flat.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { TenantsModule } from '../tenants/tenants.module';
import { MoveOutScheduler } from './move-out.scheduler';
// Assuming ToLetModule is in '../to-let/to-let.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MoveOutRequest.name, schema: MoveOutRequestSchema },
      { name: Flat.name, schema: FlatSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ToLetModule, // Added ToLetModule here
    UserModule,
    TenantsModule,
  ],
  controllers: [MoveOutController],
  providers: [MoveOutService, MoveOutScheduler],
})
export class MoveOutModule { }
