import { HttpException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['*', 'http://localhost:3000'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory(errors) {
        return new HttpException(errors, 400);
      },
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('Baribondhon APIs')
    .setDescription(
      'API endpoints for managing baribondhon and subscription system.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('', app, document);

  await app.listen(process.env.PORT || 5000);
}

void bootstrap();
