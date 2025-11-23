import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './auth/guards/access-token.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { DBConfigService } from './db/db.config';
import { FlatsModule } from './flats/flats.module';
import { TenantsModule } from './tenants/tenants.module';
import { RentsModule } from './rents/rents.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { HousesModule } from './houses/houses.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      useClass: DBConfigService,
    }),
    AuthModule,
    UserModule,
    FlatsModule,
    TenantsModule,
    RentsModule,
    NotificationsModule,
    HousesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule {}



