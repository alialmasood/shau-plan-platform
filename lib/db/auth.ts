import { query } from './query';
import bcrypt from 'bcryptjs';

// User interface
export interface User {
  id: number;
  username: string;
  email: string | null;
  password_hash: string;
  full_name: string | null;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

// Create a new user
export async function createUser(
  username: string,
  password: string,
  options?: {
    email?: string;
    full_name?: string;
    role?: string;
    department?: string;
  }
): Promise<User> {
  // Hash the password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const insertQuery = `
    INSERT INTO users (username, password_hash, email, full_name, role, department)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, username, email, password_hash, full_name, role, department, is_active, created_at, updated_at, last_login;
  `;

  try {
    const result = await query(insertQuery, [
      username,
      password_hash,
      options?.email || null,
      options?.full_name || null,
      options?.role || 'teacher',
      options?.department || null,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Failed to create user');
    }

    return result.rows[0] as User;
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Username or email already exists');
    }
    throw error;
  }
}

// Authenticate user (by username or email)
export async function authenticateUser(
  identifier: string,
  password: string
): Promise<User | null> {
  // Try to find user by email or username
  const selectQuery = `
    SELECT id, username, email, password_hash, full_name, role, department, phone, academic_title, is_active, created_at, updated_at, last_login
    FROM users
    WHERE (email = $1 OR username = $1) AND is_active = true;
  `;

  try {
    const result = await query(selectQuery, [identifier]);

    if (result.rows.length === 0) {
      return null; // User not found
    }

    const user = result.rows[0] as User;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null; // Invalid password
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Remove password_hash from returned user
    const { password_hash: _, ...userWithoutPassword } = user;

    return userWithoutPassword as any;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  const selectQuery = `
    SELECT id, username, email, password_hash, full_name, role, department, is_active, created_at, updated_at, last_login
    FROM users
    WHERE username = $1;
  `;

  try {
    const result = await query(selectQuery, [username]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Get user by ID
export async function getUserById(id: number): Promise<User | null> {
  const selectQuery = `
    SELECT id, username, email, password_hash, full_name, role, department, is_active, created_at, updated_at, last_login
    FROM users
    WHERE id = $1;
  `;

  try {
    const result = await query(selectQuery, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Update user password
export async function updateUserPassword(
  userId: number,
  newPassword: string
): Promise<boolean> {
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(newPassword, saltRounds);

  const updateQuery = `
    UPDATE users
    SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2;
  `;

  try {
    const result = await query(updateQuery, [password_hash, userId]);
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}
