import React, { useState } from 'react';
import type { MasterItem, Goal } from '../types/goal';
import { 
  Sparkles, 
  Award, 
  Flame, 
  ArrowRight, 
  BookOpen, 
  Activity, 
  CheckCircle2, 
  Plus, 
  Smile
} from 'lucide-react';

interface HomePageProps {
  masters: MasterItem[];
  goals: Goal[];
  setActiveTab: (tab: 'home' | 'masters' | 'goals' | 'analytics' | 'admin') => void;
  onOpenNewGoalModal: () => void;
  onOpenNewMasterModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  masters,
  goals,
  setActiveTab,
  onOpenNewGoalModal,
  onOpenNewMasterModal,
}) => {
  const [dailyReflection, setDailyReflection] = useState('');
  const [isReflectedToday, setIsReflectedToday] = useState(false);

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const avgMasteryProgress = masters.length > 0
    ? Math.round(masters.reduce((acc, m) => acc + m.progress, 0) / masters.length)
    : 0;

  const handleDailyReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dailyReflection.trim()) {
      setIsReflectedToday(true);
    }
  };

  return (
    <div className="evolve-home-container">
      {/* Hero Welcome Banner */}
      <div className="evolve-hero-banner glass-card p-6 mb-6">
        <div className="hero-content">
          <div className="flex items-center gap-2 mb-2">
            <span className="pill-badge-pink flex items-center gap-1 text-xs">
              <Sparkles size={12} /> Personal Growth Hub
            </span>
            <span className="pill-badge-green text-xs font-semibold">100% Pastel Ecosystem</span>
          </div>

          <h1 className="hero-title text-main">
            Evolve <span className="title-accent-gradient">— About becoming a better version of yourself.</span>
          </h1>

          <p className="hero-subtitle">
            Track your life pillars, elevate your skills, build non-negotiable habits, and unlock your true potential every single day.
          </p>

          <div className="hero-action-buttons mt-4">
            <button onClick={() => setActiveTab('masters')} className="btn btn-primary-pastel flex items-center gap-2">
              <Award size={18} />
              <span>Explore Masters Module</span>
              <ArrowRight size={16} />
            </button>
            <button onClick={onOpenNewGoalModal} className="btn btn-secondary-pastel flex items-center gap-2">
              <Plus size={18} />
              <span>Set New Evolution Target</span>
            </button>
          </div>
        </div>

        <div className="hero-badge-decoration">
          <div className="decor-circle pink" />
          <div className="decor-circle green" />
          <div className="decor-circle yellow" />
        </div>
      </div>

      {/* 3 Pastel Pillar Cards */}
      <div className="pillars-trio-grid mb-6">
        {/* Pastel Green Pillar */}
        <div className="pillar-card pastel-green-card glass-card">
          <div className="pillar-header">
            <div className="pillar-icon-wrap green">
              <Activity size={22} />
            </div>
            <span className="pillar-tag green">Vitality & Health</span>
          </div>
          <h3 className="pillar-title">Physical Energy Mastery</h3>
          <p className="pillar-desc">
            Nurture your body through movement, clean fuel, and daily rest to maintain peak vitality.
          </p>
          <div className="pillar-stat mt-3">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Energy Index</span>
              <span>85%</span>
            </div>
            <div className="cat-progress-bg">
              <div className="cat-progress-fill bg-green-pastel" style={{ width: '85%' }} />
            </div>
          </div>
        </div>

        {/* Pastel Yellow Pillar */}
        <div className="pillar-card pastel-yellow-card glass-card">
          <div className="pillar-header">
            <div className="pillar-icon-wrap yellow">
              <BookOpen size={22} />
            </div>
            <span className="pillar-tag yellow">Skills & Knowledge</span>
          </div>
          <h3 className="pillar-title">Intellectual Excellence</h3>
          <p className="pillar-desc">
            Continuously master new skills, build real projects, and sharpen your mental clarity.
          </p>
          <div className="pillar-stat mt-3">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Mastery Progress</span>
              <span>{avgMasteryProgress}%</span>
            </div>
            <div className="cat-progress-bg">
              <div className="cat-progress-fill bg-yellow-pastel" style={{ width: `${avgMasteryProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Pastel Pink Pillar */}
        <div className="pillar-card pastel-pink-card glass-card">
          <div className="pillar-header">
            <div className="pillar-icon-wrap pink">
              <Smile size={22} />
            </div>
            <span className="pillar-tag pink">Mindset & Resilience</span>
          </div>
          <h3 className="pillar-title">Emotional Strength</h3>
          <p className="pillar-desc">
            Cultivate stoic calm, practice daily gratitude, and build unwavering mental toughness.
          </p>
          <div className="pillar-stat mt-3">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Mindset Alignment</span>
              <span>90%</span>
            </div>
            <div className="cat-progress-bg">
              <div className="cat-progress-fill bg-pink-pastel" style={{ width: '90%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Home Content Grid */}
      <div className="home-dashboard-grid">
        {/* Masters Module Quick Preview Card */}
        <div className="glass-card p-5 span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="text-pink-600" size={24} />
              <div>
                <h3 className="font-bold text-main text-lg">Active Life Masters</h3>
                <p className="text-xs text-secondary">Your core pillars of personal evolution</p>
              </div>
            </div>
            <button onClick={() => setActiveTab('masters')} className="btn btn-secondary-pastel btn-sm">
              View All ({masters.length})
            </button>
          </div>

          <div className="masters-mini-list">
            {masters.slice(0, 4).map(master => (
              <div key={master.id} className={`master-mini-item theme-${master.colorTheme}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`master-level-badge level-${master.level.toLowerCase()}`}>
                      {master.level}
                    </span>
                    <h4 className="font-bold text-main mt-1 text-sm">{master.title}</h4>
                    <span className="text-xs text-secondary">{master.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-accent text-sm">{master.progress}%</span>
                    <div className="cat-progress-bg w-24 mt-1">
                      <div className={`cat-progress-fill bg-${master.colorTheme}-pastel`} style={{ width: `${master.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={onOpenNewMasterModal} className="btn btn-primary-pastel w-full mt-4 flex items-center justify-center gap-2">
            <Plus size={16} />
            <span>Add New Master Pillar</span>
          </button>
        </div>

        {/* Daily Evolution Habit & Mindset Check-in */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={22} className="text-amber-500" />
            <h3 className="font-bold text-main text-base">Daily Evolution Pulse</h3>
          </div>

          <div className="evolution-streak-box mb-4">
            <div className="streak-count">🔥 14 Days</div>
            <div className="streak-label">Unbroken Personal Evolution Streak</div>
          </div>

          {/* Daily Micro Reflection Form */}
          {!isReflectedToday ? (
            <form onSubmit={handleDailyReflectionSubmit} className="reflection-form">
              <label className="text-xs font-semibold text-secondary mb-1 block">
                Today's Core Commitment to Growth:
              </label>
              <textarea
                value={dailyReflection}
                onChange={(e) => setDailyReflection(e.target.value)}
                placeholder="What is one action you will take today to become a better version of yourself?"
                className="form-textarea text-xs mb-3"
                rows={3}
              />
              <button type="submit" className="btn btn-accent-pastel btn-sm w-full">
                Record Growth Commitment
              </button>
            </form>
          ) : (
            <div className="reflection-submitted-box">
              <CheckCircle2 size={20} className="text-emerald-600 mb-1" />
              <div className="text-xs font-bold text-emerald-800">Growth Commitment Recorded!</div>
              <p className="text-xs text-secondary mt-1 italic">"{dailyReflection}"</p>
            </div>
          )}

          {/* Quick Metrics Summary */}
          <div className="home-stats-mini-grid mt-4 pt-4 border-t border-purple-100">
            <div className="mini-stat-item">
              <span className="mini-stat-label">Active Goals</span>
              <span className="mini-stat-val">{goals.length}</span>
            </div>
            <div className="mini-stat-item">
              <span className="mini-stat-label">Achievements</span>
              <span className="mini-stat-val text-emerald-600">{completedGoals}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
