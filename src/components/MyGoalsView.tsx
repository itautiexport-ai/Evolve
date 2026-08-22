import React, { useState } from 'react';
import type { Goal, Category, Status, Priority } from '../types/goal';
import { 
  Target, Plus, Edit3, Trash2, Calendar, Award, Flame, CheckCircle2, 
  Search, ListFilter, Save, X, BookOpen
} from 'lucide-react';

interface MyGoalsViewProps {
  goals: Goal[];
  onSaveGoal: (goal: Partial<Goal>) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateStatus: (goalId: string, newStatus: Goal['status']) => void;
  onOpenJournal: (goal: Goal) => void;
}

const CATEGORIES: Category[] = [
  'Career & Work',
  'Health & Fitness',
  'Financial Freedom',
  'Personal Growth',
  'Travel & Adventure',
  'Relationships & Family',
  'Mindfulness & Wellbeing'
];

const STATUSES: { value: Status; label: string; emoji: string }[] = [
  { value: 'not-started', label: 'Not Started', emoji: '⚪' },
  { value: 'in-progress', label: 'In Progress', emoji: '▶️' },
  { value: 'active', label: 'Active', emoji: '🔵' },
  { value: 'on-hold', label: 'On Hold', emoji: '⏸️' },
  { value: 'completed', label: 'Completed', emoji: '✅' }
];

