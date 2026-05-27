import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, poolConnection } from './index';

async function run() {
  console.log('⏳ Running database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    // Close database pool connection
    await poolConnection.end();
  }
}

run().catch((err) => {
  console.error('❌ Top level migration error:', err);
  process.exit(1);
});
