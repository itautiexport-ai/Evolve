import React from 'react';
import type { Goal } from '../types/goal';
import { Sparkles, Eye, CheckCircle } from 'lucide-react';

interface VisionBoardViewProps {
  goals: Goal[];
  onOpenJournal: (goal: Goal) => void;
}

export const VisionBoardView: React.FC<VisionBoardViewProps> = ({ goals, onOpenJournal }) => {
  return (
    <div className="vision-board-container">
      <div className="vision-board-header glass-card">
        <div className="vision-header-info">
          <Sparkles size={28} className="text-accent" />
          <div>
            <h2>Interactive Vision Canvas</h2>
            <p>Visualize your aspirations, embody your accomplishments, and stay focused on your ideal future.</p>
          </div>
        </div>
      </div>

      <div className="vision-grid">
        {goals.map((goal) => (
          <div key={goal.id} className="vision-card glass-card">
            <div className="vision-card-image-wrap">
              <img 
                src={goal.imageUrl || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'} 
                alt={goal.title}
                className="vision-card-image" 
              />
              <div className="vision-card-overlay" />
              <div className="vision-category-tag">{goal.category}</div>
              <div className="vision-progress-badge">{goal.progress}%</div>
            </div>

            <div className="vision-card-body">
              <h3 className="vision-card-title">{goal.title}</h3>
              <p className="vision-card-desc">{goal.description}</p>
              
              <div className="vision-card-meta">
                <span className="target-date-pill">
                  🎯 Target: {new Date(goal.targetDate).getFullYear()}
                </span>
                {goal.status === 'completed' && (
                  <span className="achieved-pill">
                    <CheckCircle size={14} /> Achieved!
                  </span>
                )}
              </div>

              <div className="vision-card-actions">
                <button 
                  className="btn btn-secondary w-full"
                  onClick={() => onOpenJournal(goal)}
                >
                  <Eye size={16} /> Reflect & Journal
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
