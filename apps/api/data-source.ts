import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [__dirname + '/src/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/src/migrations/*.{ts,js}'],
  synchronize: false,
});
