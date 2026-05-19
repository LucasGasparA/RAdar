import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, approved, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

router.post('/users', requireAdmin, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, approved) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, approved',
      [name, email.toLowerCase(), hash, 'member', true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email já cadastrado' });
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Não é possível excluir sua própria conta' });
  }
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

router.patch('/users/:id/approve', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET approved=true WHERE id=$1 RETURNING id, name, email, approved',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao aprovar usuário' });
  }
});

router.patch('/users/:id/revoke', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET approved=false WHERE id=$1 RETURNING id, name, email, approved',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao revogar acesso' });
  }
});

router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Role inválido' });
    const result = await pool.query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar role' });
  }
});

export default router;
