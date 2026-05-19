import express from 'express';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
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

/* ---- Google OAuth ---- */
const getGoogleClient = () => new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL,
);

router.get('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google OAuth não configurado' });
  }
  const url = getGoogleClient().generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile'],
    prompt: 'select_account',
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { code, error } = req.query;
    if (error || !code) return res.redirect(`${frontend}/login?error=oauth`);

    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    // Busca por google_id ou email
    let result = await pool.query(
      'SELECT * FROM users WHERE google_id = $1 OR email = $2 LIMIT 1',
      [googleId, email.toLowerCase()]
    );
    let user = result.rows[0];

    if (!user) {
      // Cria conta pendente de aprovação
      result = await pool.query(
        `INSERT INTO users (name, email, google_id, role, approved)
         VALUES ($1, $2, $3, 'member', false) RETURNING *`,
        [name, email.toLowerCase(), googleId]
      );
      user = result.rows[0];
    } else if (!user.google_id) {
      // Vincula google_id à conta existente
      await pool.query('UPDATE users SET google_id=$1 WHERE id=$2', [googleId, user.id]);
    }

    if (!user.approved) return res.redirect(`${frontend}/login?error=pending`);

    req.session.userId = user.id;
    await new Promise((resolve, reject) =>
      req.session.save(err => (err ? reject(err) : resolve()))
    );
    res.redirect(`${frontend}/dashboard`);
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.redirect(`${frontend}/login?error=oauth`);
  }
});

export default router;
