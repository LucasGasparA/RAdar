import { pool } from '../db/index.js';

async function getUser(req, res) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Não autenticado' });
    return null;
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [req.session.userId]);
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Não autenticado' });
      return null;
    }
    return user;
  } catch {
    res.status(500).json({ error: 'Erro interno' });
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const user = await getUser(req, res);
  if (!user) return;
  if (!user.approved) return res.status(403).json({ error: 'Acesso pendente de aprovação' });
  req.user = user;
  next();
}

export async function requireAdmin(req, res, next) {
  const user = await getUser(req, res);
  if (!user) return;
  if (user.role !== 'admin') return res.status(403).json({ error: 'Acesso restrito a administradores' });
  req.user = user;
  next();
}
