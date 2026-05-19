import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/insights', requireAuth, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt é obrigatório' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro da API Anthropic' });
    }

    const text = data.content?.map(b => b.text || '').join('') || '';
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao conectar com a IA.' });
  }
});

export default router;
