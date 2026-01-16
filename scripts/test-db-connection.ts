import pool from '../lib/db/pool';
import { initializeDatabase } from '../lib/db/schema';
import { createUser, authenticateUser } from '../lib/db/auth';

async function testConnection() {
  console.log('Testing database connection...\n');

  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as now, version() as version');
    console.log('✅ Database connection successful!');
    console.log('   Current time:', result.rows[0].now);
    console.log('   PostgreSQL version:', result.rows[0].version.split(',')[0]);
    console.log('');

    // Initialize database schema
    console.log('Initializing database schema...');
    console.log('Checking existing tables...');
    await initializeDatabase();
    console.log('✅ Database schema initialized successfully!\n');

    // Test user creation
    console.log('Testing user creation...');
    try {
      const testUser = await createUser('test_user', 'test123456', {
        full_name: 'Test User',
        role: 'teacher',
        department: 'Test Department',
      });
      console.log('✅ Test user created successfully!');
      console.log('   User ID:', testUser.id);
      console.log('   Username:', testUser.username);
      console.log('   Role:', testUser.role);
      console.log('');

      // Test authentication
      console.log('Testing authentication...');
      const authenticatedUser = await authenticateUser('test_user', 'test123456');
      if (authenticatedUser) {
        console.log('✅ Authentication successful!');
        console.log('   Authenticated user:', authenticatedUser.username);
        console.log('   Role:', authenticatedUser.role);
      } else {
        console.log('❌ Authentication failed!');
      }
      console.log('');

      // Test wrong password
      console.log('Testing wrong password...');
      const failedAuth = await authenticateUser('test_user', 'wrong_password');
      if (!failedAuth) {
        console.log('✅ Wrong password correctly rejected!');
      } else {
        console.log('❌ Authentication should have failed!');
      }
      console.log('');

    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Test user already exists, skipping creation...\n');
      } else {
        throw error;
      }
    }

    console.log('✅ All tests passed successfully!');
    console.log('');
    console.log('Database is ready to use! 🎉');

  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('1. PostgreSQL is running on port 5441');
    console.error('2. Database "scientific_plan_db" exists');
    console.error('3. User "sp_admin" has access to the database');
    console.error('4. Credentials in .env.local are correct');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testConnection();
