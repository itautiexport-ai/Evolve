import React, { useState } from 'react';
import type { Habit, HabitCategory } from '../types/habit';
import { 
  Plus, Trash2, Edit3, Check, CalendarCheck, Sparkles, X, Award, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MyHabitTrackerViewProps {
  habits: Habit[];
  onSaveHabit: (habit: Partial<Habit>) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabit: (habitId: string, dateStr: string) => void;
}

const CATEGORIES: HabitCategory[] = [
  'Health & Fitness',
  'Productivity',
  'Personal Growth',
  'Mindfulness & Wellbeing',
  'Relationships',
  'Financial'
];

export const MyHabitTrackerView: React.FC<MyHabitTrackerViewProps> = ({
  habits,
  onSaveHabit,
  onDeleteHabit,
  onToggleHabit,
}) => {
  // Tab State: 'daily' | 'weekly' | 'monthly'
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Navigation offsets (in pagination chunks)
  const [dailyOffset, setDailyOffset] = useState(0); // in weeks (7-day blocks)
  const [weeklyOffset, setWeeklyOffset] = useState(0); // in weeks
  const [monthlyOffset, setMonthlyOffset] = useState(0); // in months

  // Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<HabitCategory>('Health & Fitness');
  const [formFrequency, setFormFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Generate last 7 days ending with today shifted by offsetWeeks
  const getLast7Days = (offsetWeeks: number) => {
    const days = [];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i - (offsetWeeks * 7));
      
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - (offset * 60 * 1000));
      const dateStr = local.toISOString().split('T')[0];
      
      days.push({
        dateStr,
        dayName: weekdayNames[d.getDay()],
        dayOfMonth: d.getDate(),
        isToday: offsetWeeks === 0 && i === 0
      });
    }
    return days;
  };

  // Generate last 4 weeks ending with this week shifted by offsetWeeks
  const getLast4Weeks = (offsetWeeks: number) => {
    const weeks = [];
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - ((i + offsetWeeks) * 7));
      const day = d.getDay();
      const diff = d.getDate() - day;
      const sunday = new Date(d.setDate(diff));
      
      const offset = sunday.getTimezoneOffset();
      const local = new Date(sunday.getTime() - (offset * 60 * 1000));
      const dateStr = local.toISOString().split('T')[0];
      const dateLabel = `${monthNamesShort[sunday.getMonth()]} ${sunday.getDate()}`;
      
      weeks.push({
        dateStr,
        label: `Wk -${i + offsetWeeks}`,
        dateLabel,
        isToday: offsetWeeks === 0 && i === 0
      });
    }
    return weeks;
  };

  // Generate last 4 months ending with this month shifted by offsetMonths
  const getLast4Months = (offsetMonths: number) => {
    const months = [];
    const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i - offsetMonths);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${year}-${month}-01`;
      
      months.push({
        dateStr,
        label: monthNamesShort[d.getMonth()],
        dateLabel: `${year}`,
        isToday: offsetMonths === 0 && i === 0
      });
    }
    return months;
  };

  const rolling7Days = getLast7Days(dailyOffset);
  const rolling4Weeks = getLast4Weeks(weeklyOffset);
  const rolling4Months = getLast4Months(monthlyOffset);

  // Date Range Formatting Helpers
  const getDailyRangeLabel = (days: any[]) => {
    if (days.length === 0) return '';
    const start = new Date(days[0].dateStr);
    const end = new Date(days[6].dateStr);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  };

  const getWeeklyRangeLabel = (weeks: any[]) => {
    if (weeks.length === 0) return '';
    const start = weeks[0].dateLabel;
    const end = weeks[3].dateLabel;
    const startYear = new Date(weeks[0].dateStr).getFullYear();
    const endYear = new Date(weeks[3].dateStr).getFullYear();
    return `${start}, ${startYear} - ${end}, ${endYear}`;
  };

  const getMonthlyRangeLabel = (months: any[]) => {
    if (months.length === 0) return '';
    const start = months[0];
    const end = months[3];
    return `${start.label} ${start.dateLabel} - ${end.label} ${end.dateLabel}`;
  };

  // Open Form for New Habit
  const handleOpenAddForm = () => {
    setEditingHabit(null);
    setFormName('');
    setFormDesc('');
    setFormCategory('Health & Fitness');
    setFormFrequency(activeTab); // default to matching active tab frequency
    setIsFormOpen(true);
  };

  // Open Form for Editing Habit
  const handleOpenEditForm = (habit: Habit) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDesc(habit.description);
    setFormCategory(habit.category);
    setFormFrequency(habit.frequency || 'daily');
    setIsFormOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onSaveHabit({
      id: editingHabit?.id,
      name: formName.trim(),
      description: formDesc.trim(),
      category: formCategory,
      frequency: formFrequency,
    });

    // Reset Form and redirect
    setEditingHabit(null);
    setFormName('');
    setFormDesc('');
    setIsFormOpen(false);
    
    // Auto-switch to the tab matching the frequency of the habit we just created/updated
    setActiveTab(formFrequency);
  };

  // Toggling completions (with celebration!)
  const handleDayClick = (habit: Habit, dateStr: string, isToday: boolean) => {
    const wasCompleted = habit.history[dateStr];
    onToggleHabit(habit.id, dateStr);

    // If marking as completed for TODAY, burst confetti!
    if (isToday && !wasCompleted) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
      });
    }
  };

  // Navigation shifts
  const handleNavigate = (direction: number) => {
    if (activeTab === 'daily') {
      if (direction === -1) {
        setDailyOffset(prev => prev + 1); // Shift back by 7 days (1 week offset)
      } else {
        setDailyOffset(prev => Math.max(0, prev - 1));
      }
    } else if (activeTab === 'weekly') {
      if (direction === -1) {
        setWeeklyOffset(prev => prev + 4); // Shift back by 4 weeks
      } else {
        setWeeklyOffset(prev => Math.max(0, prev - 4));
      }
    } else if (activeTab === 'monthly') {
      if (direction === -1) {
        setMonthlyOffset(prev => prev + 4); // Shift back by 4 months
      } else {
        setMonthlyOffset(prev => Math.max(0, prev - 4));
      }
    }
  };

  const getCategoryClass = (category: HabitCategory) => {
    switch (category) {
      case 'Health & Fitness': return 'cat-health';
      case 'Productivity': return 'cat-productivity';
      case 'Personal Growth': return 'cat-growth';
      case 'Mindfulness & Wellbeing': return 'cat-mindfulness';
      case 'Relationships': return 'cat-relationships';
      case 'Financial': return 'cat-financial';
      default: return '';
    }
  };

  // Group habits by Habit Type (frequency)
  const dailyHabits = habits.filter(h => h.frequency === 'daily' || !h.frequency);
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
  const monthlyHabits = habits.filter(h => h.frequency === 'monthly');

  const dailyHabitsCount = dailyHabits.length;
  const weeklyHabitsCount = weeklyHabits.length;
  const monthlyHabitsCount = monthlyHabits.length;

  const renderHabitsTable = (currentHabits: Habit[], frequency: 'daily' | 'weekly' | 'monthly') => {
    let periods: any[] = [];
    let currentOffset = 0;
    let rangeLabel = '';

    if (frequency === 'daily') {
      periods = rolling7Days;
      currentOffset = dailyOffset;
      rangeLabel = getDailyRangeLabel(periods);
    } else if (frequency === 'weekly') {
      periods = rolling4Weeks;
      currentOffset = weeklyOffset;
      rangeLabel = getWeeklyRangeLabel(periods);
    } else if (frequency === 'monthly') {
      periods = rolling4Months;
      currentOffset = monthlyOffset;
      rangeLabel = getMonthlyRangeLabel(periods);
    }

    if (currentHabits.length === 0) {
      return (
        <div className="glass-card p-12 text-center mt-6 animate-scale-up" style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
          <CalendarCheck size={48} className="text-secondary mb-4" style={{ color: '#94a3b8' }} />
          <h3 className="text-lg font-bold text-main mb-2">No Habits Found</h3>
          <p className="text-secondary text-sm max-w-sm mb-6" style={{ color: '#64748b', fontSize: '0.88rem', margin: '8px 0 20px 0' }}>
            {frequency === 'daily' && "Start building positive daily routines! Add your first daily habit."}
            {frequency === 'weekly' && "Track your weekly consistency! Add your first weekly habit."}
            {frequency === 'monthly' && "Track your monthly targets! Add your first monthly habit."}
          </p>
          <button onClick={handleOpenAddForm} className="btn-save">
            Add Your First Habit
          </button>
        </div>
      );
    }

    return (
      <div className="habit-table-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Table Pagination Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155' }}>
            {frequency === 'daily' ? 'Daily Progress Logs' : frequency === 'weekly' ? 'Weekly Progress Logs' : 'Monthly Progress Logs'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button"
              onClick={() => handleNavigate(-1)} 
              className="btn-cancel" 
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}
            >
              &larr; Previous
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', minWidth: '180px', textAlign: 'center' }}>
              {rangeLabel}
            </span>
            <button 
              type="button"
              onClick={() => handleNavigate(1)} 
              className="btn-cancel" 
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer' }}
              disabled={currentOffset === 0}
            >
              Next &rarr;
            </button>
          </div>
        </div>

        <div className="habit-table-wrapper">
          <table className="habit-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '220px' }}>Habit Details</th>
                <th style={{ width: '150px' }}>Category</th>
                <th style={{ width: '120px' }}>Streak</th>
                {periods.map(p => (
                  <th key={p.dateStr} className={`period-header-cell ${p.isToday ? 'is-today' : ''}`}>
                    <div className="period-header-name">
                      {frequency === 'daily' ? p.dayName : p.label}
                    </div>
                    <div className="period-header-date">
                      {frequency === 'daily' ? p.dayOfMonth : p.dateLabel}
                    </div>
                  </th>
                ))}
                <th style={{ width: '90px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentHabits.map(habit => {
                return (
                  <tr key={habit.id} className="habit-row">
                    <td style={{ textAlign: 'left' }}>
                      <div className="habit-info-cell">
                        <div className="habit-cell-name">{habit.name}</div>
                        {habit.description && <div className="habit-cell-desc">{habit.description}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={`habit-category-badge ${getCategoryClass(habit.category)}`}>
                        {habit.category}
                      </span>
                    </td>
                    <td>
                      <div className="habit-streak-cell" style={{ color: habit.streak > 0 ? '#ea580c' : '#64748b' }}>
                        <Flame size={15} className={habit.streak > 0 ? 'text-amber-500' : 'text-slate-400'} style={{ color: habit.streak > 0 ? '#f59e0b' : '#94a3b8' }} />
                        <span className="streak-count">{habit.streak || 0}</span>
                        <span className="streak-max">
                          (max: {habit.bestStreak || 0})
                        </span>
                      </div>
                    </td>
                    {periods.map(p => {
                      const isCompleted = habit.history[p.dateStr] || false;
                      return (
                        <td key={p.dateStr} className="period-cell">
                          <button
                            type="button"
                            onClick={() => handleDayClick(habit, p.dateStr, p.isToday)}
                            className={`table-bubble-btn ${isCompleted ? 'completed' : ''} ${p.isToday ? 'today' : ''}`}
                            title={`${isCompleted ? 'Completed' : 'Not completed'} (${p.dateStr})`}
                          >
                            {isCompleted ? <Check size={12} /> : null}
                          </button>
                        </td>
                      );
                    })}
                    <td>
                      <div className="actions-cell">
                        <button 
                          type="button"
                          onClick={() => handleOpenEditForm(habit)}
                          className="icon-btn"
                          title="Edit Habit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                              onDeleteHabit(habit.id);
                            }
                          }}
                          className="icon-btn text-rose-500"
                          title="Delete Habit"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="habit-tracker-container animate-fade-in" style={{ padding: '24px' }}>
      {/* Hero Banner */}
      <div className="gj-hero" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 50%, #818cf8 100%)' }}>
        <div className="gj-hero-glow"></div>
        <div className="gj-hero-content">
          <div className="gj-hero-icon" style={{ background: '#ffffff', color: '#4f46e5' }}>
            <CalendarCheck size={28} />
          </div>
          <div className="gj-hero-text">
            <h2 style={{ color: '#1e1b4b' }}>My Habit Tracker</h2>
            <p style={{ color: '#4f46e5' }}>Build consistency, unlock self-mastery.</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="users-tabs-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('daily')}
            className={`users-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
          >
            <CalendarCheck size={16} />
            <span>My Daily Habits ({dailyHabitsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`users-tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
          >
            <Award size={16} />
            <span>My Weekly Habits ({weeklyHabitsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`users-tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          >
            <Sparkles size={16} />
            <span>My Monthly Habits ({monthlyHabitsCount})</span>
          </button>
        </div>

        <button
          onClick={handleOpenAddForm}
          className="btn-save"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px' }}
        >
          <Plus size={16} />
          <span>Add Habit</span>
        </button>
      </div>

      {/* Tab content switcher */}
      <div className="tab-contents-panel mt-6">
        {activeTab === 'daily' && renderHabitsTable(dailyHabits, 'daily')}
        {activeTab === 'weekly' && renderHabitsTable(weeklyHabits, 'weekly')}
        {activeTab === 'monthly' && renderHabitsTable(monthlyHabits, 'monthly')}
      </div>

      {/* Add / Edit Habit Modal */}
      {isFormOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="custom-goal-form-container animate-scale-up" style={{ position: 'relative', width: '90%', maxWidth: '500px', padding: '32px' }}>
            <button
              onClick={() => {
                setIsFormOpen(false);
                setEditingHabit(null);
                setFormName('');
                setFormDesc('');
              }}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              title="Close"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(226, 232, 240, 0.5)', paddingBottom: '14px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 850, color: 'var(--text-main)', margin: 0 }}>
                {editingHabit ? 'Edit Habit Details' : 'Create New Habit'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Habit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read 15 mins, Drink 3L water, Meditate"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Purpose</label>
                <textarea
                  placeholder="e.g. For mental clarity, focus, and hydration."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as HabitCategory)}
                  className="form-select"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Habit Type</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="form-select"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingHabit(null);
                    setFormName('');
                    setFormDesc('');
                  }} 
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                >
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
