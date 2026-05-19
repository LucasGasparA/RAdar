import { useState, useEffect, useMemo, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { API } from '../contexts/AuthContext';
import { Plus, ExternalLink, Image, Pencil, Trash2, X, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';
import ComplaintModal from '../components/ComplaintModal';
import styles from './Complaints.module.css';

const STATUS_COLORS = {
  'Em tratativa': styles.statusTratativa,
  'Aguardando cliente': styles.statusAguardando,
  'Finalizado': styles.statusFinalizado,
};

const TITLES = {
  open: 'Em Aberto',
  resolved: 'Resolvidos',
  'no-eval': 'Sem Avaliação do Cliente',
  removed: 'Removidos do Reclame Aqui',
};

const ORIGINS = ['Suporte Técnico', 'CSM', 'Produto', 'Financeiro', 'Comercial', 'Outro'];

function Badge({ active }) {
  return active
    ? <span className={styles.badgeYes}><Check size={10} /></span>
    : <span className={styles.badgeNo}><X size={10} /></span>;
}

export default function Complaints() {
  const { filter } = useParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // Filtros locais
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fOrigin, setFOrigin] = useState('');
  const [fType, setFType] = useState('');
  const [fAgent, setFAgent] = useState('');

  const buildServerParams = () => {
    if (filter === 'open') return '?resolved=false&removed=false';
    if (filter === 'resolved') return '?resolved=true&removed=false';
    if (filter === 'no-eval') return '?resolved=true&client_evaluated=false&removed=false';
    if (filter === 'removed') return '?removed=true';
    return '';
  };

  const fetchComplaints = () => {
    setLoading(true);
    setError('');
    API.get(`/api/complaints${buildServerParams()}`)
      .then(r => setComplaints(r.data))
      .catch(() => setError('Não foi possível carregar os casos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setExpanded(null);
    setDateFrom(''); setDateTo(''); setFStatus(''); setFOrigin(''); setFType(''); setFAgent('');
    fetchComplaints();
  }, [filter]);

  const filtered = useMemo(() => complaints.filter(c => {
    if (dateFrom && c.date.slice(0, 10) < dateFrom) return false;
    if (dateTo && c.date.slice(0, 10) > dateTo) return false;
    if (fStatus && c.status !== fStatus) return false;
    if (fOrigin && c.origin !== fOrigin) return false;
    if (fType && c.client_type !== fType) return false;
    if (fAgent && !c.agent?.toLowerCase().includes(fAgent.toLowerCase())) return false;
    return true;
  }), [complaints, dateFrom, dateTo, fStatus, fOrigin, fType, fAgent]);

  const hasFilters = dateFrom || dateTo || fStatus || fOrigin || fType || fAgent;

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setFStatus(''); setFOrigin(''); setFType(''); setFAgent('');
  };

  const exportCSV = () => {
    const headers = ['Data', 'Status', 'Tipo', 'Origem', 'Agente', 'Link', 'Resolvido', 'Respondido', 'Avaliou', 'Removido', 'Criado por', 'Reclamação', 'Análise'];
    const rows = filtered.map(c => [
      c.date.slice(0, 10).split('-').reverse().join('/'),
      c.status,
      c.client_type,
      c.origin || '',
      c.agent || '',
      c.link || '',
      c.resolved ? 'Sim' : 'Não',
      c.responded ? 'Sim' : 'Não',
      c.client_evaluated ? 'Sim' : 'Não',
      c.removed ? 'Sim' : 'Não',
      c.created_by_name || '',
      c.complaint_text || '',
      c.analysis || '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radar_${filter || 'todos'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este caso permanentemente?')) return;
    try {
      await API.delete(`/api/complaints/${id}`);
      setComplaints(prev => prev.filter(c => c.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {
      alert('Erro ao excluir. Tente novamente.');
    }
  };

  const handleSave = () => {
    setShowModal(false);
    setEditing(null);
    fetchComplaints();
  };

  const title = TITLES[filter] || 'Todos os Casos';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>{title}</h1>
          <p>{filtered.length} caso{filtered.length !== 1 ? 's' : ''}{hasFilters ? ' (filtrado)' : ''}</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={15} />
          Novo caso
        </button>
      </div>

      {/* Barra de filtros */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <input
            type="date"
            className={styles.filterInput}
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title="Data inicial"
          />
          <span className={styles.filterSep}>–</span>
          <input
            type="date"
            className={styles.filterInput}
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title="Data final"
          />
        </div>

        <select className={styles.filterSelect} value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="">Status</option>
          <option>Em tratativa</option>
          <option>Aguardando cliente</option>
          <option>Finalizado</option>
        </select>

        <select className={styles.filterSelect} value={fOrigin} onChange={e => setFOrigin(e.target.value)}>
          <option value="">Origem</option>
          {ORIGINS.map(o => <option key={o}>{o}</option>)}
        </select>

        <select className={styles.filterSelect} value={fType} onChange={e => setFType(e.target.value)}>
          <option value="">Tipo</option>
          <option>Cliente</option>
          <option>Aluno</option>
        </select>

        <input
          type="text"
          className={styles.filterInput}
          placeholder="Agente..."
          value={fAgent}
          onChange={e => setFAgent(e.target.value)}
        />

        <div className={styles.filterActions}>
          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearFilters} title="Limpar filtros">
              <X size={13} /> Limpar
            </button>
          )}
          <button className={styles.exportBtn} onClick={exportCSV} title="Exportar como CSV">
            <Download size={13} />
            Exportar CSV ({filtered.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : error ? (
        <div className={styles.errorMsg}>{error}</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {hasFilters ? 'Nenhum caso encontrado com esses filtros.' : 'Nenhum caso encontrado.'}
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Status</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Agente</th>
                <th>Link</th>
                <th className={styles.thCenter}>Resolvido</th>
                <th className={styles.thCenter}>Respondido</th>
                <th className={styles.thCenter}>Avaliou</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <Fragment key={c.id}>
                  <tr
                    className={`${styles.row} ${expanded === c.id ? styles.rowExpanded : ''}`}
                    onClick={() => setExpanded(prev => prev === c.id ? null : c.id)}
                  >
                    <td className={styles.date}>
                      {c.date.slice(0, 10).split('-').reverse().join('/')}
                    </td>
                    <td>
                      <span className={`${styles.status} ${STATUS_COLORS[c.status] || ''}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <span className={c.client_type === 'Cliente' ? styles.typeCliente : styles.typeAluno}>
                        {c.client_type}
                      </span>
                    </td>
                    <td className={styles.muted}>{c.origin || '—'}</td>
                    <td className={styles.muted}>{c.agent || '—'}</td>
                    <td>
                      {c.link ? (
                        <a
                          href={c.link.startsWith('http') ? c.link : `https://${c.link}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.link}
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink size={13} />
                        </a>
                      ) : '—'}
                    </td>
                    <td className={styles.tdCenter}><Badge active={c.resolved} /></td>
                    <td className={styles.tdCenter}><Badge active={c.responded} /></td>
                    <td className={styles.tdCenter}><Badge active={c.client_evaluated} /></td>
                    <td className={styles.expandCell}>
                      {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </td>
                  </tr>

                  {expanded === c.id && (
                    <tr className={styles.detailRow}>
                      <td colSpan={10}>
                        <div className={styles.detailContent}>
                          <div className={styles.detailMeta}>
                            {c.created_by_name && <span>Criado por <strong>{c.created_by_name}</strong></span>}
                            {c.print_url && (
                              <a href={c.print_url} target="_blank" rel="noreferrer" className={styles.printLink} onClick={e => e.stopPropagation()}>
                                <Image size={12} /> Ver print
                              </a>
                            )}
                            {c.removed && <span className={styles.removedTag}>Removido do RA</span>}
                          </div>

                          <div className={styles.detailTexts}>
                            <div className={styles.detailBlock}>
                              <label>Reclamação do cliente</label>
                              <p>{c.complaint_text || <em className={styles.empty2}>Não informado</em>}</p>
                            </div>
                            <div className={styles.detailBlock}>
                              <label>Análise do caso</label>
                              <p>{c.analysis || <em className={styles.empty2}>Não informado</em>}</p>
                            </div>
                          </div>

                          <div className={styles.detailActions}>
                            <button
                              className={styles.editBtn}
                              onClick={e => { e.stopPropagation(); setEditing(c); setShowModal(true); }}
                            >
                              <Pencil size={13} /> Editar
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                            >
                              <Trash2 size={13} /> Excluir
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ComplaintModal
          complaint={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
