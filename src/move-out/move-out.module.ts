import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MoveOutService } from './move-out.service';
import { MoveOutController } from './move-out.controller';
import { MoveOutRequest, MoveOutRequestSchema } from './entities/move-out-request.entity';
import { Flat, FlatSchema } from '../flats/entities/flat.entity';
import { UserModule } from '../user/user.module';
import { TenantsModule } from '../tenants/tenants.module';
import { MoveOutScheduler } from './move-out.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MoveOutRequest.name, schema: MoveOutRequestSchema },
      { name: Flat.name, schema: FlatSchema },
    ]),
    UserModule,
    TenantsModule,
  ],
  controllers: [MoveOutController],
  providers: [MoveOutService, MoveOutScheduler],
})
export class MoveOutModule {}
