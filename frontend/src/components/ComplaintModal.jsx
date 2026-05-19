import { useState } from 'react';
import { API } from '../contexts/AuthContext';
import { X } from 'lucide-react';
import styles from './ComplaintModal.module.css';

const ORIGINS = ['Suporte Técnico', 'CSM', 'Produto', 'Financeiro', 'Comercial', 'Outro'];

const defaults = {
  date: new Date().toISOString().split('T')[0],
  status: 'Em tratativa',
  link: '',
  print_url: '',
  client_type: 'Cliente',
  origin: 'Suporte Técnico',
  agent: '',
  complaint_text: '',
  analysis: '',
  removed: false,
  resolved: false,
  responded: false,
  client_evaluated: false,
};

export default function ComplaintModal({ complaint, onClose, onSave }) {
  const [form, setForm] = useState(complaint ? {
    ...complaint,
    date: complaint.date?.slice(0, 10) || defaults.date,
  } : defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.date) return setError('A data é obrigatória.');
    setSaving(true);
    setError('');
    try {
      if (complaint) {
        await API.put(`/api/complaints/${complaint.id}`, form);
      } else {
        await API.post('/api/complaints', form);
      }
      onSave();
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{complaint ? 'Editar caso' : 'Novo caso'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.body}>
          {/* Linha 1: campos rápidos */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Data *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Em tratativa</option>
                <option>Aguardando cliente</option>
                <option>Finalizado</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Tipo</label>
              <select value={form.client_type} onChange={e => set('client_type', e.target.value)}>
                <option>Cliente</option>
                <option>Aluno</option>
              </select>
            </div>
          </div>

          {/* Linha 2: origem e agente */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Origem</label>
              <select value={form.origin} onChange={e => set('origin', e.target.value)}>
                {ORIGINS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Agente responsável</label>
              <input
                type="text"
                placeholder="Nome do agente"
                value={form.agent}
                onChange={e => set('agent', e.target.value)}
              />
            </div>
          </div>

          {/* Links */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Link da reclamação (RA)</label>
              <input
                type="text"
                placeholder="reclameaqui.com.br/..."
                value={form.link}
                onChange={e => set('link', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>Link do print</label>
              <input
                type="text"
                placeholder="https://..."
                value={form.print_url}
                onChange={e => set('print_url', e.target.value)}
              />
            </div>
          </div>

          {/* Texto da reclamação */}
          <div className={styles.field}>
            <label>Reclamação do cliente</label>
            <textarea
              placeholder="Cole aqui o texto da reclamação do Reclame Aqui..."
              value={form.complaint_text}
              onChange={e => set('complaint_text', e.target.value)}
              rows={4}
            />
          </div>

          {/* Análise do caso */}
          <div className={styles.field}>
            <label>Análise do caso</label>
            <textarea
              placeholder="Observações e análise do responsável pelo atendimento..."
              value={form.analysis}
              onChange={e => set('analysis', e.target.value)}
              rows={3}
            />
          </div>

          {/* Checkboxes */}
          <div className={styles.checkboxGrid}>
            {[
              ['resolved', 'Resolvido'],
              ['responded', 'Respondido'],
              ['client_evaluated', 'Cliente avaliou'],
              ['removed', 'Removido do RA'],
            ].map(([key, label]) => (
              <label key={key} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={e => set(key, e.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.saveBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar caso'}
          </button>
        </div>
      </div>
    </div>
  );
}
