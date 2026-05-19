import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, MessageSquare, Star, Trash2, Clock } from 'lucide-react';
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

  useEffect(() => {
    API.get('/api/complaints/stats/overview')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Carregando...</div>;

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
        <StatCard label="Resolvidos" value={stats?.resolvidos} icon={CheckCircle} color="#00C853" to="/complaints/resolved" />
        <StatCard label="Respondidos" value={stats?.respondidos} icon={MessageSquare} color="#00BCD4" to="/complaints/resolved" />
        <StatCard label="Sem avaliação" value={stats?.sem_avaliacao} icon={Star} color="#FFB300" to="/complaints/no-eval" />
        <StatCard label="Removidos" value={stats?.removidos} icon={Trash2} color="#f44336" />
      </div>

      <div className={styles.tip}>
        <Star size={14} />
        <span>
          <strong>{stats?.sem_avaliacao}</strong> casos resolvidos ainda não foram avaliados pelo cliente.{' '}
          <Link to="/complaints/no-eval">Ver lista</Link>
        </span>
      </div>
    </div>
  );
}
