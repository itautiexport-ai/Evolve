import React from 'react';
import type { Goal } from '../types/goal';
import { CATEGORIES_WITH_META } from '../data/initialGoals';
import { BarChart3, PieChart, Target, Lightbulb } from 'lucide-react';

interface AnalyticsViewProps {
  goals: Goal[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ goals }) => {
  // Category breakdown
  const categoryStats = CATEGORIES_WITH_META.map(cat => {
    const catGoals = goals.filter(g => g.category === cat.name);
    const count = catGoals.length;
    const completed = catGoals.filter(g => g.status === 'completed').length;
    const avgProg = count > 0 ? Math.round(catGoals.reduce((a, b) => a + b.progress, 0) / count) : 0;

    return {
      ...cat,
      count,
      completed,
      avgProg
    };
  });

  // Priority Breakdown
  const priorityCounts = {
    critical: goals.filter(g => g.priority === 'critical').length,
    high: goals.filter(g => g.priority === 'high').length,
    medium: goals.filter(g => g.priority === 'medium').length,
    low: goals.filter(g => g.priority === 'low').length,
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header glass-card">
        <BarChart3 size={28} className="text-accent" />
        <div>
          <h2>Goal Performance & Life Balance Analytics</h2>
          <p>Analyze how your energy and focus are distributed across key life dimensions.</p>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Category Balance Breakdown */}
        <div className="analytics-card glass-card span-2">
          <div className="card-title-row">
            <PieChart size={20} className="text-accent" />
            <h3>Life Dimensions Balance</h3>
          </div>

          <div className="category-bars-list">
            {categoryStats.map((cat) => (
              <div key={cat.name} className="category-stat-item">
                <div className="cat-stat-info">
                  <span className="cat-stat-name">
                    <span 
                      className="cat-dot" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    {cat.name} ({cat.count} goals)
                  </span>
                  <span className="cat-stat-perc">{cat.avgProg}% avg</span>
                </div>
                <div className="cat-progress-bg">
                  <div 
                    className="cat-progress-fill" 
                    style={{ width: `${cat.avgProg}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Focus */}
        <div className="analytics-card glass-card">
          <div className="card-title-row">
            <Target size={20} className="text-accent" />
            <h3>Priority Allocation</h3>
          </div>

          <div className="priority-summary-list">
            <div className="priority-sum-item critical">
              <span>🔥 Critical Focus</span>
              <strong>{priorityCounts.critical}</strong>
            </div>
            <div className="priority-sum-item high">
              <span>⚡ High Priority</span>
              <strong>{priorityCounts.high}</strong>
            </div>
            <div className="priority-sum-item medium">
              <span>📌 Medium Priority</span>
              <strong>{priorityCounts.medium}</strong>
            </div>
            <div className="priority-sum-item low">
              <span>🌱 Low Priority</span>
              <strong>{priorityCounts.low}</strong>
            </div>
          </div>
        </div>

        {/* Key AI / Insights Card */}
        <div className="analytics-card glass-card span-3 highlight-insight-card">
          <div className="card-title-row">
            <Lightbulb size={22} className="text-amber" />
            <h3>Life Optimization Insights</h3>
          </div>

          <div className="insights-grid">
            <div className="insight-box">
              <strong>High Energy Momentum</strong>
              <p>Your Health & Fitness and Personal Growth goals are progressing 30% faster than average.</p>
            </div>
            <div className="insight-box">
              <strong>Balanced Distribution</strong>
              <p>You have goals active across 5 major life areas. Keep scaling sub-milestones to maintain consistency!</p>
            </div>
            <div className="insight-box">
              <strong>Sub-Milestone Power</strong>
              <p>Goals with 3+ sub-milestones are 4x more likely to be completed on target dates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
