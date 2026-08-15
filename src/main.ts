import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  const swaggerConfig = new DocumentBuilder().setTitle("HubIt-API").setDescription("Documentação da api do orbis").setVersion("1.0").addBearerAuth().build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  await app.listen(port, '0.0.0.0');
  console.log(`Servidor rodando em: http://localhost:${port}`);
}

bootstrap();