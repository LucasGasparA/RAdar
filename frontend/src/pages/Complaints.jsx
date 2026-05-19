import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API } from '../contexts/AuthContext';
import { Plus, ExternalLink, Image, Pencil, Trash2, X, Check } from 'lucide-react';
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
};

function Badge({ active, label }) {
  return (
    <span className={active ? styles.badgeYes : styles.badgeNo}>
      {active ? <Check size={11} /> : <X size={11} />}
      {label}
    </span>
  );
}

export default function Complaints() {
  const { filter } = useParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const buildParams = () => {
    if (filter === 'open') return '?resolved=false';
    if (filter === 'resolved') return '?resolved=true';
    if (filter === 'no-eval') return '?resolved=true&client_evaluated=false';
    return '';
  };

  const fetchComplaints = () => {
    setLoading(true);
    API.get(`/api/complaints${buildParams()}`)
      .then(r => setComplaints(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, [filter]);

  const handleDelete = async (id) => {
    if (!confirm('Remover este caso?')) return;
    await API.delete(`/api/complaints/${id}`);
    setComplaints(prev => prev.filter(c => c.id !== id));
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
          <p>{complaints.length} caso{complaints.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Novo caso
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : complaints.length === 0 ? (
        <div className={styles.empty}>Nenhum caso encontrado.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Status</th>
                <th>Link</th>
                <th>Print</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Agente</th>
                <th>Removido</th>
                <th>Resolvido</th>
                <th>Respondido</th>
                <th>Avaliado</th>
                <th>Análise</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id}>
                  <td className={styles.date}>
                    {new Date(c.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <span className={`${styles.status} ${STATUS_COLORS[c.status] || ''}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    {c.link ? (
                      <a href={c.link.startsWith('http') ? c.link : `https://${c.link}`}
                        target="_blank" rel="noreferrer" className={styles.link}>
                        <ExternalLink size={14} />
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    {c.print_url ? (
                      <a href={c.print_url} target="_blank" rel="noreferrer" className={styles.link}>
                        <Image size={14} />
                      </a>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={c.client_type === 'Cliente' ? styles.typeCliente : styles.typeAluno}>
                      {c.client_type}
                    </span>
                  </td>
                  <td>
                    {c.origin ? (
                      <span className={styles.origin}>{c.origin}</span>
                    ) : '—'}
                  </td>
                  <td className={styles.agent}>{c.agent || '—'}</td>
                  <td><Badge active={c.removed} label="Sim" /></td>
                  <td><Badge active={c.resolved} label="Sim" /></td>
                  <td><Badge active={c.responded} label="Sim" /></td>
                  <td><Badge active={c.client_evaluated} label="Sim" /></td>
                  <td className={styles.analysis}>
                    {c.analysis ? (
                      <span title={c.analysis}>{c.analysis.slice(0, 40)}{c.analysis.length > 40 ? '…' : ''}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => { setEditing(c); setShowModal(true); }} title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} title="Remover" className={styles.deleteBtn}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
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
