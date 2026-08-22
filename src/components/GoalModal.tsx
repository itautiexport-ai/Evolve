import React, { useState, useEffect } from 'react';
import type { Goal, Category, Priority } from '../types/goal';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<Goal>) => void;
  initialGoal?: Goal | null;
}

const PRESET_IMAGES = [
  { label: 'Finance', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80' },
  { label: 'Endurance', url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Books & Learning', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80' },
  { label: 'Technology', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80' },
  { label: 'Travel', url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Mountain Summit', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' }
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Personal Growth');
  const [priority, setPriority] = useState<Priority>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [progress, setProgress] = useState(0);
  const [targetValue, setTargetValue] = useState<string>('');
  const [currentValue, setCurrentValue] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [milestones, setMilestones] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setDescription(initialGoal.description);
      setCategory(initialGoal.category);
      setPriority(initialGoal.priority);
      setTargetDate(initialGoal.targetDate);
      setProgress(initialGoal.progress);
      setTargetValue(initialGoal.targetValue?.toString() || '');
      setCurrentValue(initialGoal.currentValue?.toString() || '');
      setUnit(initialGoal.unit || '');
      setImageUrl(initialGoal.imageUrl || '');
      setTags(initialGoal.tags ? initialGoal.tags.join(', ') : '');
      setMilestones(initialGoal.milestones || []);
    } else {
      // Defaults for new goal
      setTitle('');
      setDescription('');
      setCategory('Personal Growth');
      setPriority('medium');
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 3);
      setTargetDate(defaultDate.toISOString().split('T')[0]);
      setProgress(0);
      setTargetValue('');
      setCurrentValue('');
      setUnit('');
      setImageUrl('');
      setTags('');
      setMilestones([]);
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones([
      ...milestones,
      { id: 'm-' + Date.now(), title: newMilestoneText.trim(), completed: false }
    ]);
    setNewMilestoneText('');
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onSave({
      ...(initialGoal ? { id: initialGoal.id } : {}),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      targetDate,
      progress,
      targetValue: targetValue ? parseFloat(targetValue) : undefined,
      currentValue: currentValue ? parseFloat(currentValue) : undefined,
      unit: unit.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      tags: parsedTags,
      milestones,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content glass-card large-modal animate-fade-in">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Sparkles className="text-accent" size={20} />
            <h2>{initialGoal ? 'Edit Life Goal' : 'Create New Life Goal'}</h2>
          </div>
          <button onClick={onClose} className="icon-btn close-modal-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Save $50,000 for Real Estate Deposit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Core Purpose</label>
            <textarea
              rows={3}
              placeholder="Why is this life goal important to you? What will change once achieved?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">Life Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="form-select"
              >
                <option value="Career & Work">Career & Work</option>
                <option value="Health & Fitness">Health & Fitness</option>
                <option value="Financial Freedom">Financial Freedom</option>
                <option value="Personal Growth">Personal Growth</option>
                <option value="Travel & Adventure">Travel & Adventure</option>
                <option value="Relationships & Family">Relationships & Family</option>
                <option value="Mindfulness & Wellbeing">Mindfulness & Wellbeing</option>
              </select>
            </div>

            <div className="form-group half-width">
              <label className="form-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="form-select"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Focus 🔥</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label className="form-label">Target Completion Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group half-width">
              <label className="form-label">Current Progress ({progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                className="form-range"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group third-width">
              <label className="form-label">Current Value (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 15"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group third-width">
              <label className="form-label">Target Value</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group third-width">
              <label className="form-label">Unit of Measure</label>
              <input
                type="text"
                placeholder="e.g. $, km, books"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Sub-Milestones Builder */}
          <div className="form-group">
            <label className="form-label">Sub-Milestones & Action Steps</label>
            <div className="milestone-builder-input">
              <input
                type="text"
                placeholder="Add actionable sub-step (e.g. Complete chapter 1)"
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
                className="form-input"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="btn btn-secondary"
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {milestones.length > 0 && (
              <div className="milestones-builder-list">
                {milestones.map((m) => (
                  <div key={m.id} className="milestone-builder-item">
                    <span>{m.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(m.id)}
                      className="icon-btn danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cover Image & Presets */}
          <div className="form-group">
            <label className="form-label">Cover Image URL (or select preset)</label>
            <div className="preset-images-row">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`preset-img-btn ${imageUrl === preset.url ? 'selected' : ''}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="form-input mt-2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Wealth, Independence, Habit"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {initialGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
