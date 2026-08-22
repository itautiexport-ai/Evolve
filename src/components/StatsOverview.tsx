import React from 'react';
import type { Goal } from '../types/goal';
import { Target, CheckCircle2, Flame, TrendingUp, Clock } from 'lucide-react';

interface StatsOverviewProps {
  goals: Goal[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ goals }) => {
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const inProgressGoals = goals.filter(g => g.status === 'in-progress').length;
  const notStartedGoals = goals.filter(g => g.status === 'not-started').length;

  const totalProgress = totalGoals > 0 
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / totalGoals) 
    : 0;

  return (
    <div className="stats-grid">
      <div className="stat-card glass-card">
        <div className="stat-icon-wrapper icon-blue">
          <Target size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Total Life Goals</span>
          <div className="stat-value-group">
            <span className="stat-number">{totalGoals}</span>
            <span className="stat-subtext">Active targets</span>
          </div>
        </div>
      </div>

      <div className="stat-card glass-card">
        <div className="stat-icon-wrapper icon-amber">
          <Clock size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">In Progress</span>
          <div className="stat-value-group">
            <span className="stat-number">{inProgressGoals}</span>
            <span className="stat-subtext">{notStartedGoals} pending</span>
          </div>
        </div>
      </div>

      <div className="stat-card glass-card">
        <div className="stat-icon-wrapper icon-emerald">
          <CheckCircle2 size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Goals Accomplished</span>
          <div className="stat-value-group">
            <span className="stat-number">{completedGoals}</span>
            <span className="stat-subtext">
              {totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0}% success rate
            </span>
          </div>
        </div>
      </div>

      <div className="stat-card glass-card">
        <div className="stat-icon-wrapper icon-purple">
          <TrendingUp size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Overall Completion</span>
          <div className="stat-value-group">
            <span className="stat-number">{totalProgress}%</span>
            <div className="stat-mini-bar-bg">
              <div 
                className="stat-mini-bar-fill" 
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card glass-card highlight-card">
        <div className="stat-icon-wrapper icon-orange">
          <Flame size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-label">Momentum Streak</span>
          <div className="stat-value-group">
            <span className="stat-number">14 Days</span>
            <span className="stat-subtext font-glow">🔥 Peak focus</span>
          </div>
        </div>
      </div>
    </div>
  );
};
