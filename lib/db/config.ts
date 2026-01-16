// Database configuration
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'scientific_plan_db',
  user: process.env.DB_USER || 'sp_admin',
  password: process.env.DB_PASSWORD || 'SHsh321321',
};

// Connection string
export const connectionString = 
  process.env.DATABASE_URL || 
  `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
