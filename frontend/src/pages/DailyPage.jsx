import { useState, useEffect } from 'react';
import { wordsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Sun, Target, CheckCircle, Zap, RefreshCw } from 'lucide-react';

export default function DailyPage() {
  const [dailyWords, setDailyWords] = useState([]);
  const [targetCount, setTargetCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const res = await wordsAPI.getDaily();
      setDailyWords(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDaily(); }, []);

  const handleSetDaily = async () => {
    setSetting(true);
    try {
      const res = await wordsAPI.setDaily(targetCount);
      await fetchDaily();
      setShowSetup(false);
      toast.success(`${res.data.count} words selected for today! 📅`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to set daily goal');
    } finally { setSetting(false); }
  };

  const masteryAvg = dailyWords.length
    ? Math.round(dailyWords.reduce((s, w) => s + w.mastery_score, 0) / dailyWords.length * 100)
    : 0;
  const learned = dailyWords.filter(w => w.is_learned).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Daily Goal</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Focus on a curated set of words each day</p>
      </div>

      {/* Stats */}
      {dailyWords.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="grid-3">
          {[
            { label: 'Words Today', value: dailyWords.length, color: 'var(--violet)', icon: '📚' },
            { label: 'Mastered', value: learned, color: 'var(--emerald)', icon: '✅' },
            { label: 'Avg Mastery', value: `${masteryAvg}%`, color: 'var(--cyan)', icon: '🎯' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="card" style={{ textAlign: 'center', border: `1px solid ${color}25` }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Set goal card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(124,58,237,0.05))',
        border: '1px solid rgba(245,158,11,0.2)',
      }}>
        {!showSetup ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sun size={24} style={{ color: 'var(--amber)' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {dailyWords.length > 0 ? `${dailyWords.length} words selected for today` : 'Set your daily goal'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {dailyWords.length > 0
                    ? 'Smart selection prioritizes your weakest words'
                    : 'Choose how many words you want to learn today'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {dailyWords.length > 0 && (
                <Link to="/quiz" className="btn btn-primary">
                  <Zap size={15} /> Quiz Daily Words
                </Link>
              )}
              <button className="btn btn-secondary" onClick={() => setShowSetup(true)}>
                <RefreshCw size={14} /> {dailyWords.length > 0 ? 'Reset Goal' : 'Set Goal'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Set Daily Goal</div>
            <div>
              <label className="label">How many words today? <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{targetCount}</span></label>
              <input type="range" min={5} max={100} step={5} value={targetCount}
                onChange={e => setTargetCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--amber)', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                <span>5</span><span>50</span><span>100</span>
              </div>
            </div>
            <div style={{
              padding: '12px 16px', background: 'var(--bg2)', borderRadius: 10,
              border: '1px solid var(--border)', fontSize: 13, color: 'var(--text2)',
            }}>
              💡 Smart selection will prioritize <strong style={{ color: 'var(--amber)' }}>weak words</strong> you've gotten wrong before, then fill with new words.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSetDaily} disabled={setting}>
                {setting ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Target size={15} /> Set {targetCount} Words</>}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowSetup(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Words list */}
      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : dailyWords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No daily words set</h3>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Set your daily goal above to get started</p>
        </div>
      ) : (
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Today's Words</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {dailyWords.map(word => {
              const mastery = Math.round(word.mastery_score * 100);
              const masteryColor = mastery >= 80 ? 'var(--emerald)' : mastery >= 50 ? 'var(--amber)' : 'var(--rose)';
              return (
                <div key={word.id} className="card" style={{
                  border: word.is_learned ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
                  padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{word.english}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 14 }}>{word.uzbek}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {word.is_learned && <CheckCircle size={16} style={{ color: 'var(--emerald)' }} />}
                      <span className={`badge badge-${word.difficulty === 'easy' ? 'emerald' : word.difficulty === 'hard' ? 'rose' : 'amber'}`} style={{ fontSize: 10 }}>
                        {word.difficulty}
                      </span>
                    </div>
                  </div>
                  {word.example_sentence && (
                    <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginBottom: 10 }}>
                      "{word.example_sentence}"
                    </div>
                  )}
                  {word.ai_hint && (
                    <div style={{
                      fontSize: 12, color: 'var(--violet-light)', padding: '8px 10px',
                      background: 'rgba(124,58,237,0.1)', borderRadius: 8, marginBottom: 10,
                    }}>
                      💡 {word.ai_hint}
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
                      <span>Mastery</span>
                      <span style={{ color: masteryColor, fontWeight: 600 }}>{mastery}%</span>
                    </div>
                    <div className="progress-track" style={{ height: 4 }}>
                      <div style={{ height: '100%', width: `${mastery}%`, background: masteryColor, borderRadius: 2, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
