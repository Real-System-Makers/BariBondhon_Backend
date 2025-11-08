import { HttpException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        // allow all origins for now, but you should change this to an array of allowed origins in production
        origin: ['*', 'http://localhost:3000'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            exceptionFactory(errors) {
                return new HttpException(errors, 400);
            },
        })
    );

    const options = new DocumentBuilder()
        .setTitle('News Aggregator APIs')
        .setDescription('API endpoints for managing news aggregator and subscription system.')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('', app, document);

    await app.listen(process.env.PORT || 5000);
}
bootstrap();
