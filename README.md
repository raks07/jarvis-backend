# jarvis-backend: NestJS Backend for User and Document Management

This component ([GitHub repository](https://github.com/raks07/jarvis-backend)) handles user authentication, document management, and ingestion controls.

## Features

- User authentication and authorization
- Role-based access control
- Document management (upload, retrieve, delete)
- Ingestion process management
- Integration with jarvis-datastore for document ingestion

## Technology Stack

- NestJS: Progressive Node.js framework
- TypeScript: Typed JavaScript
- TypeORM: ORM for database interactions
- PostgreSQL: Database
- JWT: Authentication mechanism
- Jest: Testing framework

## Setup

### Prerequisites

- Node.js (v16+)
- PostgreSQL

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
# Edit .env file with your settings
```

3. Generate a secure JWT secret for authentication:

```bash
# Generate a secure random string for JWT_SECRET using Node.js
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated JWT_SECRET: $JWT_SECRET"

# Or using OpenSSL (alternative method)
JWT_SECRET=$(openssl rand -hex 32)
echo "Generated JWT_SECRET: $JWT_SECRET"

# Manually update the JWT_SECRET in your .env file
# or use the following command:
sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

# If using Docker, also update your docker-compose.yml file
# or use the following command from the root project directory:
sed -i '' "s/- JWT_SECRET=.*$/- JWT_SECRET=$JWT_SECRET/" ../docker-compose.yml
```

4. Run database migrations:

```bash
npm run typeorm:migration:run
```

### Running the Application

#### Development

```bash
npm run start:dev
```

#### Production

```bash
npm run build
npm run start:prod
```

The API will be available at <http://localhost:3000>.

## Project Structure

```
nestjs-backend/
├── src/                    # Source code
│   ├── auth/               # Authentication module
│   │   ├── guards/         # Authentication guards
│   │   ├── strategies/     # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── users/              # User management module
│   │   ├── entities/       # User entity
│   │   ├── dto/            # Data transfer objects
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── documents/          # Document management module
│   │   ├── entities/       # Document entity
│   │   ├── dto/            # Data transfer objects
│   │   ├── documents.controller.ts
│   │   ├── documents.module.ts
│   │   └── documents.service.ts
│   ├── ingestion/          # Ingestion management module
│   │   ├── entities/       # Ingestion entity
│   │   ├── dto/            # Data transfer objects
│   │   ├── ingestion.controller.ts
│   │   ├── ingestion.module.ts
│   │   └── ingestion.service.ts
│   ├── common/             # Shared modules
│   │   ├── dto/            # Common DTOs
│   │   ├── filters/        # Exception filters
│   │   ├── interceptors/   # HTTP interceptors
│   │   └── interfaces/     # Common interfaces
│   ├── app.module.ts       # Application module
│   └── main.ts             # Application entry point
├── test/                   # Test directory
├── nest-cli.json           # NestJS CLI configuration
├── package.json            # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
├── Dockerfile              # Docker configuration
└── .env.example            # Example environment variables
```

## API Documentation

The NestJS backend provides comprehensive Swagger API documentation. Once the application is running, you can access it at:

- Swagger UI: <http://localhost:3000/api/docs>

This interactive documentation allows you to:

1. Browse all available endpoints
2. Authenticate using JWT tokens
3. Test endpoints directly from the browser
4. View request/response models and schemas
5. Understand authentication requirements for each endpoint

For a static version of the API documentation, you can use the `generate_api_docs.sh` script in the jarvis-setup repository.

## Development

### Running Tests

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Migrations

```bash
# Generate migration
npm run typeorm:migration:generate -- -n MigrationName

# Run migrations
npm run typeorm:migration:run
```
