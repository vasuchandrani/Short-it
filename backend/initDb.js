const db = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initDbQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contact VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS authentication_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contact VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL DEFAULT '',
    verification_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS short_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    key VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'vatsal.chandrani.11@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'vats@l1118';
  
  try {
    const res = await db.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (res.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.query(
        'INSERT INTO users (name, email, contact, password, role, status) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Super Admin', adminEmail, 'N/A', hashedPassword, 'admin', 'approved']
      );
      console.log('Database Seeding: Admin user created successfully.');
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.query(
        'UPDATE users SET password = $1, role = $2, status = $3 WHERE email = $4',
        [hashedPassword, 'admin', 'approved', adminEmail]
      );
      console.log('Database Seeding: Admin user credentials synchronized with env.');
    }
  } catch (err) {
    console.error('Error seeding admin user:', err.message);
  }
}

async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');
    await db.query(initDbQuery);
    
    // Migrations to add password and verification code columns
    await db.query(`
      ALTER TABLE authentication_requests 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT '',
      ADD COLUMN IF NOT EXISTS verification_code VARCHAR(50)
    `);
    
    console.log('Database schema checks and migrations completed successfully.');
    await seedAdmin();
  } catch (err) {
    console.error('Database initialization error:', err.message);
    throw err;
  }
}

module.exports = { initializeDatabase };
