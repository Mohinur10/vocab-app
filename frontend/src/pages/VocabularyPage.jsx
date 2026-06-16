import { useState, useEffect, useCallback } from 'react';
import { wordsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit3, X, Check, Sparkles, Brain, ChevronDown, ChevronUp } from 'lucide-react';

function WordCard({ word, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ english: word.english, uzbek: word.uzbek, example_sentence: word.example_sentence || '', difficulty: word.difficulty });
  const [deleting, setDeleting] = useState(false);

  const masteryPct = Math.round(word.mastery_score * 100);
  const masteryColor = masteryPct >= 80 ? 'var(--emerald)' : masteryPct >= 50 ? 'var(--amber)' : 'var(--rose)';

  const handleSave = async () => {
    try {
      const res = await wordsAPI.update(word.id, form);
      onUpdate(res.data);
      setEditing(false);
      toast.success('Word updated!');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${word.english}"?`)) return;
    setDeleting(true);
    try {
      await wordsAPI.delete(word.id);
      onDelete(word.id);
      toast.success('Word deleted');
    } catch { toast.error('Failed to delete'); setDeleting(false); }
  };

  return (
    <div className="card animate-fade" style={{
      border: word.is_learned ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
      transition: 'border-color 0.2s',
    }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="grid-2">
            <div>
              <label className="label">English</label>
              <input className="input" value={form.english} onChange={e => setForm(p => ({ ...p, english: e.target.value }))} />
            </div>
            <div>
              <label className="label">Uzbek</label>
              <input className="input" value={form.uzbek} onChange={e => setForm(p => ({ ...p, uzbek: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Example Sentence</label>
            <textarea className="textarea" value={form.example_sentence} onChange={e => setForm(p => ({ ...p, example_sentence: e.target.value }))} style={{ minHeight: 60 }} />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select className="select" value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave}><Check size={13} /> Save</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}><X size={13} /> Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 17 }}>{word.english}</span>
                {word.is_learned && <span className="badge badge-emerald" style={{ fontSize: 10 }}>✓ Learned</span>}
                {word.in_daily && <span className="badge badge-cyan" style={{ fontSize: 10 }}>📅 Daily</span>}
              </div>
              <div style={{ color: 'var(--text2)', marginTop: 3, fontSize: 14 }}>{word.uzbek}</div>
              {word.example_sentence && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontStyle: 'italic' }}>
                  "{word.example_sentence}"
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <span className={`badge badge-${word.difficulty === 'easy' ? 'emerald' : word.difficulty === 'hard' ? 'rose' : 'amber'}`}>
                {word.difficulty}
              </span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(true)}><Edit3 size={13} /></button>
              <button className="btn btn-danger btn-icon btn-sm" onClick={handleDelete} disabled={deleting}><Trash2 size={13} /></button>
            </div>
          </div>

          {/* Mastery bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>
              <span>Mastery: {masteryPct}%</span>
              <span>✓ {word.correct_count} · ✗ {word.wrong_count} · 👁 {word.review_count}</span>
            </div>
            <div className="progress-track" style={{ height: 5 }}>
              <div style={{ height: '100%', width: `${masteryPct}%`, background: masteryColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* AI content */}
          {(word.ai_hint || word.ai_example || word.ai_uzbek_explanation) && (
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(p => !p)}
                style={{ fontSize: 12, color: 'var(--violet-light)', padding: '4px 0' }}>
                <Sparkles size={12} /> AI Content {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {expanded && (
                <div style={{
                  marginTop: 10, padding: 14, background: 'var(--bg2)',
                  borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }} className="animate-fade">
                  {word.ai_example && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--violet-light)', fontWeight: 600, marginBottom: 3 }}>📝 Example</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{word.ai_example}</div>
                    </div>
                  )}
                  {word.ai_hint && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--cyan-light)', fontWeight: 600, marginBottom: 3 }}>💡 Memory Hint</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{word.ai_hint}</div>
                    </div>
                  )}
                  {word.ai_uzbek_explanation && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--emerald-light)', fontWeight: 600, marginBottom: 3 }}>🇺🇿 Uzbek Explanation</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>{word.ai_uzbek_explanation}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddWordForm({ onAdd }) {
  const [form, setForm] = useState({ english: '', uzbek: '', example_sentence: '', difficulty: 'medium' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.english.trim() || !form.uzbek.trim()) { toast.error('English and Uzbek are required'); return; }
    setLoading(true);
    try {
      const res = await wordsAPI.create(form);
      onAdd(res.data);
      setForm({ english: '', uzbek: '', example_sentence: '', difficulty: 'medium' });
      setOpen(false);
      toast.success('Word added! AI content generating... ✨');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add word');
    } finally { setLoading(false); }
  };

  if (!open) return (
    <button className="btn btn-primary" onClick={() => setOpen(true)} style={{ alignSelf: 'flex-start' }}>
      <Plus size={16} /> Add New Word
    </button>
  );

  return (
    <div className="card card-glow animate-slide" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700 }}>Add New Word</h3>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)}><X size={16} /></button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="grid-2">
          <div>
            <label className="label">English Word *</label>
            <input className="input" placeholder="e.g. Perseverance" value={form.english}
              onChange={e => setForm(p => ({ ...p, english: e.target.value }))} required autoFocus />
          </div>
          <div>
            <label className="label">Uzbek Translation *</label>
            <input className="input" placeholder="e.g. Qat'iyat" value={form.uzbek}
              onChange={e => setForm(p => ({ ...p, uzbek: e.target.value }))} required />
          </div>
        </div>
        <div>
          <label className="label">Example Sentence</label>
          <textarea className="textarea" placeholder="Her perseverance paid off after years of hard work." value={form.example_sentence}
            onChange={e => setForm(p => ({ ...p, example_sentence: e.target.value }))} style={{ minHeight: 60 }} />
        </div>
        <div>
          <label className="label">Difficulty</label>
          <select className="select" value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Plus size={15} /> Add Word</>}
          </button>
          <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Brain size={12} style={{ color: 'var(--violet-light)' }} />
            AI content will be generated automatically
          </div>
        </div>
      </form>
    </div>
  );
}

