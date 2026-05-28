// Applies pending SQL migrations against DATABASE_URL, then exits.
// Run as a one-shot container before the app starts. Uses the programmatic
// drizzle migrator so no drizzle-kit (a dev dependency) is needed at runtime.
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

await migrate(db, { migrationsFolder: './migrations' });
await pool.end();

console.log('Migrations applied');
