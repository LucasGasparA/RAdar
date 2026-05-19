import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'member',
        approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Em tratativa',
        link VARCHAR(500),
        print_url VARCHAR(500),
        client_type VARCHAR(50) DEFAULT 'Cliente',
        origin VARCHAR(100),
        agent VARCHAR(255),
        complaint_text TEXT,
        removed BOOLEAN DEFAULT FALSE,
        resolved BOOLEAN DEFAULT FALSE,
        responded BOOLEAN DEFAULT FALSE,
        client_evaluated BOOLEAN DEFAULT FALSE,
        analysis TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Migrações para bancos já existentes
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(100)`);
    await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS avatar`);
    await client.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS complaint_text TEXT`);

    // Cria admin padrão se não houver usuários
    const count = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(count.rows[0].count) === 0) {
      const hash = await bcrypt.hash('nextfit2025', 10);
      await client.query(
        `INSERT INTO users (email, name, password_hash, role, approved) VALUES ($1, $2, $3, $4, $5)`,
        ['admin@nextfit.com.br', 'Administrador', hash, 'admin', true]
      );
      console.log('---');
      console.log('Admin padrão criado:');
      console.log('  Email: admin@nextfit.com.br');
      console.log('  Senha: nextfit2025');
      console.log('---');
    }

    console.log('Banco de dados inicializado com sucesso.');
  } finally {
    client.release();
  }
}
