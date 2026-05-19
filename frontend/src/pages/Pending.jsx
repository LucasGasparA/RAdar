import { useAuth } from '../contexts/AuthContext';
import styles from './Pending.module.css';

export default function Pending() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>⏳</div>
        <h1>Aguardando aprovação</h1>
        <p>
          Olá, <strong>{user?.name?.split(' ')[0]}</strong>. Seu acesso foi solicitado e está aguardando aprovação de um administrador.
        </p>
        <p className={styles.email}>{user?.email}</p>
        <button className={styles.logout} onClick={logout}>Sair</button>
      </div>
    </div>
  );
}
