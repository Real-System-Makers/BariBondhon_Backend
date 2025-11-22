import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FlatsController } from './flats.controller';
import { FlatsService } from './flats.service';
import { Flat, FlatSchema } from './entities/flat.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Flat.name, schema: FlatSchema }]),
  ],
  controllers: [FlatsController],
  providers: [FlatsService],
})
export class FlatsModule {}
