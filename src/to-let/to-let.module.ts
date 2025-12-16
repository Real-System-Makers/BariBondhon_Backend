import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Flat, FlatSchema } from '../flats/entities/flat.entity';
import {
  MoveOutRequest,
  MoveOutRequestSchema,
} from '../move-out/entities/move-out-request.entity';
import { ToLetPost, ToLetPostSchema } from './entities/to-let-post.entity';
import { ToLetController } from './to-let.controller';
import { ToLetService } from './to-let.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Flat.name, schema: FlatSchema },
      { name: MoveOutRequest.name, schema: MoveOutRequestSchema },
      { name: ToLetPost.name, schema: ToLetPostSchema },
    ]),
  ],
  controllers: [ToLetController],
  providers: [ToLetService],
  exports: [ToLetService],
})
export class ToLetModule { }
