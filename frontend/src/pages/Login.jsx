import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, API } from '../contexts/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user?.approved) navigate('/dashboard');
  }, [user, loading]);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'pending') setError('Seu acesso está aguardando aprovação do administrador.');
    if (err === 'oauth')   setError('Erro ao autenticar com Google. Tente novamente.');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>NF</div>
          <span className={styles.logoText}>RAdar</span>
        </div>

        <h1 className={styles.title}>RAdar</h1>
        <p className={styles.subtitle}>
          Gestão de reclamações da NextFit no Reclame Aqui.<br />
          Acesso exclusivo para a equipe interna.
        </p>

        {error && <div className={styles.error}>{error}</div>}

        {/* Botão Google */}
        <button
          type="button"
          className={styles.googleBtn}
          onClick={() => { window.location.href = `${API.defaults.baseURL}/auth/google`; }}
        >
          <GoogleIcon />
          Continuar com Google
        </button>

        <div className={styles.divider}><span>ou</span></div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className={styles.submitBtn} type="submit" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar com email'}
          </button>
        </form>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
