import { useState, useEffect, useRef } from 'react';
import { quizAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw, Sparkles, Brain } from 'lucide-react';

function XPBurst({ amount, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000, pointerEvents: 'none',
      animation: 'xp-pop 1.2s ease-out forwards',
      fontSize: 32, fontWeight: 800,
      color: 'var(--amber)',
      textShadow: '0 0 30px rgba(245,158,11,0.8)',
    }}>
      +{amount} XP ⚡
    </div>
  );
}

function BadgeToast({ badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 28 }}>{badge.icon}</span>
      <div>
        <div style={{ fontWeight: 700 }}>Badge Unlocked: {badge.name}!</div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>+{badge.xp_reward} bonus XP</div>
      </div>
    </div>
  );
}

function QuizSetup({ onStart }) {
  const [config, setConfig] = useState({ mode: 'random', word_count: 10, daily_mode: false });
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try { await onStart(config); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }} className="animate-slide">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--glow-v)',
        }}>
          <Zap size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>Start Quiz</h1>
        <p style={{ color: 'var(--text2)', marginTop: 6 }}>Configure your learning session</p>
      </div>

      <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Mode */}
        <div>
          <label className="label">Quiz Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { value: 'en_to_uz', label: 'EN → UZ', sub: 'English to Uzbek' },
              { value: 'uz_to_en', label: 'UZ → EN', sub: 'Uzbek to English' },
              { value: 'random', label: '🎲 Mixed', sub: 'Random mode' },
            ].map(({ value, label, sub }) => (
              <button key={value}
                onClick={() => setConfig(p => ({ ...p, mode: value }))}
                style={{
                  padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                  border: config.mode === value ? '2px solid var(--violet)' : '1px solid var(--border)',
                  background: config.mode === value ? 'var(--violet-glow)' : 'var(--bg2)',
                  color: config.mode === value ? 'var(--violet-light)' : 'var(--text)',
                  textAlign: 'center', transition: 'all 0.15s',
                }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <label className="label">Number of Questions: {config.word_count}</label>
          <input type="range" min={2} max={50} value={config.word_count}
            onChange={e => setConfig(p => ({ ...p, word_count: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--violet)', cursor: 'pointer' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            <span>2</span><span>50</span>
          </div>
        </div>

        {/* Daily mode */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderRadius: 10, background: 'var(--bg2)',
          border: config.daily_mode ? '1px solid rgba(245,158,11,0.4)' : '1px solid var(--border)',
          cursor: 'pointer', transition: 'all 0.15s',
        }} onClick={() => setConfig(p => ({ ...p, daily_mode: !p.daily_mode }))}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>📅 Daily Words Only</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Quiz only your selected daily words</div>
          </div>
          <div style={{
            width: 40, height: 22, borderRadius: 11, position: 'relative', flexShrink: 0,
            background: config.daily_mode ? 'var(--amber)' : 'var(--border)',
            transition: 'background 0.2s',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, transition: 'left 0.2s',
              left: config.daily_mode ? 21 : 3,
            }} />
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-full" onClick={handleStart} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><Zap size={18} /> Start Quiz</>}
        </button>
      </div>
    </div>
  );
}

function QuizQuestion({ question, onAnswer, questionIndex, totalQuestions }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (option, idx) => {
    if (answered || loading) return;
    setSelected(idx);
    setAnswered(true);
    setLoading(true);

    const isCorrect = idx === question.correct_option_index;
    const correctAnswer = question.options[question.correct_option_index];

    try {
      const res = await quizAPI.answer({
        session_id: question.session_id,
        word_id: question.word_id,
        user_answer: option,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
      });
      setResult(res.data);
      if (res.data.new_badges?.length > 0) {
        setTimeout(() => {
          res.data.new_badges.forEach(b => toast(<BadgeToast badge={b} />, { duration: 4000 }));
        }, 500);
      }
    } catch { toast.error('Failed to submit answer'); }
    finally { setLoading(false); }
  };

  const optionStyle = (idx) => {
    let bg = 'var(--bg2)', border = 'var(--border)', color = 'var(--text)';
    if (answered) {
      if (idx === question.correct_option_index) {
        bg = 'rgba(16,185,129,0.15)'; border = 'var(--emerald)'; color = 'var(--emerald-light)';
      } else if (idx === selected && idx !== question.correct_option_index) {
        bg = 'rgba(244,63,94,0.15)'; border = 'var(--rose)'; color = 'var(--rose-light)';
      }
    }
    return { background: bg, borderColor: border, color };
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }} className="animate-slide">
      {/* Progress */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span className={`badge badge-${question.mode === 'en_to_uz' ? 'violet' : 'cyan'}`}>
            {question.mode === 'en_to_uz' ? 'EN → UZ' : 'UZ → EN'}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((questionIndex) / totalQuestions) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="card card-glow" style={{
        textAlign: 'center', padding: '32px 24px', marginBottom: 20,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.05))',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {question.mode === 'en_to_uz' ? 'Translate to Uzbek' : 'Translate to English'}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{question.question}</div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map((opt, idx) => (
          <button key={idx}
            onClick={() => handleSelect(opt, idx)}
            disabled={answered || loading}
            style={{
              ...optionStyle(idx),
              padding: '16px 20px', borderRadius: 12, border: `2px solid`,
              cursor: answered ? 'default' : 'pointer', textAlign: 'left',
              fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600,
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
            onMouseEnter={e => { if (!answered) e.currentTarget.style.borderColor = 'var(--violet)'; }}
            onMouseLeave={e => { if (!answered) e.currentTarget.style.borderColor = 'var(--border)'; }}>
            <span>{opt}</span>
            {answered && idx === question.correct_option_index && <CheckCircle size={18} style={{ color: 'var(--emerald)' }} />}
            {answered && idx === selected && idx !== question.correct_option_index && <XCircle size={18} style={{ color: 'var(--rose)' }} />}
          </button>
        ))}
      </div>

      {/* Result panel */}
      {result && (
        <div className="animate-slide" style={{
          marginTop: 20, padding: 20, borderRadius: 14,
          background: result.is_correct ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
          border: `1px solid ${result.is_correct ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: result.explanation ? 10 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {result.is_correct
                ? <CheckCircle size={20} style={{ color: 'var(--emerald)' }} />
                : <XCircle size={20} style={{ color: 'var(--rose)' }} />}
              <span style={{ fontWeight: 700, color: result.is_correct ? 'var(--emerald-light)' : 'var(--rose-light)' }}>
                {result.is_correct ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {result.xp_earned > 0 && (
              <span style={{
                background: 'rgba(245,158,11,0.2)', color: 'var(--amber)',
                border: '1px solid rgba(245,158,11,0.4)', padding: '4px 10px',
                borderRadius: 100, fontSize: 13, fontWeight: 700,
              }}>+{result.xp_earned} XP</span>
            )}
          </div>
          {result.explanation && (
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, display: 'flex', gap: 6 }}>
              <Brain size={14} style={{ color: 'var(--violet-light)', flexShrink: 0, marginTop: 2 }} />
              {result.explanation}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
            Mastery: {Math.round(result.mastery_score * 100)}%
          </div>
        </div>
      )}

      {answered && result && (
        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: 16 }}
          onClick={() => onAnswer(result)}>
          {questionIndex + 1 >= totalQuestions ? (
            <><Trophy size={16} /> See Results</>
          ) : (
            <>Next Question <ChevronRight size={16} /></>
          )}
        </button>
      )}

      <XPBurst amount={result?.xp_earned} visible={result?.is_correct && result?.xp_earned > 0} />
    </div>
  );
}

function QuizResults({ results, sessionId, onRestart }) {
  const [completing, setCompleting] = useState(false);
  const [final, setFinal] = useState(null);
  const { updateUser } = useAuth();

  useEffect(() => {
    const complete = async () => {
      setCompleting(true);
      try {
        const res = await quizAPI.complete(sessionId);
        setFinal(res.data);
        updateUser({});
      } catch { toast.error('Failed to finalize quiz'); }
      finally { setCompleting(false); }
    };
    complete();
  }, [sessionId]);

  const correct = results.filter(r => r.is_correct).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);
  const totalXp = results.reduce((sum, r) => sum + (r.xp_earned || 0), 0);

  const emoji = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 60 ? '👍' : pct >= 40 ? '💪' : '📚';
  const msg = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good job!' : pct >= 40 ? 'Keep practicing!' : 'Don\'t give up!';

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }} className="animate-pop">
      <div style={{ fontSize: 72, marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>{emoji}</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{msg}</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 32 }}>Quiz complete! Here's how you did:</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Score', value: `${pct}%`, color: pct >= 80 ? 'var(--emerald)' : pct >= 60 ? 'var(--amber)' : 'var(--rose)' },
          { label: 'Correct', value: `${correct}/${total}`, color: 'var(--violet)' },
          { label: 'XP Earned', value: `+${totalXp}`, color: 'var(--amber)' },
          { label: 'Accuracy', value: final ? `${final.accuracy}%` : `${pct}%`, color: 'var(--cyan)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: 20, border: `1px solid ${color}30` }}>
            <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: 28 }}>
        <div className="progress-track" style={{ height: 12 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={onRestart}>
          <RotateCcw size={18} /> New Quiz
        </button>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const [phase, setPhase] = useState('setup'); // setup | quiz | results
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState([]);

  const handleStart = async (config) => {
    try {
      const res = await quizAPI.start(config);
      setQuestions(res.data.questions);
      setSessionId(res.data.session_id);
      setCurrentIdx(0);
      setResults([]);
      setPhase('quiz');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Not enough words. Add at least 2 words first!');
    }
  };

  const handleAnswer = (result) => {
    const newResults = [...results, result];
    setResults(newResults);
    if (currentIdx + 1 >= questions.length) {
      setPhase('results');
    } else {
      setCurrentIdx(p => p + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: '60vh', justifyContent: 'center' }} className="animate-fade">
      {phase === 'setup' && <QuizSetup onStart={handleStart} />}
      {phase === 'quiz' && questions[currentIdx] && (
        <QuizQuestion
          question={questions[currentIdx]}
          onAnswer={handleAnswer}
          questionIndex={currentIdx}
          totalQuestions={questions.length}
        />
      )}
      {phase === 'results' && (
        <QuizResults results={results} sessionId={sessionId} onRestart={() => setPhase('setup')} />
      )}
    </div>
  );
}
