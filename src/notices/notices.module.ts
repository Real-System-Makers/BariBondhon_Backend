import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';
import { Notice, NoticeSchema } from './entities/notice.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { Flat, FlatSchema } from '../flats/entities/flat.entity';
import { HousesModule } from '../houses/houses.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notice.name, schema: NoticeSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Flat.name, schema: FlatSchema }]),
    HousesModule,
  ],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}

