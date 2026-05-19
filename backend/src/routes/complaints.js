import express from 'express';
import { pool } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats/overview', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE removed = false AND status = 'Em tratativa') as em_tratativa,
        COUNT(*) FILTER (WHERE removed = false AND status = 'Aguardando cliente') as aguardando_cliente,
        COUNT(*) FILTER (WHERE removed = false AND status = 'Finalizado') as finalizado,
        COUNT(*) FILTER (WHERE removed = false AND resolved = true) as resolvidos,
        COUNT(*) FILTER (WHERE removed = false AND responded = true) as respondidos,
        COUNT(*) FILTER (WHERE removed = false AND client_evaluated = false AND resolved = true) as sem_avaliacao,
        COUNT(*) FILTER (WHERE removed = true) as removidos
      FROM complaints
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

router.get('/stats/por-mes', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as mes,
        TO_CHAR(date, 'Mon/YY') as mes_label,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE resolved = true) as resolvidos,
        COUNT(*) FILTER (WHERE removed = true) as removidos
      FROM complaints
      WHERE date >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM'), TO_CHAR(date, 'Mon/YY')
      ORDER BY mes ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados por mês' });
  }
});

router.get('/stats/por-agente', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(agent, 'Sem agente') as agente,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE resolved = true) as resolvidos,
        COUNT(*) FILTER (WHERE responded = true) as respondidos,
        ROUND(COUNT(*) FILTER (WHERE resolved = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as taxa_resolucao
      FROM complaints
      GROUP BY agent
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados por agente' });
  }
});

router.get('/stats/por-origem', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(NULLIF(origin, ''), 'Sem origem') as origem,
        COUNT(*) as total
      FROM complaints
      GROUP BY origin
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados por origem' });
  }
});

router.get('/stats/comparativo-mensal', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE date >= DATE_TRUNC('month', NOW())) as mes_atual,
        COUNT(*) FILTER (WHERE date >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
          AND date < DATE_TRUNC('month', NOW())) as mes_anterior,
        COUNT(*) FILTER (WHERE resolved = true AND date >= DATE_TRUNC('month', NOW())) as resolvidos_mes_atual,
        COUNT(*) FILTER (WHERE resolved = true
          AND date >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
          AND date < DATE_TRUNC('month', NOW())) as resolvidos_mes_anterior,
        COUNT(*) FILTER (WHERE removed = true AND date >= DATE_TRUNC('month', NOW())) as removidos_mes_atual,
        COUNT(*) FILTER (WHERE removed = true
          AND date >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
          AND date < DATE_TRUNC('month', NOW())) as removidos_mes_anterior
      FROM complaints
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar comparativo mensal' });
  }
});

router.get('/stats/timeline', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('week', date) AS week,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE resolved = true) AS resolvidos,
        COUNT(*) FILTER (WHERE removed = true) AS removidos
      FROM complaints
      WHERE date >= NOW() - INTERVAL '90 days'
      GROUP BY week
      ORDER BY week ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar timeline' });
  }
});

router.get('/stats/by-origin', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(NULLIF(origin, ''), 'Não informado') AS origin,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE resolved = true) AS resolvidos,
        COUNT(*) FILTER (WHERE removed = false AND resolved = false) AS em_aberto,
        ROUND(
          COUNT(*) FILTER (WHERE resolved = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1
        ) AS taxa_resolucao
      FROM complaints
      WHERE removed = false
      GROUP BY origin
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar stats por origem' });
  }
});

router.get('/stats/by-agent', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(NULLIF(agent, ''), 'Não atribuído') AS agent,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE resolved = true) AS resolvidos,
        COUNT(*) FILTER (WHERE client_evaluated = true) AS avaliados,
        ROUND(
          COUNT(*) FILTER (WHERE resolved = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1
        ) AS taxa_resolucao
      FROM complaints
      WHERE removed = false
      GROUP BY agent
      ORDER BY total DESC
      LIMIT 15
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar stats por agente' });
  }
});

router.get('/stats/monthly', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM') AS month,
        TO_CHAR(DATE_TRUNC('month', date), 'Mon/YY') AS label,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE resolved = true) AS resolvidos,
        COUNT(*) FILTER (WHERE removed = true) AS removidos,
        COUNT(*) FILTER (WHERE client_evaluated = true) AS avaliados,
        ROUND(
          COUNT(*) FILTER (WHERE resolved = true)::numeric / NULLIF(COUNT(*), 0) * 100, 1
        ) AS taxa_resolucao
      FROM complaints
      WHERE date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY DATE_TRUNC('month', date) ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar stats mensais' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, resolved, responded, client_evaluated, removed } = req.query;
    let conditions = [];
    let params = [];
    let i = 1;

    if (status) { conditions.push(`status = $${i++}`); params.push(status); }
    if (resolved !== undefined) { conditions.push(`resolved = $${i++}`); params.push(resolved === 'true'); }
    if (responded !== undefined) { conditions.push(`responded = $${i++}`); params.push(responded === 'true'); }
    if (client_evaluated !== undefined) { conditions.push(`client_evaluated = $${i++}`); params.push(client_evaluated === 'true'); }
    if (removed !== undefined) { conditions.push(`removed = $${i++}`); params.push(removed === 'true'); }

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

router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      date, status, link, print_url, client_type, origin, agent,
      removed, resolved, responded, client_evaluated,
      complaint_text, analysis
    } = req.body;

    if (!date) return res.status(400).json({ error: 'Data é obrigatória' });
    if (!status) return res.status(400).json({ error: 'Status é obrigatório' });

    const result = await pool.query(
      `INSERT INTO complaints
        (date, status, link, print_url, client_type, origin, agent, removed, resolved, responded,
         client_evaluated, complaint_text, analysis, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [date, status, link, print_url, client_type, origin, agent,
       removed || false, resolved || false, responded || false,
       client_evaluated || false, complaint_text, analysis, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar reclamação' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, status, link, print_url, client_type, origin, agent,
      removed, resolved, responded, client_evaluated,
      complaint_text, analysis
    } = req.body;

    if (!date) return res.status(400).json({ error: 'Data é obrigatória' });

    const result = await pool.query(
      `UPDATE complaints SET
        date=$1, status=$2, link=$3, print_url=$4, client_type=$5,
        origin=$6, agent=$7, removed=$8, resolved=$9, responded=$10,
        client_evaluated=$11, complaint_text=$12, analysis=$13, updated_at=NOW()
       WHERE id=$14 RETURNING *`,
      [date, status, link, print_url, client_type, origin, agent,
       removed, resolved, responded, client_evaluated,
       complaint_text, analysis, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar reclamação' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM complaints WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar reclamação' });
  }
});

export default router;
