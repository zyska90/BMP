import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/bizlink';

// Create connection pool
export const poolConnection = mysql.createPool(databaseUrl);

// Initialize Drizzle ORM
export const db = drizzle(poolConnection, { schema, mode: 'default' });
