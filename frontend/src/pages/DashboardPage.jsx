import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { progressAPI, wordsAPI } from '../services/api';
import { Zap, BookOpen, Target, Flame, Trophy, TrendingUp, Star, ChevronRight, Plus } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{
      display: 'flex', alignItems: 'flex-start', gap: 14, padding: 20,
      borderColor: `${color}30`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [recentWords, setRecentWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([progressAPI.get(), wordsAPI.list({ limit: 5 })])
      .then(([p, w]) => { setProgress(p.data); setRecentWords(w.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-center" style={{ height: 300 }}>
      <div className="spinner" />
    </div>
  );

  const lvlPct = progress ? Math.min(100, ((progress.xp - progress.current_level_xp) / (progress.next_level_xp - progress.current_level_xp)) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-fade">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {greeting}, {user?.username} 👋
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>
            {progress?.streak > 0
              ? `🔥 ${progress.streak}-day streak — keep it going!`
              : 'Start your learning streak today!'}
          </p>
        </div>
        <Link to="/vocabulary" className="btn btn-primary">
          <Plus size={16} /> Add Word
        </Link>
      </div>

      {/* Level card */}
      <div className="card card-glow" style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))',
        padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff',
              boxShadow: 'var(--glow-v)',
            }}>
              {progress?.level || 1}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Level {progress?.level || 1}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>{progress?.xp || 0} XP total</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Next level</div>
            <div style={{ fontWeight: 600, color: 'var(--cyan-light)' }}>
              {progress ? progress.next_level_xp - progress.xp : 0} XP to go
            </div>
          </div>
        </div>
        <div className="progress-track" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${lvlPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text3)' }}>
          <span>{progress?.current_level_xp} XP</span>
          <span>{Math.round(lvlPct)}%</span>
          <span>{progress?.next_level_xp} XP</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid-4">
        <StatCard icon={BookOpen} label="Total Words" value={progress?.total_words || 0} color="var(--violet)" />
        <StatCard icon={Trophy} label="Mastered" value={progress?.learned_words || 0} color="var(--emerald)" sub="mastery ≥ 80%" />
        <StatCard icon={Target} label="Accuracy" value={`${progress?.accuracy_percentage || 0}%`} color="var(--cyan)" />
        <StatCard icon={Flame} label="Weak Words" value={progress?.weak_words || 0} color="var(--rose)" sub="need practice" />
      </div>

      {/* Bottom two cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="grid-2">
        {/* Quick actions */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { to: '/quiz', icon: Zap, label: 'Start Quiz', sub: 'Test your knowledge', color: 'var(--violet)' },
              { to: '/daily', icon: Star, label: 'Daily Goal', sub: 'Choose today\'s words', color: 'var(--amber)' },
              { to: '/vocabulary', icon: BookOpen, label: 'My Vocabulary', sub: 'Browse all words', color: 'var(--cyan)' },
              { to: '/progress', icon: TrendingUp, label: 'View Progress', sub: 'Stats & badges', color: 'var(--emerald)' },
            ].map(({ to, icon: Icon, label, sub, color }) => (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 10, background: 'var(--bg2)', textDecoration: 'none',
                border: '1px solid var(--border)', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sub}</div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text3)' }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent words */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Recent Words</h3>
            <Link to="/vocabulary" style={{ fontSize: 12, color: 'var(--violet-light)', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          {recentWords.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-icon">📝</div>
              <p style={{ fontSize: 13 }}>No words yet.<br />Add your first word!</p>
              <Link to="/vocabulary" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                <Plus size={13} /> Add Word
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentWords.map(w => (
                <div key={w.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{w.english}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{w.uzbek}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`badge badge-${w.difficulty === 'easy' ? 'emerald' : w.difficulty === 'hard' ? 'rose' : 'amber'}`}>
                      {w.difficulty}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {Math.round(w.mastery_score * 100)}% mastery
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      {progress?.badges?.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Recent Badges</h3>
            <Link to="/progress" style={{ fontSize: 12, color: 'var(--violet-light)', textDecoration: 'none', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {progress.badges.slice(0, 6).map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 100, fontSize: 13,
              }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <span style={{ fontWeight: 600 }}>{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
