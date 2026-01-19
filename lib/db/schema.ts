import { query } from './query';
import { DEPARTMENT_MAP } from '../utils/academic';

// Check if table exists and has correct structure
async function checkTableStructure() {
  try {
    // Check if users table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (!tableExists.rows[0].exists) {
      return false; // Table doesn't exist
    }

    // Check if password_hash column exists
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password_hash'
      );
    `);

    return columnExists.rows[0].exists;
  } catch (error) {
    console.error('Error checking table structure:', error);
    return false;
  }
}

// Drop and recreate users table if needed
async function ensureUsersTable() {
  const hasCorrectStructure = await checkTableStructure();
  
  if (!hasCorrectStructure) {
    console.log('Dropping existing users table to recreate with correct structure...');
    // Drop dependent objects first
    await query('DROP TABLE IF EXISTS sessions CASCADE;');
    await query('DROP TABLE IF EXISTS users CASCADE;');
  }
}

// Create users table
export async function createUsersTable() {
  // Ensure table doesn't exist or has correct structure
  await ensureUsersTable();

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'teacher',
      department VARCHAR(255),
      phone VARCHAR(20),
      academic_title VARCHAR(50),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    );
  `;

  // Create index on username for faster lookups
  const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `;

  // Create index on email
  const createEmailIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `;

  try {
    await query(createTableQuery);
    await query(createIndexQuery);
    await query(createEmailIndexQuery);
    console.log('Users table created successfully');
  } catch (error) {
    console.error('Error creating users table:', error);
    throw error;
  }
}

// Create sessions table for tracking active sessions
export async function createSessionsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      user_agent TEXT
    );
  `;

  const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `;

  try {
    await query(createTableQuery);
    await query(createIndexQuery);
    console.log('Sessions table created successfully');
  } catch (error) {
    console.error('Error creating sessions table:', error);
    throw error;
  }
}

// Create departments table (single source for department list)
export async function createDepartmentsTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      code VARCHAR(120) UNIQUE NOT NULL,
      name_ar VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexCodeQuery = `
    CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
  `;
  const createIndexActiveQuery = `
    CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);
  `;

  try {
    await query(createTableQuery);
    await query(createIndexCodeQuery);
    await query(createIndexActiveQuery);
    console.log('Departments table created successfully');
  } catch (error) {
    console.error('Error creating departments table:', error);
    throw error;
  }
}

export async function seedDepartmentsIfEmpty() {
  const countRes = await query(`SELECT COUNT(*)::int AS count FROM departments;`);
  const count = countRes.rows?.[0]?.count ?? 0;
  if (count > 0) return;

  const entries = Object.entries(DEPARTMENT_MAP);
  if (entries.length === 0) return;

  const valuesSql = entries
    .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
    .join(", ");
  const params = entries.flatMap(([code, name]) => [code, name]);

  await query(
    `
      INSERT INTO departments (code, name_ar)
      VALUES ${valuesSql}
      ON CONFLICT (code) DO NOTHING;
    `,
    params
  );
  console.log('Departments seeded successfully');
}

export async function ensureDepartmentsReady() {
  await createDepartmentsTable();
  await seedDepartmentsIfEmpty();
}

// Initialize all tables
export async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    await createUsersTable();
    await createSessionsTable();
    await ensureDepartmentsReady();
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
