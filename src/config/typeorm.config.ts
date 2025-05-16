import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";
import { join } from "path";

// Load .env file
const { parsed } = config();

// Access environment variables
const configService = new ConfigService(parsed);

// Database connection configuration
export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DATABASE_HOST || configService.get("DATABASE_HOST"),
  port: parseInt(process.env.DATABASE_PORT || configService.get("DATABASE_PORT")),
  username: process.env.DATABASE_USERNAME || configService.get("DATABASE_USERNAME"),
  password: process.env.DATABASE_PASSWORD || configService.get("DATABASE_PASSWORD"),
  database: process.env.DATABASE_NAME || configService.get("DATABASE_NAME"),
  entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
  migrations: [join(__dirname, "../migrations/*{.ts,.js}")],
  logging: (process.env.NODE_ENV || configService.get("NODE_ENV")) === "development",
  synchronize: false, // Important: Set to false for migrations
};

// Create and export the data source
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
