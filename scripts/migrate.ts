import { db } from '../server/db';
import { sql } from 'drizzle-orm';

// Check if required environment variables are set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('Running database migrations...');

async function runMigrations() {
  try {
    // Add email column if it doesn't exist
    const emailExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='email'
    `);
    
    if (emailExists.rows.length === 0) {
      console.log('Adding email column to users table...');
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN email TEXT DEFAULT NULL
      `);
      console.log('Email column added successfully');
    } else {
      console.log('Email column already exists');
    }
    
    // Add created_at column if it doesn't exist
    const createdAtExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='created_at'
    `);
    
    if (createdAtExists.rows.length === 0) {
      console.log('Adding created_at column to users table...');
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      `);
      console.log('created_at column added successfully');
    } else {
      console.log('created_at column already exists');
    }

    // Add Stripe columns if they don't exist
    const stripeCustomerIdExists = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='stripe_customer_id'
    `);
    
    if (stripeCustomerIdExists.rows.length === 0) {
      console.log('Adding Stripe columns to users table...');
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN stripe_customer_id TEXT DEFAULT NULL;
        ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT DEFAULT NULL;
      `);
      console.log('Stripe columns added successfully');
    } else {
      console.log('Stripe columns already exist');
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations().then(() => {
  console.log('Migration process completed');
  process.exit(0);
}).catch((err) => {
  console.error('Migration process failed:', err);
  process.exit(1);
});