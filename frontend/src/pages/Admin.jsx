import { useState, useEffect } from 'react';
import { API } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Shield, User, Plus, Trash2 } from 'lucide-react';
import styles from './Admin.module.css';

export default function Admin() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    API.get('/api/admin/users')
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const approve = async (id) => {
    await API.patch(`/api/admin/users/${id}/approve`);
    fetchUsers();
  };

  const revoke = async (id) => {
    if (!confirm('Revogar acesso deste usuário?')) return;
    await API.patch(`/api/admin/users/${id}/revoke`);
    fetchUsers();
  };

  const toggleRole = async (id, currentRole) => {
    const role = currentRole === 'admin' ? 'member' : 'admin';
    await API.patch(`/api/admin/users/${id}/role`, { role });
    fetchUsers();
  };

  const deleteUser = async (id, name) => {
    if (!confirm(`Excluir o usuário "${name}"? Esta ação não pode ser desfeita.`)) return;
    await API.delete(`/api/admin/users/${id}`);
    fetchUsers();
  };

  const createUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await API.post('/api/admin/users', form);
      setForm({ name: '', email: '', password: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Erro ao criar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = users.filter(u => !u.approved);
  const active = users.filter(u => u.approved);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Usuários</h1>
          <p>Gerencie quem pode acessar o sistema</p>
        </div>
        <button className={styles.newBtn} onClick={() => { setShowForm(v => !v); setFormError(''); }}>
          <Plus size={15} />
          Novo usuário
        </button>
      </div>

      {showForm && (
        <form className={styles.createForm} onSubmit={createUser}>
          <input
            className={styles.formInput}
            placeholder="Nome completo"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            className={styles.formInput}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            className={styles.formInput}
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          {formError && <span className={styles.formError}>{formError}</span>}
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancelar</button>
            <button type="submit" className={styles.approveBtn} disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <>
          {pending.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.pendingDot} />
                Aguardando aprovação ({pending.length})
              </h2>
              <div className={styles.cards}>
                {pending.map(u => (
                  <div key={u.id} className={`${styles.card} ${styles.pendingCard}`}>
                    <div className={styles.info}>
                      <span className={styles.name}>{u.name}</span>
                      <span className={styles.email}>{u.email}</span>
                    </div>
                    <button className={styles.approveBtn} onClick={() => approve(u.id)}>
                      <Check size={14} /> Aprovar
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Ativos ({active.length})</h2>
            <div className={styles.cards}>
              {active.map(u => (
                <div key={u.id} className={styles.card}>
                  <div className={styles.info}>
                    <div className={styles.nameRow}>
                      <span className={styles.name}>{u.name}</span>
                      {u.role === 'admin' && (
                        <span className={styles.adminBadge}><Shield size={10} /> Admin</span>
                      )}
                    </div>
                    <span className={styles.email}>{u.email}</span>
                  </div>
                  {u.id !== me.id && (
                    <div className={styles.cardActions}>
                      <button
                        className={styles.roleBtn}
                        onClick={() => toggleRole(u.id, u.role)}
                        title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                      >
                        {u.role === 'admin' ? <User size={13} /> : <Shield size={13} />}
                      </button>
                      <button
                        className={styles.revokeBtn}
                        onClick={() => revoke(u.id)}
                        title="Revogar acesso"
                      >
                        <X size={13} />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => deleteUser(u.id, u.name)}
                        title="Excluir usuário"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
