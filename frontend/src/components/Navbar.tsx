import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canCreateStall, ROLE_LABEL } from '../utils/permissions';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { state: { flash: 'Anda berhasil logout.' } });
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-icon" aria-hidden="true">
            🍜
          </span>
          <span>
            Review<strong>Kantin</strong>
          </span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>
            Warung
          </NavLink>
          {canCreateStall(user) && <NavLink to="/stalls/new">+ Tambah Warung</NavLink>}
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <NavLink to="/me" className="user-chip" title="Profil saya">
                <span className="avatar" aria-hidden="true">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="user-chip-text">
                  <span className="user-name">{user.name}</span>
                  <span className={`role-badge role-${user.role}`}>{ROLE_LABEL[user.role]}</span>
                </span>
              </NavLink>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-ghost btn-sm">
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">
                Daftar
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
