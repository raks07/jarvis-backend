import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Configure CORS
  app.enableCors();

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("jarvis-backend API")
    .setDescription("NestJS API for user authentication and document management")
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management endpoints")
    .addTag("documents", "Document management endpoints")
    .addTag("ingestion", "Ingestion management endpoints")
    .addServer("http://localhost:3000", "Local Development")
    .addServer("https://api.example.com", "Production")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth"
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  // Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}
bootstrap();
