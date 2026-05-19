import express from 'express';
import { pool } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Listar reclamações com filtros
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, resolved, responded, client_evaluated } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;

    if (status) { conditions.push(`status = $${i++}`); params.push(status); }
    if (resolved !== undefined) { conditions.push(`resolved = $${i++}`); params.push(resolved === 'true'); }
    if (responded !== undefined) { conditions.push(`responded = $${i++}`); params.push(responded === 'true'); }
    if (client_evaluated !== undefined) { conditions.push(`client_evaluated = $${i++}`); params.push(client_evaluated === 'true'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT c.*, u.name as created_by_name 
       FROM complaints c
       LEFT JOIN users u ON c.created_by = u.id
       ${where}
       ORDER BY c.date DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar reclamações' });
  }
});

// Criar reclamação
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      date, status, link, print_url, client_type,
      origin, agent, removed, resolved, responded,
      client_evaluated, analysis
    } = req.body;

    const result = await pool.query(
      `INSERT INTO complaints 
        (date, status, link, print_url, client_type, origin, agent, removed, resolved, responded, client_evaluated, analysis, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [date, status, link, print_url, client_type, origin, agent,
       removed || false, resolved || false, responded || false,
       client_evaluated || false, analysis, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar reclamação' });
  }
});

// Atualizar reclamação
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, status, link, print_url, client_type,
      origin, agent, removed, resolved, responded,
      client_evaluated, analysis
    } = req.body;

    const result = await pool.query(
      `UPDATE complaints SET
        date=$1, status=$2, link=$3, print_url=$4, client_type=$5,
        origin=$6, agent=$7, removed=$8, resolved=$9, responded=$10,
        client_evaluated=$11, analysis=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [date, status, link, print_url, client_type, origin, agent,
       removed, resolved, responded, client_evaluated, analysis, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar reclamação' });
  }
});

// Deletar reclamação
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM complaints WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar reclamação' });
  }
});

// Stats para o dashboard
router.get('/stats/overview', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Em tratativa') as em_tratativa,
        COUNT(*) FILTER (WHERE status = 'Aguardando cliente') as aguardando_cliente,
        COUNT(*) FILTER (WHERE resolved = true) as resolvidos,
        COUNT(*) FILTER (WHERE responded = true) as respondidos,
        COUNT(*) FILTER (WHERE client_evaluated = false AND resolved = true) as sem_avaliacao,
        COUNT(*) FILTER (WHERE removed = true) as removidos
      FROM complaints
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
