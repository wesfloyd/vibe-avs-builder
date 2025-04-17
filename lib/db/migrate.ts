import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  console.log('Connecting to database:', process.env.POSTGRES_URL);
  
  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Running migrations...');

  try {
    // Test connection
    const result = await connection`SELECT current_database(), current_schema()`;
    console.log('Connected to database:', result[0].current_database);
    console.log('Current schema:', result[0].current_schema);
    
    // List schemas
    const schemas = await connection`SELECT schema_name FROM information_schema.schemata`;
    console.log('Available schemas:', schemas.map(s => s.schema_name));
    
    // Check migration table
    const migrationTableExists = await connection`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' 
        AND table_name = '__drizzle_migrations'
      )`;
    console.log('Migration table exists:', migrationTableExists[0].exists);
    
    // Check if migrations are needed by comparing with latest migration
    if (migrationTableExists[0].exists) {
      const latestMigration = await connection`
        SELECT hash FROM drizzle.__drizzle_migrations 
        ORDER BY id DESC LIMIT 1`;
      
      if (latestMigration.length > 0) {
        // Get filesystem migrations list (implement logic to check if newer migrations exist)
        const fs = require('fs');
        const path = require('path');
        
        // Read the journal file to get the latest migration info
        const journalPath = path.resolve('./lib/db/migrations/meta/_journal.json');
        if (fs.existsSync(journalPath)) {
          const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
          if (journal.entries && journal.entries.length > 0) {
            // Get the latest entry
            const latestEntry = journal.entries[journal.entries.length - 1];
            
            // Get the hash from the migration meta data
            const latestMetaPath = path.resolve(`./lib/db/migrations/meta/${latestEntry.tag}_snapshot.json`);
            if (fs.existsSync(latestMetaPath)) {
              const latestMeta = JSON.parse(fs.readFileSync(latestMetaPath, 'utf8'));
              
              // Simple hash check - can be improved with more robust comparison
              console.log('Latest migration hash (DB):', latestMigration[0].hash);
              console.log('Latest migration tag (files):', latestEntry.tag);
              
              // Skip if we've already applied all migrations
              // A more robust check would compare all migrations, not just the latest
              if (latestMigration.length >= journal.entries.length) {
                console.log('Database is up to date, skipping migrations');
                // Skip migrations and return early
                const tables = await connection`
                  SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
                console.log('Tables after migration check:', tables.map(t => t.tablename));
                await connection.end();
                process.exit(0);
              }
            }
          }
        }
      }
    }
    
    // Run migrations with verbose logging
    const start = Date.now();
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    const end = Date.now();

    console.log('✅ Migrations completed in', end - start, 'ms');
    
    // Verify tables after migration
    const tables = await connection`
      SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables after migration:', tables.map(t => t.tablename));
  } catch (error) {
    console.error('Error during migration process:', error);
    throw error;
  } finally {
    await connection.end();
  }
  
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
