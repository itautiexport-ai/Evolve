import React, { useState, useEffect } from 'react';
import type { User } from '../types/goal';
import type { Habit } from '../types/habit';
import type { Goal } from '../types/goal';
import { 
  Target, Heart, Calendar, Award, CheckCircle2, 
  Circle, Activity, ChevronRight, MessageSquare 
} from 'lucide-react';

interface OverallDashboardViewProps {
  currentUser: User;
  habits: Habit[];
  goals: Goal[];
  onToggleHabit: (habitId: string, dateStr: string) => void;
  setActiveNav: (nav: string) => void;
}

export const OverallDashboardView: React.FC<OverallDashboardViewProps> = ({
  currentUser,
  habits,
  goals,
  onToggleHabit,
  setActiveNav,
}) => {
  const [timeString, setTimeString] = useState('');
  const [greeting, setGreeting] = useState('Happy Morning!');
  const [greetingEmoji, setGreetingEmoji] = useState('🌅');

  // Live Date & Time Clock matching main Evolve style
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();

      if (hours >= 5 && hours < 12) {
        setGreeting('Happy Morning!');
        setGreetingEmoji('🌅');
      } else if (hours >= 12 && hours < 17) {
        setGreeting('Happy Afternoon!');
        setGreetingEmoji('☀️');
      } else {
        setGreeting('Happy Evening!');
        setGreetingEmoji('🌙');
      }

      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      const datePart = now.toLocaleDateString('en-US', options);
      const timePart = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      });

      setTimeString(`${datePart} • ${timePart}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helpers for stats aggregation
  const getLocalTodayStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  const todayStr = getLocalTodayStr();

  // 1. Habit Completion Stats
  const activeHabitsToday = habits.filter(h => {
    // If daily habit or created before/on today
    const createdDate = new Date(h.createdAt);
    createdDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return createdDate <= today && (h.frequency === 'daily' || !h.frequency);
  });

  const habitsDoneToday = activeHabitsToday.filter(h => h.history && h.history[todayStr]).length;
  const habitCompletionRate = activeHabitsToday.length > 0 
    ? Math.round((habitsDoneToday / activeHabitsToday.length) * 100) 
    : 0;

  // 2. Goal Progress Stats
  const activeGoals = goals.filter(g => g.status === 'active' || !g.status);
  const avgGoalProgress = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length) 
    : 0;

  // 3. Gratitude count
  const [gratitudeCount, setGratitudeCount] = useState(0);
  useEffect(() => {
    const saved = localStorage.getItem('evolve_gratitude_entries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGratitudeCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch (e) { console.error(e); }
    }
  }, []);

  // 4. Latest Happiness Score
  const [latestHappiness, setLatestHappiness] = useState<number | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem('evolve_weekly_reviews_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const keys = Object.keys(parsed).sort(); // Sort keys ascending
        if (keys.length > 0) {
          const latestKey = keys[keys.length - 1];
          setLatestHappiness(parsed[latestKey].happinessScore);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  return (
    <div className="dashboard-view-container animate-fade-in font-sans">
      
      {/* Welcome Hero Banner */}
      <div className="glass-card p-8 mb-8 border border-slate-100 flex flex-col justify-between relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '20px'
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full pointer-events-none" />
        
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            {greeting} <span className="greeting-emoji">{greetingEmoji}</span>
          </h1>
          <p className="text-sm font-semibold text-slate-300 mt-1">
            Welcome back, {currentUser.name || 'System Admin'}. Here is your overall progress report for today.
          </p>
        </div>
        
        <div className="mt-6 border-t border-slate-700/50 pt-4 flex justify-between items-center flex-wrap gap-3">
          <span className="text-xs font-bold text-slate-400">LIVE STATS OVERVIEW</span>
          <span className="text-xs font-extrabold text-indigo-400">{timeString}</span>
        </div>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        
        {/* KPI 1: Habits Done Today */}
        <div 
          onClick={() => setActiveNav('habits')}
          className="glass-card p-5 border border-slate-100 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">Habits Done</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Calendar size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-main">{habitsDoneToday} / {activeHabitsToday.length}</span>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${habitCompletionRate}%` }} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1.5">{habitCompletionRate}% Completed Today</p>
          </div>
        </div>

        {/* KPI 2: Active Goals Progress */}
        <div 
          onClick={() => setActiveNav('goals')}
          className="glass-card p-5 border border-slate-100 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">Active Goals</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Target size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-main">{activeGoals.length} Focus</span>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${avgGoalProgress}%` }} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1.5">{avgGoalProgress}% Avg Progress</p>
          </div>
        </div>

        {/* KPI 3: Gratitude Logs */}
        <div 
          onClick={() => setActiveNav('gratitude')}
          className="glass-card p-5 border border-slate-100 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">Gratitude Logs</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
              <Heart size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-main">{gratitudeCount} Entries</span>
            <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
              <MessageSquare size={10} /> Blessings logged to date
            </p>
          </div>
        </div>

        {/* KPI 4: Life Happiness score */}
        <div 
          onClick={() => setActiveNav('habits-dashboard')}
          className="glass-card p-5 border border-slate-100 flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-secondary">Happiness Score</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
              <Award size={16} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-main">{latestHappiness ? `${latestHappiness} / 10` : 'Pending'}</span>
            <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
              <Activity size={10} /> Latest weekly review index
            </p>
          </div>
        </div>

      </div>

      {/* Habits Toggle List & Pinned Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Panel 1: Today's Routine Action List */}
        <div className="glass-card p-6 border border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />
              Today's Routine Checklist
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
              Quick check
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
            {activeHabitsToday.length > 0 ? (
              activeHabitsToday.map(habit => {
                const isChecked = habit.history && habit.history[todayStr];
                return (
                  <div 
                    key={habit.id}
                    onClick={() => onToggleHabit(habit.id, todayStr)}
                    className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {isChecked ? (
                        <CheckCircle2 size={18} className="text-indigo-600" />
                      ) : (
                        <Circle size={18} className="text-slate-300" />
                      )}
                      <span className={`text-xs font-bold ${isChecked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {habit.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 border rounded-md">
                      {habit.category}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-bold">
                No active habits defined for today. Go to Habit Tracker to add one.
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Focus Goals Overview */}
        <div className="glass-card p-6 border border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Target size={16} className="text-emerald-500" />
              Focus Goals & Milestones
            </h3>
            <button 
              onClick={() => setActiveNav('goals')}
              className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all px-2.5 py-1 rounded-full flex items-center gap-0.5"
            >
              Manage <ChevronRight size={10} />
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto pr-1">
            {activeGoals.length > 0 ? (
              activeGoals.map(goal => (
                <div key={goal.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">{goal.title}</span>
                    <span className="text-[9px] font-extrabold text-emerald-600 bg-white border border-emerald-200 px-2 py-0.5 rounded">
                      {goal.progress}%
                    </span>
                  </div>
                  
                  {/* Goal Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${goal.progress || 0}%` }} />
                  </div>
                  
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>Category: {goal.category}</span>
                    <span>Target: {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs font-bold">
                No active goals. Go to Goal Planner to add one.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
