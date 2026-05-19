import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/index.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    const user = result.rows[0];

    if (!user || !user.password_hash) return res.status(401).json({ error: 'Credenciais inválidas' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

    if (!user.approved) return res.status(403).json({ error: 'Seu acesso está aguardando aprovação do administrador.' });

    req.session.userId = user.id;
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approved: user.approved,
    });
  } catch {
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ authenticated: false });

  try {
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [req.session.userId]);
    const user = result.rows[0];
    if (!user) return res.json({ authenticated: false });

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
      },
    });
  } catch {
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

export default router;