export const MyGoalsView: React.FC<MyGoalsViewProps> = ({
  goals,
  onSaveGoal,
  onDeleteGoal,
  onUpdateStatus,
  onOpenJournal,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'form' | 'list'>('summary');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    category: 'Career & Work' as Category,
    priority: 'medium' as Priority,
    status: 'in-progress' as Status,
    targetDate: '',
    progress: 0,
    reward: '',
    purpose: '',
    successCriteria: '',
    requirements: '',
    challenges: '',
    milestones: Array.from({ length: 10 }, (_, i) => ({ id: `m-${i}-${Date.now()}`, title: '', completed: false })),
    imageUrl: '',
    unit: '',
    targetValue: '' as string | number,
    currentValue: '' as string | number,
  });

  // Search/Filter State for List Tab
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats calculation
  const totalGoalsCount = goals.length;
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const activeCount = goals.filter(g => g.status === 'in-progress' || g.status === 'active').length;
  const successRate = totalGoalsCount > 0 ? Math.round((completedCount / totalGoalsCount) * 100) : 0;
  const avgProgress = totalGoalsCount > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / totalGoalsCount) : 0;

  // Days left helper
  const calculateDaysLeft = (targetDateStr: string) => {
    if (!targetDateStr) return '';
    const diff = new Date(targetDateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  // Setup Form for Editing
  const startEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    const loadedMilestones = [...(goal.milestones || [])];
    // Fill up to 10 slots
    while (loadedMilestones.length < 10) {
      loadedMilestones.push({ id: `m-${loadedMilestones.length}-${Date.now()}`, title: '', completed: false });
    }
    setFormState({
      title: goal.title || '',
      description: goal.description || '',
      category: goal.category || 'Career & Work',
      priority: goal.priority || 'medium',
      status: goal.status || 'in-progress',
      targetDate: goal.targetDate || '',
      progress: goal.progress || 0,
      reward: goal.reward || '',
      purpose: goal.purpose || '',
      successCriteria: goal.successCriteria || '',
      requirements: goal.requirements || '',
      challenges: goal.challenges || '',
      milestones: loadedMilestones,
      imageUrl: goal.imageUrl || '',
      unit: goal.unit || '',
      targetValue: goal.targetValue !== undefined ? goal.targetValue : '',
      currentValue: goal.currentValue !== undefined ? goal.currentValue : '',
    });
    setActiveTab('form');
  };

  // Setup Form for Creating
  const startCreateGoal = () => {
    setEditingGoal(null);
    setFormState({
      title: '',
      description: '',
      category: 'Career & Work' as Category,
      priority: 'medium' as Priority,
      status: 'in-progress' as Status,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days default
      progress: 0,
      reward: '',
      purpose: '',
      successCriteria: '',
      requirements: '',
      challenges: '',
      milestones: Array.from({ length: 10 }, (_, i) => ({ id: `m-${i}-${Date.now()}`, title: '', completed: false })),
      imageUrl: '',
      unit: '',
      targetValue: '',
      currentValue: '',
    });
    setActiveTab('form');
  };

  // Form Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      alert('Goal title is required.');
      return;
    }

    // Filter out empty milestone steps
    const activeMilestones = formState.milestones
      .filter(m => m.title.trim() !== '')
      .map(m => ({ ...m, title: m.title.trim() }));

    const goalData: Partial<Goal> = {
      id: editingGoal ? editingGoal.id : undefined,
      title: formState.title.trim(),
      description: formState.description.trim(),
      category: formState.category,
      priority: formState.priority,
      status: formState.status,
      targetDate: formState.targetDate,
      progress: Number(formState.progress),
      reward: formState.reward.trim(),
      purpose: formState.purpose.trim(),
      successCriteria: formState.successCriteria.trim(),
      requirements: formState.requirements.trim(),
      challenges: formState.challenges.trim(),
      milestones: activeMilestones,
      imageUrl: formState.imageUrl.trim() || undefined,
      unit: formState.unit.trim() || undefined,
      targetValue: formState.targetValue !== '' ? Number(formState.targetValue) : undefined,
      currentValue: formState.currentValue !== '' ? Number(formState.currentValue) : undefined,
      createdAt: editingGoal ? editingGoal.createdAt : new Date().toISOString().split('T')[0],
      tags: editingGoal ? editingGoal.tags : [],
      journalEntries: editingGoal ? editingGoal.journalEntries : [],
    };

    onSaveGoal(goalData);
    setEditingGoal(null);
    setActiveTab('list');
  };

  // Milestone input change handler
  const handleMilestoneTextChange = (idx: number, text: string) => {
    const updated = [...formState.milestones];
    updated[idx] = { ...updated[idx], title: text };
    setFormState(prev => ({ ...prev, milestones: updated }));
  };

  // Milestone check toggle in form
  const handleMilestoneCheckChange = (idx: number, checked: boolean) => {
    const updated = [...formState.milestones];
    updated[idx] = { ...updated[idx], completed: checked };
    setFormState(prev => ({ ...prev, milestones: updated }));
  };

  // Filter list of goals
  const filteredGoals = goals.filter((goal) => {
    const categoryMatch = selectedCategory === 'All' || goal.category === selectedCategory;
    const statusMatch = selectedStatus === 'All' || goal.status === selectedStatus;
    const searchMatch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        goal.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && statusMatch && searchMatch;
  });

  return (
    <div className="gj-container animate-fade-in" style={{ padding: '24px' }}>
      {/* Title Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="masters-landing-title text-main">My Goal Planner</h1>
          <p className="masters-landing-desc text-secondary">
            Map out milestones, configure goals status, and review summary metrics.
          </p>
        </div>

      </div>

      {/* Tabs navigation */}
      <div className="users-tabs-header">
        <button
          onClick={() => setActiveTab('summary')}
          className={`users-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
        >
          <Award size={16} />
          <span>Goal Summary</span>
        </button>
        <button
          onClick={editingGoal ? () => setActiveTab('form') : startCreateGoal}
          className={`users-tab-btn ${activeTab === 'form' ? 'active' : ''}`}
        >
          <Plus size={16} />
          <span>{editingGoal ? `Edit: ${editingGoal.title.substring(0, 15)}...` : 'Add New Goal'}</span>
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`users-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
        >
          <Target size={16} />
          <span>Goals List ({totalGoalsCount})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="tab-contents-panel mt-6">
        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="summary-tab-container animate-fade-in">
            {/* Top row with radial progress and metrics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px', marginBottom: '24px' }}>
              {/* Circular Gauge */}
              <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 className="sub-module-card-title text-center mb-6">Average Goal Progress</h3>
                <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                  <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background track */}
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="14"
                    />
                    {/* Active progress */}
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="transparent"
                      stroke="url(#progress-gradient)"
                      strokeWidth="14"
                      strokeDasharray="439.8"
                      strokeDashoffset={439.8 - (439.8 * avgProgress) / 100}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                    <defs>
                      <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)'
                  }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>{avgProgress}%</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall</span>
                  </div>
                </div>
              </div>

              {/* Status and Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div className="pillar-card pastel-green-card glass-card" style={{ padding: '20px' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={18} className="text-emerald-600" />
                    <span className="font-bold text-xs" style={{ color: '#047857' }}>Total Goals</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a' }}>{totalGoalsCount}</h2>
                  <p style={{ fontSize: '0.72rem', color: '#059669', marginTop: '6px', fontWeight: 600 }}>Lifetime aspirations</p>
                </div>

                <div className="pillar-card pastel-yellow-card glass-card" style={{ padding: '20px' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Flame size={18} className="text-amber-600" />
                    <span className="font-bold text-xs" style={{ color: '#b45309' }}>In Progress</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a' }}>{activeCount}</h2>
                  <p style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '6px', fontWeight: 600 }}>Active targets</p>
                </div>

                <div className="pillar-card pastel-pink-card glass-card" style={{ padding: '20px' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-pink-600" />
                    <span className="font-bold text-xs" style={{ color: '#be185d' }}>Completed</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a' }}>{completedCount}</h2>
                  <p style={{ fontSize: '0.72rem', color: '#be185d', marginTop: '6px', fontWeight: 600 }}>Accomplished dreams</p>
                </div>

                <div className="pillar-card glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bcf0da' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={18} className="text-emerald-700" />
                    <span className="font-bold text-xs" style={{ color: '#15803d' }}>Success Rate</span>
                  </div>
                  <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803d' }}>{successRate}%</h2>
                  <p style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '6px', fontWeight: 600 }}>Goal completion ratio</p>
                </div>
              </div>
            </div>

            {/* Category breakdown bar charts */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 className="sub-module-card-title mb-6">Progress by Category</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {CATEGORIES.map(cat => {
                  const catGoals = goals.filter(g => g.category === cat);
                  const catTotal = catGoals.length;
                  const catProgress = catTotal > 0 ? Math.round(catGoals.reduce((acc, g) => acc + g.progress, 0) / catTotal) : 0;
                  
                  const colors = {
                    'Financial Freedom': '#eab308',
                    'Career & Work': '#3b82f6',
                    'Health & Fitness': '#ef4444',
                    'Personal Growth': '#a855f7',
                    'Travel & Adventure': '#f97316',
                    'Relationships & Family': '#ec4899',
                    'Mindfulness & Wellbeing': '#06b6d4'
                  }[cat] || '#3b82f6';

                  return (
                    <div key={cat} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 50px', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#475569' }}>{cat}</span>
                      <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          height: '100%', width: `${catProgress}%`, background: colors, 
                          borderRadius: '5px', transition: 'width 0.6s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>
                        {catProgress}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADD/EDIT GOAL FORM (DARK BLUE THEME REPLICA) */}
        {activeTab === 'form' && (
          <div className="custom-goal-form-container animate-fade-in">
            <form onSubmit={handleFormSubmit}>
              {/* GOAL Title Textarea */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">GOAL</label>
                <div className="dark-input-box-wrapper">
                  <textarea
                    rows={2}
                    value={formState.title}
                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Save $50,000 for Real Estate Deposit"
                    className="dark-textarea-title"
                    required
                  />
                </div>
              </div>

              {/* Central Box "Test" from screenshots */}
              <div className="dark-card-test-box mb-6">
                <span className="test-text">Goal Configuration Panel</span>
              </div>

              {/* Grid Metadata Table */}
              <div className="dark-metadata-table-container mb-6">
                <table className="dark-metadata-table">
                  <tbody>
                    <tr>
                      <td className="meta-label">AREA OF LIFE</td>
                      <td className="meta-value">
                        <select
                          value={formState.category}
                          onChange={(e) => setFormState(prev => ({ ...prev, category: e.target.value as Category }))}
                          className="dark-select"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td className="meta-label">REWARD</td>
                      <td className="meta-value">
                        <input
                          type="text"
                          value={formState.reward}
                          onChange={(e) => setFormState(prev => ({ ...prev, reward: e.target.value }))}
                          placeholder="What is your reward for completion?"
                          className="dark-input"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="meta-label">DEADLINE</td>
                      <td className="meta-value">
                        <input
                          type="date"
                          value={formState.targetDate}
                          onChange={(e) => setFormState(prev => ({ ...prev, targetDate: e.target.value }))}
                          onClick={(e) => {
                            try {
                              e.currentTarget.showPicker();
                            } catch (err) {
                              console.log('showPicker not supported:', err);
                            }
                          }}
                          className="dark-input"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="meta-label">DAYS LEFT</td>
                      <td className="meta-value read-only">
                        <span className="days-left-counter">
                          {formState.targetDate ? calculateDaysLeft(formState.targetDate) : 'Select deadline'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="meta-label">STATUS</td>
                      <td className="meta-value">
                        <select
                          value={formState.status}
                          onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as Status }))}
                          className="dark-select"
                        >
                          {STATUSES.map(st => (
                            <option key={st.value} value={st.value}>
                              {st.emoji} {st.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* WHAT DO YOU WANT TO ACHIEVE? */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">WHAT DO YOU WANT TO ACHIEVE?</label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the target details..."
                  className="dark-textarea"
                />
              </div>

              {/* WHY IS THIS GOAL IMPORTANT? */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">WHY IS THIS GOAL IMPORTANT?</label>
                <textarea
                  rows={3}
                  value={formState.purpose}
                  onChange={(e) => setFormState(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Why is this life goal important to you? What will change once achieved?"
                  className="dark-textarea"
                />
              </div>

              {/* HOW DO YOU MEASURE SUCCESS? */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">HOW DO YOU MEASURE SUCCESS?</label>
                <textarea
                  rows={3}
                  value={formState.successCriteria}
                  onChange={(e) => setFormState(prev => ({ ...prev, successCriteria: e.target.value }))}
                  placeholder="Describe your metric for accomplishment..."
                  className="dark-textarea"
                />
              </div>

              {/* WHAT DO YOU NEED TO COMPLETE THIS GOAL? */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">WHAT DO YOU NEED TO COMPLETE THIS GOAL?</label>
                <textarea
                  rows={3}
                  value={formState.requirements}
                  onChange={(e) => setFormState(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="e.g. Tools, budget, training, support, mentorship..."
                  className="dark-textarea"
                />
              </div>

              {/* Are there any Potential challenges that may arise during Completion? How Will you overcome them? */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">POTENTIAL CHALLENGES & OVERCOME ACTION PLAN</label>
                <textarea
                  rows={3}
                  value={formState.challenges}
                  onChange={(e) => setFormState(prev => ({ ...prev, challenges: e.target.value }))}
                  placeholder="Describe potential barriers or obstacles, and your plans/actions to overcome them..."
                  className="dark-textarea"
                />
              </div>

              {/* PROGRESS SLIDER */}
              <div className="form-group-dark mb-6">
                <label className="form-label-purple">PROGRESS ({formState.progress}%)</label>
                <div className="dark-slider-wrapper">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formState.progress}
                    onChange={(e) => setFormState(prev => ({ ...prev, progress: Number(e.target.value) }))}
                    className="dark-slider-input"
                  />
                </div>
              </div>

              {/* STEPS TO REACH GOAL */}
              <div className="form-group-dark mb-8">
                <label className="form-label-purple">STEPS TO REACH GOAL</label>
                <div className="dark-steps-checklist-container">
                  <table className="dark-steps-table">
                    <tbody>
                      {formState.milestones.map((m, idx) => (
                        <tr key={m.id} className="dark-step-row">
                          <td className="step-check-cell">
                            <input
                              type="checkbox"
                              checked={m.completed}
                              onChange={(e) => handleMilestoneCheckChange(idx, e.target.checked)}
                              className="dark-checkbox"
                            />
                          </td>
                          <td className="step-input-cell">
                            <input
                              type="text"
                              value={m.title}
                              onChange={(e) => handleMilestoneTextChange(idx, e.target.value)}
                              placeholder={`Step ${idx + 1}...`}
                              className="dark-step-input"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="form-actions-dark" style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(null);
                    setActiveTab('list');
                  }}
                  className="dark-cancel-btn"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  className="dark-save-btn"
                >
                  <Save size={16} />
                  <span>Save Life Goal</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: GOALS LIST WITH INLINE STATUS SELECT */}
        {activeTab === 'list' && (
          <div className="goals-list-tab animate-fade-in">
            {/* Filter toolbar */}
            <div className="glass-card mb-6" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div className="flex items-center gap-4" style={{ flexWrap: 'wrap', flexGrow: 1 }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search goals..."
                    className="gj-select"
                    style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: '0.8rem' }}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <ListFilter size={15} />
                  <span>FILTER BY:</span>
                </div>

                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as Category | 'All')}
                  className="gj-select"
                  style={{ width: '180px', padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Status Dropdown */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as Status | 'All')}
                  className="gj-select"
                  style={{ width: '150px', padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  <option value="All">All Statuses</option>
                  {STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>{st.emoji} {st.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Table/Rows */}
            {filteredGoals.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '60px 24px' }}>
                <Target size={48} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>No goals found</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                  Try adjusting your filters or add a new goal to start.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredGoals.map((goal) => {
                  const daysLeft = calculateDaysLeft(goal.targetDate);
                  return (
                    <div 
                      key={goal.id} 
                      className="glass-card" 
                      style={{ 
                        padding: '20px 24px', display: 'flex', justifyContent: 'space-between', 
                        alignItems: 'center', transition: 'all 0.2s ease', position: 'relative',
                        borderLeft: goal.status === 'completed' ? '4px solid #10b981' : '4px solid #3b82f6'
                      }}
                    >
                      {/* Left: Info Stack */}
                      <div style={{ flexGrow: 1, minWidth: 0, paddingRight: '24px' }}>
                        <div className="flex items-center gap-3 mb-2">
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                            background: '#f1f5f9', color: '#475569', textTransform: 'uppercase'
                          }}>
                            {goal.category}
                          </span>
                          {goal.reward && (
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                              background: '#fef08a', color: '#b45309'
                            }}>
                              🎁 Reward: {goal.reward}
                            </span>
                          )}
                        </div>
                        <h3 className="goal-title" style={{ margin: '0 0 6px 0', fontSize: '1.05rem' }}>{goal.title}</h3>
                        <p className="goal-description" style={{ margin: '0 0 12px 0', fontSize: '0.82rem' }}>
                          {goal.description}
                        </p>

                        {/* Progress Bar & Milestones indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          {/* Progress */}
                          <div style={{ width: '200px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                              <span>Progress</span>
                              <span>{goal.progress}%</span>
                            </div>
                            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${goal.progress}%`, background: goal.progress === 100 ? '#10b981' : '#0284c7', borderRadius: '3px' }} />
                            </div>
                          </div>

                          {/* Steps completed */}
                          {goal.milestones.length > 0 && (
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>
                              Steps: {goal.milestones.filter(m => m.completed).length} / {goal.milestones.length}
                            </span>
                          )}

                          {/* Deadline */}
                          {goal.targetDate && (
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: daysLeft !== '' && Number(daysLeft) <= 5 ? '#ef4444' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={14} />
                              {daysLeft !== '' ? (
                                Number(daysLeft) < 0 ? `Overdue by ${Math.abs(Number(daysLeft))}d` : `${daysLeft}d left`
                              ) : 'No Deadline'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Inline Actions / Status Dropdown */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                        {/* Inline Status Select (Drop-down) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
                          <select
                            value={goal.status}
                            onChange={(e) => onUpdateStatus(goal.id, e.target.value as Status)}
                            className="gj-select"
                            style={{ 
                              padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, width: '135px',
                              background: '#ffffff', color: '#1e293b', border: '1px solid #cbd5e1'
                            }}
                          >
                            {STATUSES.map(st => (
                              <option key={st.value} value={st.value}>{st.emoji} {st.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Journal Reflection */}
                        <button
                          onClick={() => onOpenJournal(goal)}
                          className="journal-badge-btn"
                          title="Open reflection journal log"
                          style={{ padding: '8px 12px' }}
                        >
                          <BookOpen size={14} />
                          <span style={{ fontSize: '0.72rem' }}>Journal</span>
                        </button>

                        {/* Edit Button */}
                        <button 
                          onClick={() => startEditGoal(goal)} 
                          className="icon-btn" 
                          title="Edit Life Goal"
                          style={{ border: '1px solid #e2e8f0', padding: '8px' }}
                        >
                          <Edit3 size={15} style={{ color: '#0284c7' }} />
                        </button>

                        {/* Delete Button */}
                        <button 
                          onClick={() => { if(confirm('Are you sure you want to delete this goal?')) onDeleteGoal(goal.id); }} 
                          className="icon-btn" 
                          title="Delete Goal"
                          style={{ border: '1px solid #e2e8f0', padding: '8px' }}
                        >
                          <Trash2 size={15} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