export default function VocabularyPage() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filter !== 'all') params.difficulty = filter;
      const res = await wordsAPI.list(params);
      setWords(res.data);
    } finally { setLoading(false); }
  }, [search, filter]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  const handleAdd = (word) => setWords(p => [word, ...p]);
  const handleDelete = (id) => setWords(p => p.filter(w => w.id !== id));
  const handleUpdate = (updated) => setWords(p => p.map(w => w.id === updated.id ? updated : w));

  const stats = {
    total: words.length,
    learned: words.filter(w => w.is_learned).length,
    weak: words.filter(w => w.mastery_score < 0.3 && w.review_count > 0).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>My Vocabulary</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Build and manage your personal word collection</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { label: `${stats.total} Total`, color: 'var(--violet)' },
          { label: `${stats.learned} Learned`, color: 'var(--emerald)' },
          { label: `${stats.weak} Weak`, color: 'var(--rose)' },
        ].map(({ label, color }) => (
          <span key={label} style={{
            padding: '6px 14px', borderRadius: 100, background: `${color}15`,
            color, fontWeight: 600, fontSize: 13, border: `1px solid ${color}30`,
          }}>{label}</span>
        ))}
      </div>

      <AddWordForm onAdd={handleAdd} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input className="input" placeholder="Search words..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'easy', 'medium', 'hard'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Words list */}
      {loading ? (
        <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
      ) : words.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{search ? 'No words match your search' : 'No words yet'}</h3>
          <p style={{ fontSize: 14 }}>{search ? 'Try a different search term' : 'Add your first word to get started!'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {words.map(word => (
            <WordCard key={word.id} word={word} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
