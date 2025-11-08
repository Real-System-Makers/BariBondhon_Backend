 
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './auth/guards/access-token.guard';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
       MongooseModule.forRoot("mongodb+srv://SakibOnMongo:12345678;@systemmakers.du60acc.mongodb.net/?appName=SystemMakers"),
        AuthModule,
        
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AtGuard,
        }
    ],
})
export class AppModule {}
