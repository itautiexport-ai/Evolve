import React, { useState } from 'react';
import type { Goal, JournalEntry } from '../types/goal';
import { X, BookOpen, Plus, Calendar } from 'lucide-react';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onAddJournalEntry: (goalId: string, entry: Omit<JournalEntry, 'id'>) => void;
}

const MOODS = [
  '🔥 Empowered',
  '🎯 Focused',
  '🌱 Growing',
  '🏆 Proud',
  '⚡ Energized'
] as const;

export const JournalModal: React.FC<JournalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onAddJournalEntry,
}) => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<typeof MOODS[number]>('🎯 Focused');

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAddJournalEntry(goal.id, {
      date: new Date().toISOString().split('T')[0],
      content: content.trim(),
      mood,
    });

    setContent('');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-card large-modal animate-fade-in">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <BookOpen className="text-accent" size={22} />
            <div>
              <h2>Reflection Journal</h2>
              <p className="subtext">{goal.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="icon-btn close-modal-btn">
            <X size={20} />
          </button>
        </div>

        <div className="journal-body">
          {/* New Entry Form */}
          <form onSubmit={handleSubmit} className="journal-form glass-card">
            <h4>Write Reflection Log</h4>
            <div className="form-group mt-2">
              <textarea
                rows={3}
                placeholder="What progress did you make today? How are you feeling about this goal?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="form-textarea"
                required
              />
            </div>

            <div className="journal-form-actions mt-2">
              <div className="mood-selector">
                <span className="text-sm font-medium">Mood Tag:</span>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value as any)}
                  className="form-select inline-select"
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                <Plus size={16} /> Add Reflection Entry
              </button>
            </div>
          </form>

          {/* Past Entries List */}
          <div className="journal-history mt-4">
            <h4>Past Reflection Entries ({goal.journalEntries?.length || 0})</h4>
            {(!goal.journalEntries || goal.journalEntries.length === 0) ? (
              <div className="empty-journal text-center py-6">
                <p>No journal entries yet. Capture your breakthrough moments above!</p>
              </div>
            ) : (
              <div className="journal-entries-list">
                {goal.journalEntries.slice().reverse().map((entry) => (
                  <div key={entry.id} className="journal-entry-card glass-card">
                    <div className="entry-header">
                      <span className="entry-date">
                        <Calendar size={14} /> {entry.date}
                      </span>
                      <span className="mood-badge">{entry.mood}</span>
                    </div>
                    <p className="entry-content">{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
