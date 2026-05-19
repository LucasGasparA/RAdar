import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, MessageSquare, Star, Trash2, Clock, Flag } from 'lucide-react';
import styles from './Dashboard.module.css';

function StatCard({ label, value, icon: Icon, color, to }) {
  const content = (
    <div className={styles.card} style={{ '--accent': color }}>
      <div className={styles.cardIcon}><Icon size={18} /></div>
      <div className={styles.cardValue}>{value ?? '—'}</div>
      <div className={styles.cardLabel}>{label}</div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/api/complaints/stats/overview')
      .then(r => setStats(r.data))
      .catch(() => setError('Não foi possível carregar as estatísticas.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  if (error) return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Painel</h1>
        <p>Visão geral das reclamações no Reclame Aqui</p>
      </div>
      <div className={styles.error}>{error}</div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Painel</h1>
        <p>Visão geral das reclamações no Reclame Aqui</p>
      </div>

      <div className={styles.grid}>
        <StatCard label="Total de casos" value={stats?.total} icon={AlertCircle} color="#888" to="/complaints" />
        <StatCard label="Em tratativa" value={stats?.em_tratativa} icon={Clock} color="#FF6B35" to="/complaints/open" />
        <StatCard label="Aguardando cliente" value={stats?.aguardando_cliente} icon={MessageSquare} color="#7C4DFF" to="/complaints/open" />
        <StatCard label="Finalizados" value={stats?.finalizado} icon={Flag} color="#00BCD4" to="/complaints/resolved" />
        <StatCard label="Resolvidos" value={stats?.resolvidos} icon={CheckCircle} color="#00C853" to="/complaints/resolved" />
        <StatCard label="Respondidos" value={stats?.respondidos} icon={MessageSquare} color="#26C6DA" to="/complaints/resolved" />
        <StatCard label="Sem avaliação" value={stats?.sem_avaliacao} icon={Star} color="#FFB300" to="/complaints/no-eval" />
        <StatCard label="Removidos" value={stats?.removidos} icon={Trash2} color="#f44336" to="/complaints/removed" />
      </div>

      {Number(stats?.sem_avaliacao) > 0 && (
        <div className={styles.tip}>
          <Star size={14} />
          <span>
            <strong>{stats.sem_avaliacao}</strong> caso{stats.sem_avaliacao !== '1' ? 's' : ''} resolvido{stats.sem_avaliacao !== '1' ? 's' : ''} ainda não {stats.sem_avaliacao !== '1' ? 'foram avaliados' : 'foi avaliado'} pelo cliente.{' '}
            <Link to="/complaints/no-eval">Ver lista</Link>
          </span>
        </div>
      )}
    </div>
  );
}
