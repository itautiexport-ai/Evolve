import React from 'react';
import { Target, Sparkles, ArrowRight, Flame, CheckCircle2, Award } from 'lucide-react';
import type { Goal } from '../types/goal';

interface MyGoalsHomeViewProps {
  goals: Goal[];
  setActiveNav: (nav: string) => void;
}

export const MyGoalsHomeView: React.FC<MyGoalsHomeViewProps> = ({ goals, setActiveNav }) => {
  // Quick stats calculations
  const totalGoalsCount = goals.length;
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const activeCount = totalGoalsCount - completedCount;
  const completionRate = totalGoalsCount > 0 ? Math.round((completedCount / totalGoalsCount) * 100) : 0;

  const subModules = [
    {
      id: 'goals-planner',
      title: 'My Goal Planner',
      description: 'Plan, track, and manage your short and long-term goals. View metrics, filter by category, check milestones, and update your progress.',
      icon: <Target size={32} className="text-emerald-600" />,
      colorClass: 'green-pastel-theme'
    },
    {
      id: 'goals-vision',
      title: 'Vision Board',
      description: 'Visualize your dreams and aspirations on an interactive canvas. Upload images, set target dates, reflect on your accomplishments, and stay aligned with your path.',
      icon: <Sparkles size={32} className="text-blue-600" />,
      colorClass: 'blue-pastel-theme'
    }
  ];

  return (
    <div className="masters-landing-container animate-fade-in" style={{ padding: '24px' }}>
      {/* Welcome Banner */}
      <div className="gj-hero mb-6" style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)' }}>
        <div className="gj-hero-glow" style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)' }} />
        <div className="gj-hero-content">
          <div className="gj-hero-icon" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', boxShadow: '0 6px 20px rgba(2, 132, 199, 0.3)' }}>
            <Target size={24} />
          </div>
          <div>
            <h1 className="gj-hero-title">My Evolution Goals</h1>
            <p className="gj-hero-subtitle" style={{ color: '#0369a1' }}>
              Set, track, and manifest your non-negotiable targets across all life pillars.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="pillars-trio-grid mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="pillar-card pastel-green-card glass-card" style={{ padding: '16px' }}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-emerald-600" />
            <span className="font-bold text-xs" style={{ color: '#047857' }}>Total Targets</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{totalGoalsCount}</h2>
        </div>

        <div className="pillar-card pastel-yellow-card glass-card" style={{ padding: '16px' }}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={18} className="text-amber-600" />
            <span className="font-bold text-xs" style={{ color: '#b45309' }}>Active Focus</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{activeCount}</h2>
        </div>

        <div className="pillar-card pastel-pink-card glass-card" style={{ padding: '16px' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-pink-600" />
            <span className="font-bold text-xs" style={{ color: '#be185d' }}>Completed</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{completedCount}</h2>
        </div>

        <div className="pillar-card glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bcf0da' }}>
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-emerald-700" />
            <span className="font-bold text-xs" style={{ color: '#15803d' }}>Success Rate</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#15803d' }}>{completionRate}%</h2>
        </div>
      </div>

      {/* Sub-modules Navigation Grid */}
      <div className="sub-modules-grid">
        {subModules.map((sub) => (
          <div
            key={sub.id}
            onClick={() => setActiveNav(sub.id)}
            className={`sub-module-card ${sub.colorClass}`}
          >
            <div className="sub-module-card-icon-box">
              {sub.icon}
            </div>
            <div className="sub-module-card-body">
              <h2 className="sub-module-card-title">{sub.title}</h2>
              <p className="sub-module-card-desc">{sub.description}</p>
              <div className="sub-module-card-link">
                <span>Configure Sub-module</span>
                <ArrowRight size={16} className="arrow-icon" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
