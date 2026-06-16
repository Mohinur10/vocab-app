import { useState, useEffect } from 'react';
import { progressAPI, quizAPI } from '../services/api';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, Target, Flame, Zap, BookOpen, TrendingUp } from 'lucide-react';

function BadgeGrid({ badges }) {
  return (
    <div>
      <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>All Badges</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {badges.map(b => (
          <div key={b.id} className="card" style={{
            padding: 16, textAlign: 'center',
            opacity: b.earned ? 1 : 0.45,
            border: b.earned ? '1px solid rgba(124,58,237,0.3)' : '1px solid var(--border)',
            background: b.earned ? 'rgba(124,58,237,0.05)' : 'var(--surface)',
            transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 36, marginBottom: 8, filter: b.earned ? 'none' : 'grayscale(1)' }}>
              {b.icon}
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{b.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{b.description}</div>
            {b.earned
              ? <span className="badge badge-violet" style={{ fontSize: 10 }}>✓ Earned</span>
              : <span style={{ fontSize: 10, color: 'var(--text3)' }}>+{b.xp_reward} XP</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([progressAPI.get(), progressAPI.badges(), quizAPI.history()])
      .then(([p, b, h]) => {
        setProgress(p.data);
        setAllBadges(b.data);
        setHistory(h.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>;

  const lvlPct = progress ? Math.min(100, ((progress.xp - progress.current_level_xp) / Math.max(1, progress.next_level_xp - progress.current_level_xp)) * 100) : 0;
  const earnedCount = allBadges.filter(b => b.earned).length;

  const chartData = [
    { name: 'Mastered', value: progress.accuracy_percentage, fill: 'url(#grad1)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-fade">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Progress</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Your learning journey at a glance</p>
      </div>

      {/* Top stats */}
      <div className="grid-4">
        {[
          { icon: BookOpen, label: 'Total Words', value: progress.total_words, color: 'var(--violet)' },
          { icon: Trophy, label: 'Mastered', value: progress.learned_words, color: 'var(--emerald)' },
          { icon: Flame, label: 'Streak', value: `${progress.streak}d`, color: 'var(--rose)' },
          { icon: Trophy, label: 'Badges', value: `${earnedCount}/${allBadges.length}`, color: 'var(--amber)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card" style={{ border: `1px solid ${color}25`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Level + Accuracy */}
      <div className="grid-2">
        {/* Level card */}
        <div className="card card-glow" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 15 }}>Level Progress</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#fff', boxShadow: 'var(--glow-v)',
            }}>{progress.level}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Level {progress.level}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>{progress.xp} XP total</div>
              <div style={{ color: 'var(--violet-light)', fontSize: 12, marginTop: 3 }}>
                {progress.next_level_xp - progress.xp} XP to next level
              </div>
            </div>
          </div>
          <div className="progress-track" style={{ height: 10, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: `${lvlPct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
            <span>{progress.current_level_xp} XP</span>
            <span>{Math.round(lvlPct)}%</span>
            <span>{progress.next_level_xp} XP</span>
          </div>

          {/* XP breakdown */}
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            {[
              { label: 'Words Added', value: `${progress.total_words * 5}`, icon: '📝' },
              { label: 'Quiz XP', value: `${progress.xp - progress.total_words * 5 > 0 ? progress.xp - progress.total_words * 5 : 0}`, icon: '⚡' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                flex: 1, padding: '10px 12px', background: 'var(--bg2)',
                borderRadius: 10, border: '1px solid var(--border)', fontSize: 13,
              }}>
                <div style={{ fontWeight: 700 }}>{icon} {value} XP</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Accuracy */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Quiz Accuracy</h3>
          <div style={{ height: 180, position: 'relative' }}>
            <ResponsiveContainer>
              <RadialBarChart cx="50%" cy="60%" innerRadius="60%" outerRadius="90%"
                startAngle={180} endAngle={0} data={chartData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <RadialBar background={{ fill: 'var(--bg3)' }} dataKey="value" max={100} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--cyan-light)' }}>
                {progress.accuracy_percentage}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Overall accuracy</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(16,185,129,0.1)', borderRadius: 10 }}>
              <div style={{ fontWeight: 700, color: 'var(--emerald)' }}>{progress.learned_words}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Mastered</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 12, background: 'rgba(244,63,94,0.1)', borderRadius: 10 }}>
              <div style={{ fontWeight: 700, color: 'var(--rose)' }}>{progress.weak_words}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Need work</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz history */}
      {history.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Recent Quiz Sessions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 8).map(s => {
              const color = s.accuracy >= 80 ? 'var(--emerald)' : s.accuracy >= 60 ? 'var(--amber)' : 'var(--rose)';
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: 'var(--bg2)', borderRadius: 10,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                      {s.accuracy === 100 ? '🏆' : s.accuracy >= 80 ? '⭐' : s.accuracy >= 60 ? '👍' : '💪'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {s.mode === 'en_to_uz' ? 'EN → UZ' : s.mode === 'uz_to_en' ? 'UZ → EN' : '🎲 Mixed'}
                        {' '}· {s.total_questions} questions
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color, fontSize: 16 }}>{s.accuracy}%</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.correct_answers}/{s.total_questions}</div>
                    </div>
                    <div style={{
                      background: 'rgba(245,158,11,0.15)', color: 'var(--amber)',
                      padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    }}>
                      +{s.xp_earned} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges */}
      <BadgeGrid badges={allBadges} />
    </div>
  );
}
