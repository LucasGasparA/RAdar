import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, List, Clock, CheckCircle,
  Star, Users, LogOut, AlertCircle
} from 'lucide-react';
import styles from './Layout.module.css';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
  { to: '/complaints', icon: List, label: 'Todos os Casos' },
  { to: '/complaints/open', icon: Clock, label: 'Em Aberto' },
  { to: '/complaints/resolved', icon: CheckCircle, label: 'Resolvidos' },
  { to: '/complaints/no-eval', icon: Star, label: 'Sem Avaliação' },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>NF</div>
          <div>
            <span className={styles.brandName}>RAdar</span>
            <span className={styles.brandSub}>by NextFit</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <div className={styles.divider} />
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <Users size={16} />
                <span>Usuários</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className={styles.userArea}>
          {user?.avatar && (
            <img src={user.avatar} alt={user.name} className={styles.avatar} />
          )}
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
            <span className={styles.userRole}>{user?.role === 'admin' ? 'Admin' : 'Membro'}</span>
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Sair">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
