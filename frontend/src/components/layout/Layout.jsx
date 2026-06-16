import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Zap, Sun, BarChart3,
  LogOut, Menu, X, Sparkles, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vocabulary', icon: BookOpen, label: 'My Words' },
  { to: '/quiz', icon: Zap, label: 'Quiz' },
  { to: '/daily', icon: Sun, label: 'Daily Goal' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const levelProgress = user ? ((user.xp % 1000) / 1000) * 100 : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 40, backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0,
        zIndex: 50, transform: mobileOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }}
        className={`sidebar ${!mobileOpen ? 'hide-mobile' : ''}`}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--glow-v)',
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>LexiLearn</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: -2 }}>AI Vocabulary</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 500,
                transition: 'all 0.15s',
                background: isActive ? 'var(--violet-glow)' : 'transparent',
                color: isActive ? 'var(--violet-light)' : 'var(--text2)',
                border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User panel */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff',
              }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.username}
                </div>
                <div style={{ fontSize: 11, color: 'var(--violet-light)' }}>
                  Level {user?.level} · {user?.xp} XP
                </div>
              </div>
            </div>
            <div className="progress-track" style={{ marginBottom: 8 }}>
              <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}
              style={{ width: '100%', color: 'var(--text3)', fontSize: 12 }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column' }}
        className="main-content">
        {/* Mobile top bar */}
        <div style={{
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 30,
        }} className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <Sparkles size={16} style={{ color: 'var(--violet-light)' }} /> LexiLearn
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
        </div>

        <main style={{ flex: 1, padding: '32px', maxWidth: 1200, width: '100%', margin: '0 auto' }}
          className="main-inner">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.show { transform: translateX(0); }
          .main-content { margin-left: 0 !important; }
          .mobile-header { display: flex !important; }
          .main-inner { padding: 20px !important; }
        }
      `}</style>
    </div>
  );
}
