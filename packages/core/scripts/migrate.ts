/**
 * Database migration script using Knex
 * 
 * Runs all Knex migrations
 */

import dotenv from "dotenv";
import knex, { Knex } from 'knex';

dotenv.config({ path: '../../.env', quiet: true });

async function runMigrations() {
  console.log('🔄 Starting database migrations with Knex...\n');

  // Determine environment
  const environment = process.env.NODE_ENV || 'development';

  // Build Knex config inline to avoid tsconfig issues
  const config: Knex.Config = {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: environment === 'test' 
        ? (process.env.DB_NAME || 'care_commons') + '_test'
        : process.env.DB_NAME || 'care_commons',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    migrations: {
      directory: './packages/core/migrations',
      tableName: 'knex_migrations',
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
  };

  // Initialize Knex
  const db = knex(config);

  try {
    // Run migrations
    const [batchNo, migrations] = await db.migrate.latest();

    if (migrations.length === 0) {
      console.log('✨ Database is already up to date!');
    } else {
      console.log(`✅ Batch ${batchNo} run: ${migrations.length} migration(s)`);
      migrations.forEach((migration: string) => {
        console.log(`   📝 ${migration}`);
      });
    }

    // Show current migration status
    const [completedMigrations] = await db.migrate.list();
    console.log(`\n📊 Total migrations applied: ${completedMigrations.length}`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run migrations
runMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
