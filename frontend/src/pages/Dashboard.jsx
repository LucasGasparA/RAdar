import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell,
} from 'recharts';
import { API } from '../contexts/AuthContext';
import {
  AlertCircle, CheckCircle, MessageSquare, Star, Trash2,
  Clock, Flag, TrendingUp, Users, BarChart2,
} from 'lucide-react';
import styles from './Dashboard.module.css';

/* ---- Paleta ---- */
const C_PURPLE = '#7C4DFF';
const C_CYAN   = '#00BCD4';
const C_GREEN  = '#00C853';
const C_AMBER  = '#FFB300';
const C_ORANGE = '#FF6B35';

/* ---- Tooltip customizado para recharts ---- */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      {label && <div className={styles.tooltipLabel}>{label}</div>}
      {payload.map(p => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span style={{ color: p.color ?? p.fill }}>{p.name}</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* ---- Card de stat ---- */
function StatCard({ label, value, icon: Icon, color, to }) {
  const content = (
    <div className={styles.card} style={{ '--accent': color }}>
      <div className={styles.cardIcon}><Icon size={16} /></div>
      <div className={styles.cardValue}>{value ?? '—'}</div>
      <div className={styles.cardLabel}>{label}</div>
    </div>
  );
  return to ? <Link to={to} className={styles.cardLink}>{content}</Link> : content;
}

/* ---- Barra de taxa inline ---- */
function TaxaBar({ value }) {
  const v = Number(value) || 0;
  const color = v >= 70 ? C_GREEN : v >= 40 ? C_AMBER : '#f44336';
  return (
    <div className={styles.taxaCell}>
      <div className={styles.taxaTrack}>
        <div className={styles.taxaFill} style={{ width: `${v}%`, background: color }} />
      </div>
      <span style={{ color }}>{v}%</span>
    </div>
  );
}

/* ---- props compartilhadas do eixo/grid recharts ---- */
const axisProps = { tick: { fill: '#666', fontSize: 11 }, axisLine: false, tickLine: false };
const gridProps = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)', vertical: false };

/* ════════════════════════════════════════════════════
   ABA 1 — Visão Geral
════════════════════════════════════════════════════ */
function TabOverview({ stats, monthly }) {
  const taxa = stats
    ? Math.round((Number(stats.resolvidos) / Math.max(Number(stats.total) - Number(stats.removidos), 1)) * 100)
    : 0;

  return (
    <div className={styles.tabSection}>
      {/* Cards */}
      <div className={styles.grid}>
        <StatCard label="Total de casos"      value={stats?.total}              icon={AlertCircle}   color="#666"    to="/complaints" />
        <StatCard label="Em tratativa"        value={stats?.em_tratativa}       icon={Clock}         color={C_ORANGE} to="/complaints/open" />
        <StatCard label="Aguardando cliente"  value={stats?.aguardando_cliente}  icon={MessageSquare} color={C_PURPLE} to="/complaints/open" />
        <StatCard label="Finalizados"         value={stats?.finalizado}          icon={Flag}          color={C_CYAN}  to="/complaints/resolved" />
        <StatCard label="Resolvidos"          value={stats?.resolvidos}          icon={CheckCircle}   color={C_GREEN} to="/complaints/resolved" />
        <StatCard label="Respondidos"         value={stats?.respondidos}         icon={MessageSquare} color="#26C6DA" to="/complaints/resolved" />
        <StatCard label="Sem avaliação"       value={stats?.sem_avaliacao}       icon={Star}          color={C_AMBER} to="/complaints/no-eval" />
        <StatCard label="Removidos"           value={stats?.removidos}           icon={Trash2}        color="#f44336" to="/complaints/removed" />
      </div>

      {/* Gráfico de tendência mensal */}
      {monthly && monthly.length > 0 && (
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <TrendingUp size={15} />
            <span>Tendência — últimos 12 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_PURPLE} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C_PURPLE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gResolvidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_GREEN} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C_GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#666', paddingTop: 8 }} />
              <Area type="monotone" dataKey="total"     name="Total"     stroke={C_PURPLE} fill="url(#gTotal)"     strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="resolvidos" name="Resolvidos" stroke={C_GREEN}  fill="url(#gResolvidos)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* KPIs secundários */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Taxa de resolução</div>
          <div className={styles.kpiValue} style={{ color: taxa >= 70 ? C_GREEN : taxa >= 40 ? C_AMBER : '#f44336' }}>
            {taxa}%
          </div>
          <div className={styles.kpiTrack}>
            <div className={styles.kpiFill} style={{
              width: `${taxa}%`,
              background: taxa >= 70 ? C_GREEN : taxa >= 40 ? C_AMBER : '#f44336',
            }} />
          </div>
        </div>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Sem avaliação do cliente</div>
          <div className={styles.kpiValue} style={{ color: C_AMBER }}>{stats?.sem_avaliacao ?? '—'}</div>
          <div className={styles.kpiHint}>casos resolvidos aguardando nota</div>
        </div>
        <div className={styles.kpiBox}>
          <div className={styles.kpiLabel}>Casos em aberto</div>
          <div className={styles.kpiValue} style={{ color: C_ORANGE }}>
            {Number(stats?.em_tratativa ?? 0) + Number(stats?.aguardando_cliente ?? 0)}
          </div>
          <div className={styles.kpiHint}>em tratativa + aguardando cliente</div>
        </div>
      </div>

      {/* Alertas */}
      {Number(stats?.sem_avaliacao) > 0 && (
        <div className={styles.alert} data-variant="amber">
          <Star size={13} />
          <span>
            <strong>{stats.sem_avaliacao}</strong> caso{stats.sem_avaliacao !== '1' ? 's' : ''} resolvido{stats.sem_avaliacao !== '1' ? 's' : ''} sem avaliação do cliente.{' '}
            <Link to="/complaints/no-eval">Ver lista →</Link>
          </span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ABA 2 — Origem & Agentes
════════════════════════════════════════════════════ */
function TabOriginAgent({ byOrigin, byAgent }) {
  return (
    <div className={styles.tabSection}>
      {/* Origem */}
      <div className={styles.chartCard}>
        <div className={styles.chartCardHeader}>
          <BarChart2 size={15} />
          <span>Casos por origem</span>
        </div>
        {byOrigin?.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, byOrigin.length * 44)}>
            <BarChart layout="vertical" data={byOrigin} margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" {...axisProps} allowDecimals={false} />
              <YAxis type="category" dataKey="origin" {...axisProps} width={140} tick={{ fill: '#aaa', fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#666', paddingTop: 8 }} />
              <Bar dataKey="total"     name="Total"     fill={C_PURPLE} radius={[0, 4, 4, 0]} />
              <Bar dataKey="resolvidos" name="Resolvidos" fill={C_CYAN}   radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className={styles.empty}>Nenhum dado disponível.</p>
        )}
      </div>

      {/* Agentes */}
      <div className={styles.tableCard}>
        <div className={styles.chartCardHeader}>
          <Users size={15} />
          <span>Ranking de agentes</span>
        </div>
        {byAgent?.length > 0 ? (
          <table className={styles.rankTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Agente</th>
                <th>Total</th>
                <th>Resolvidos</th>
                <th>Respondidos</th>
                <th>Taxa de resolução</th>
              </tr>
            </thead>
            <tbody>
              {byAgent.map((a, i) => (
                <tr key={a.agent} className={i === 0 ? styles.topAgent : ''}>
                  <td className={styles.rankNum}>{i + 1}</td>
                  <td className={styles.agentName}>{a.agent}</td>
                  <td>{a.total}</td>
                  <td>{a.resolvidos}</td>
                  <td>{a.avaliados ?? '—'}</td>
                  <td><TaxaBar value={a.taxa_resolucao} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>Nenhum agente com dados ainda.</p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   ABA 3 — Tendência Mensal
════════════════════════════════════════════════════ */
function TabTrends({ monthly }) {
  if (!monthly || monthly.length === 0) {
    return <p className={styles.empty}>Ainda não há dados mensais suficientes.</p>;
  }

  return (
    <div className={styles.tabSection}>
      {/* Gráfico composto */}
      <div className={styles.chartCard}>
        <div className={styles.chartCardHeader}>
          <TrendingUp size={15} />
          <span>Volume mensal — total vs resolvidos</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={monthly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#666', paddingTop: 8 }} />
            <Bar dataKey="total"     name="Total"     fill={C_PURPLE} opacity={0.7} radius={[3, 3, 0, 0]} />
            <Bar dataKey="removidos" name="Removidos" fill="#f44336"  opacity={0.6} radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="resolvidos" name="Resolvidos" stroke={C_GREEN} strokeWidth={2.5} dot={{ r: 3, fill: C_GREEN }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de detalhamento */}
      <div className={styles.tableCard}>
        <div className={styles.chartCardHeader}>
          <BarChart2 size={15} />
          <span>Detalhamento por mês</span>
        </div>
        <table className={styles.rankTable}>
          <thead>
            <tr>
              <th>Mês</th>
              <th>Total</th>
              <th>Resolvidos</th>
              <th>Removidos</th>
              <th>Taxa de resolução</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m, i) => (
              <tr key={i}>
                <td className={styles.agentName}>{m.label}</td>
                <td>{m.total}</td>
                <td style={{ color: C_GREEN }}>{m.resolvidos}</td>
                <td style={{ color: '#f44336' }}>{m.removidos}</td>
                <td><TaxaBar value={m.taxa_resolucao} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════ */
const TABS = [
  { id: 'overview', label: 'Visão Geral',     icon: BarChart2  },
  { id: 'origins',  label: 'Origem & Agentes', icon: Users      },
  { id: 'trends',   label: 'Tendência Mensal', icon: TrendingUp },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats,    setStats]    = useState(null);
  const [byOrigin, setByOrigin] = useState(null);
  const [byAgent,  setByAgent]  = useState(null);
  const [monthly,  setMonthly]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    Promise.all([
      API.get('/api/complaints/stats/overview'),
      API.get('/api/complaints/stats/by-origin'),
      API.get('/api/complaints/stats/by-agent'),
      API.get('/api/complaints/stats/monthly'),
    ])
      .then(([ov, orig, ag, mo]) => {
        setStats(ov.data);
        setByOrigin(orig.data);
        setByAgent(ag.data);
        setMonthly(mo.data);
      })
      .catch(() => setError('Não foi possível carregar as estatísticas.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Carregando...</div>;

  if (error) return (
    <div className={styles.page}>
      <div className={styles.header}><h1>Painel</h1></div>
      <div className={styles.errorMsg}>{error}</div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Painel</h1>
        <p>Visão geral e análise das reclamações no Reclame Aqui</p>
      </div>

      <div className={styles.tabs}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.tab} ${activeTab === id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'overview' && <TabOverview stats={stats} monthly={monthly} />}
        {activeTab === 'origins'  && <TabOriginAgent byOrigin={byOrigin} byAgent={byAgent} />}
        {activeTab === 'trends'   && <TabTrends monthly={monthly} />}
      </div>
    </div>
  );
}
