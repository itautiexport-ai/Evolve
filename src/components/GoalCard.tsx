import React, { useState } from 'react';
import type { Goal } from '../types/goal';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  Pin, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onUpdateProgress: (goalId: string, newProgress: number) => void;
  onOpenJournal: (goal: Goal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleMilestone,
  onOpenJournal,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const completedMilestones = goal.milestones.filter(m => m.completed).length;
  const totalMilestones = goal.milestones.length;

  const handleMilestoneClick = (milestoneId: string, currentCompleted: boolean) => {
    onToggleMilestone(goal.id, milestoneId);
    if (!currentCompleted && completedMilestones + 1 === totalMilestones && totalMilestones > 0) {
      // Trigger celebration confetti when all milestones completed!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const priorityColor = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  }[goal.priority];

  const categoryColor = {
    'Financial Freedom': 'cat-emerald',
    'Career & Work': 'cat-blue',
    'Health & Fitness': 'cat-red',
    'Personal Growth': 'cat-purple',
    'Travel & Adventure': 'cat-amber',
    'Relationships & Family': 'cat-pink',
    'Mindfulness & Wellbeing': 'cat-cyan',
  }[goal.category] || 'cat-blue';

  const daysLeft = Math.ceil(
    (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

  return (
    <div 
      className={`goal-card glass-card ${goal.isPinned ? 'pinned' : ''} ${goal.status === 'completed' ? 'completed-card' : ''}`}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Banner / Cover Image */}
      {goal.imageUrl ? (
        <div className="card-cover">
          <img src={goal.imageUrl} alt={goal.title} loading="lazy" />
          <div className="card-cover-overlay" />
        </div>
      ) : (
        <div className={`card-cover-gradient ${categoryColor}`} />
      )}

      {/* Top Header info */}
      <div className="card-header">
        <div className="card-header-meta">
          <span className={`category-tag ${categoryColor}`}>
            {goal.category}
          </span>
          <span className={`priority-tag ${priorityColor}`}>
            {goal.priority.toUpperCase()}
          </span>
        </div>

        <div className="card-actions">
          <button 
            className={`pin-btn ${goal.isPinned ? 'active' : ''}`}
            onClick={() => onTogglePin(goal.id)}
            title={goal.isPinned ? "Unpin Goal" : "Pin to top"}
          >
            <Pin size={16} />
          </button>

          <div className="menu-container">
            <button 
              className="icon-btn" 
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="dropdown-menu glass-card">
                <button onClick={() => { setShowMenu(false); onEdit(goal); }}>
                  <Edit3 size={14} /> Edit Goal
                </button>
                <button onClick={() => { setShowMenu(false); onOpenJournal(goal); }}>
                  <BookOpen size={14} /> Journal Log ({goal.journalEntries?.length || 0})
                </button>
                <button 
                  className="danger-text" 
                  onClick={() => { setShowMenu(false); onDelete(goal.id); }}
                >
                  <Trash2 size={14} /> Delete Goal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="card-body">
        <h3 className="goal-title">{goal.title}</h3>
        <p className="goal-description">{goal.description}</p>

        {/* Progress Bar & Numeric Target */}
        <div className="progress-section">
          <div className="progress-label-row">
            <span className="progress-text font-accent">
              <TrendingUp size={14} className="inline-icon" /> Progress
            </span>
            <span className="progress-percentage">{goal.progress}%</span>
          </div>

          <div className="progress-bar-container">
            <div 
              className={`progress-bar-fill ${goal.progress === 100 ? 'bar-complete' : ''}`}
              style={{ width: `${goal.progress}%` }}
            />
          </div>

          {goal.targetValue !== undefined && (
            <div className="numeric-target-pill">
              <span>Current: <strong>{goal.currentValue || 0}</strong> {goal.unit}</span>
              <span>Target: <strong>{goal.targetValue}</strong> {goal.unit}</span>
            </div>
          )}
        </div>

        {/* Milestones Checklist */}
        {goal.milestones.length > 0 && (
          <div className="milestones-section">
            <div className="milestones-header">
              <span>Sub-Milestones ({completedMilestones}/{totalMilestones})</span>
            </div>
            <div className="milestones-list">
              {goal.milestones.map((m) => (
                <div 
                  key={m.id} 
                  className={`milestone-item ${m.completed ? 'completed' : ''}`}
                  onClick={() => handleMilestoneClick(m.id, m.completed)}
                >
                  {m.completed ? (
                    <CheckSquare size={16} className="milestone-icon checked" />
                  ) : (
                    <Square size={16} className="milestone-icon unchecked" />
                  )}
                  <span className="milestone-text">{m.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="tags-row">
            {goal.tags.map((tag, idx) => (
              <span key={idx} className="tag-pill">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="card-footer">
        <div className="target-date">
          <Calendar size={14} />
          <span>
            {daysLeft < 0 ? (
              <span className="overdue-text">Overdue by {Math.abs(daysLeft)} days</span>
            ) : daysLeft === 0 ? (
              <span className="today-text">Due Today!</span>
            ) : (
              <span>Target: {new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ({daysLeft}d left)</span>
            )}
          </span>
        </div>

        <button 
          className="journal-badge-btn"
          onClick={() => onOpenJournal(goal)}
          title="Open Reflection Journal"
        >
          <BookOpen size={14} />
          <span>Journal</span>
        </button>
      </div>
    </div>
  );
};
