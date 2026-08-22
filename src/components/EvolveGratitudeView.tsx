import React, { useState, useEffect } from 'react';
import type { User } from '../types/goal';
import { Heart, Sparkles, Trash2, Calendar, Send, Sun } from 'lucide-react';

interface EvolveGratitudeViewProps {
  currentUser: User;
}

interface GratitudeEntry {
  id: string;
  userId: string;
  content: string;
  category: string;
  vibe: string;
  date: string;
}

const GRATITUDE_STORAGE = 'evolve_gratitude_entries';

const CATEGORIES = [
  'General',
  'Family & Friends',
  'Health & Body',
  'Work & Productivity',
  'Nature & Environment',
  'Self-Growth'
];

const VIBES = [
  { emoji: '😊', label: 'Happy', color: '#f59e0b' },
  { emoji: '😌', label: 'Peaceful', color: '#06b6d4' },
  { emoji: '🙏', label: 'Grateful', color: '#ec4899' },
  { emoji: '⚡', label: 'Excited', color: '#8b5cf6' },
  { emoji: '❤️', label: 'Loved', color: '#ef4444' }
];

export const EvolveGratitudeView: React.FC<EvolveGratitudeViewProps> = ({ currentUser }) => {
  const [entries, setEntries] = useState<GratitudeEntry[]>(() => {
    const saved = localStorage.getItem(GRATITUDE_STORAGE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'journal' | 'list'>('journal');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [vibe, setVibe] = useState(VIBES[2].emoji);
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem(GRATITUDE_STORAGE, JSON.stringify(entries));
  }, [entries]);

  const userEntries = entries.filter(e => e.userId === currentUser.id);
  const filteredEntries = userEntries;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    const newEntry: GratitudeEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      content: content.trim(),
      category,
      vibe,
      date: new Date().toISOString().split('T')[0]
    };

    setTimeout(() => {
      setEntries(prev => [newEntry, ...prev]);
      setContent('');
      setCategory(CATEGORIES[0]);
      setVibe(VIBES[2].emoji);
      setIsSubmitting(false);
      setSuccessMsg('Your reflection has been saved 🌟');
      setTimeout(() => setSuccessMsg(''), 3000);
      // Auto switch to list tab to see new entry
      setTimeout(() => setActiveTab('list'), 800);
    }, 400);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to delete this gratitude entry?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="gj-container animate-fade-in" style={{ padding: '24px' }}>
      {/* Hero Banner */}
      <div className="gj-hero" style={{ marginBottom: '20px' }}>
        <div className="gj-hero-glow"></div>
        <div className="gj-hero-content">
          <div className="gj-hero-icon">
            <Sun size={28} />
          </div>
          <div className="gj-hero-text">
            <h1 className="gj-hero-title">My Gratitude Journal</h1>
            <p className="gj-hero-subtitle">
              {dateStr}
            </p>
            <p className="gj-hero-quote">
              "Gratitude turns what we have into enough."
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Menu Bar */}
      <div className="gj-vibes" style={{ gap: '10px', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
        <button
          onClick={() => setActiveTab('journal')}
          className={`gj-vibe-pill ${activeTab === 'journal' ? 'active' : ''}`}
          style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}
        >
          ✍️ My Gratitude Journal
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`gj-vibe-pill ${activeTab === 'list' ? 'active' : ''}`}
          style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}
        >
          📜 Gratitude List ({filteredEntries.length})
        </button>
      </div>

      {/* Main Content Switcher */}
      <div className="gj-grid-centered" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        {activeTab === 'journal' ? (
          /* Form Card Tab */
          <div className="gj-form-panel" style={{ width: '100%', maxWidth: '640px' }}>
            <div className="gj-form-card">
              {/* Success Toast */}
              {successMsg && (
                <div className="gj-success-toast">
                  <Sparkles size={14} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="gj-form-header">
                <div className="gj-form-header-icon">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="gj-form-title">Capture Your Joy</h2>
                  <p className="gj-form-subtitle">What made you smile today?</p>
                </div>
              </div>

              <form onSubmit={handleAddEntry} className="gj-form">
                <div className="gj-form-group">
                  <textarea
                    placeholder="Today I am grateful for..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    className="gj-textarea"
                    rows={4}
                    required
                  />
                </div>

                <div className="gj-form-group">
                  <label className="gj-label">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="gj-select"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="gj-form-group">
                  <label className="gj-label">How are you feeling?</label>
                  <div className="gj-vibes">
                    {VIBES.map(v => (
                      <button
                        key={v.emoji}
                        type="button"
                        onClick={() => setVibe(v.emoji)}
                        className={`gj-vibe-pill ${vibe === v.emoji ? 'active' : ''}`}
                        style={vibe === v.emoji ? { borderColor: v.color, background: `${v.color}12` } : {}}
                      >
                        <span className="gj-vibe-emoji">{v.emoji}</span>
                        <span className="gj-vibe-text" style={vibe === v.emoji ? { color: v.color } : {}}>{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`gj-submit-btn ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Heart size={16} className="gj-pulse" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Save Reflection</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Reflections Listing Tab */
          <div className="gj-timeline-panel" style={{ width: '100%', maxWidth: '800px' }}>
            {filteredEntries.length === 0 ? (
              <div className="gj-timeline-card text-center" style={{ padding: '60px 24px' }}>
                <Heart size={48} style={{ color: '#ec4899', margin: '0 auto 12px', opacity: 0.7 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>No reflections recorded</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  Write down what you're thankful for in the journal tab to view it here!
                </p>
                <button
                  onClick={() => setActiveTab('journal')}
                  className="gj-submit-btn mt-4"
                  style={{ width: 'auto', display: 'inline-flex', padding: '10px 20px', fontSize: '0.82rem' }}
                >
                  Add Your First Gratitude
                </button>
              </div>
            ) : (
              <div className="gj-timeline-card">
                <div className="gj-timeline-header">
                  <div className="gj-timeline-header-icon">
                    <Calendar size={16} />
                  </div>
                  <h2 className="gj-timeline-title">Your Reflections</h2>
                  <span className="gj-entry-count">{filteredEntries.length}</span>
                </div>

                <div className="gj-timeline-list" style={{ maxHeight: '600px' }}>
                  {filteredEntries.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className="gj-entry"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="gj-entry-left-accent"></div>
                      <div className="gj-entry-body">
                        <div className="gj-entry-top">
                          <span className="gj-entry-vibe">{entry.vibe}</span>
                          <span className="gj-entry-date">{entry.date}</span>
                          <span className="gj-entry-badge">{entry.category}</span>
                        </div>
                        <p className="gj-entry-text">{entry.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="gj-entry-delete"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
