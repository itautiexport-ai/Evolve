import React, { useState, useEffect } from 'react';
import type { Habit } from '../types/habit';
import { 
  Plus, Edit, Sparkles, TrendingUp, X, ChevronUp, ChevronDown, 
  Minus, AlertCircle, Zap, CheckCircle2, ListTodo, ShieldAlert, Award, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WeeklyReview {
  weekKey: string; // YYYY-MM-DD (Sunday start date)
  happinessScore: number;
  risks: string[];
  commitments: string[];
}

interface HabitsDashboardViewProps {
  habits: Habit[];
}

const REVIEWS_STORAGE = 'evolve_weekly_reviews_v1';

export const HabitsDashboardView: React.FC<HabitsDashboardViewProps> = ({
  habits,
}) => {
  // 1. Get current and past week keys
  const getWeekKey = (date: Date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // adjust to Sunday
    const sunday = new Date(d.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  const getWeekRangeLabel = (dateStr: string) => {
    const start = new Date(dateStr);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  };

  const currentWeekKey = getWeekKey(new Date());

  // State for reviews and check-in modal
  const [reviews, setReviews] = useState<{ [weekKey: string]: WeeklyReview }>(() => {
    const saved = localStorage.getItem(REVIEWS_STORAGE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {};
  });

  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(currentWeekKey);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [formHappinessScore, setFormHappinessScore] = useState<number>(5);
  const [formRisksText, setFormRisksText] = useState('');
  const [formCommitmentsText, setFormCommitmentsText] = useState('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(REVIEWS_STORAGE, JSON.stringify(reviews));
  }, [reviews]);

  // Calculate Implementation Score for the SELECTED week
  const getWeeklyImplementationStats = (weekKeyStr: string) => {
    let totalExpected = 0;
    let totalActual = 0;
    const weekStart = new Date(weekKeyStr);
    
    // Evaluate 7 days starting from weekStart (Sunday to Saturday)
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Stop counting if evaluating future dates
      if (d > new Date()) continue;

      habits.forEach(habit => {
        const createdDate = new Date(habit.createdAt);
        if (createdDate <= d) {
          if (habit.frequency === 'daily' || !habit.frequency) {
            totalExpected++;
            if (habit.history && habit.history[dateStr]) totalActual++;
          } else if (habit.frequency === 'weekly') {
            if (d.getDay() === 0) { // Count weekly on Sundays
              totalExpected++;
              if (habit.history && habit.history[dateStr]) totalActual++;
            }
          } else if (habit.frequency === 'monthly') {
            if (d.getDate() === 1) { // Count monthly on 1st of month
              totalExpected++;
              if (habit.history && habit.history[dateStr]) totalActual++;
            }
          }
        }
      });
    }

    const notDone = totalExpected - totalActual;
    const percent = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
    return {
      total: totalExpected,
      done: totalActual,
      notDone: notDone,
      percent: totalExpected > 0 ? Number(percent.toFixed(1)) : 0
    };
  };

  const implStats = getWeeklyImplementationStats(selectedWeekKey);

  // Get current and past review data
  const currentWeekReview = reviews[selectedWeekKey];
  
  // Find the previous week's review relative to the selected week
  const getPreviousWeekReview = (keyStr: string) => {
    const d = new Date(keyStr);
    d.setDate(d.getDate() - 7);
    const prevKey = getWeekKey(d);
    return reviews[prevKey];
  };

  const previousWeekReview = getPreviousWeekReview(selectedWeekKey);

  // Open modal and pre-fill form
  const handleOpenModal = () => {
    const existing = reviews[selectedWeekKey];
    if (existing) {
      setFormHappinessScore(existing.happinessScore);
      setFormRisksText(existing.risks.join('\n'));
      setFormCommitmentsText(existing.commitments.join('\n'));
    } else {
      setFormHappinessScore(5);
      setFormRisksText('');
      setFormCommitmentsText('');
    }
    setIsModalOpen(true);
  };

  // Handle saving the review
  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedRisks = formRisksText
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const parsedCommitments = formCommitmentsText
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const updatedReview: WeeklyReview = {
      weekKey: selectedWeekKey,
      happinessScore: formHappinessScore,
      risks: parsedRisks,
      commitments: parsedCommitments
    };

    setReviews(prev => ({
      ...prev,
      [selectedWeekKey]: updatedReview
    }));

    setIsModalOpen(false);

    // Trigger celebration if happy or improved
    const prevScore = previousWeekReview?.happinessScore || 0;
    if (formHappinessScore > prevScore || formHappinessScore >= 8) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#ec4899', '#f59e0b']
      });
    }
  };

  const handleResetAllReviews = () => {
    if (window.confirm('Are you sure you want to reset all weekly reviews? This will delete all your logged reviews and happiness history.')) {
      setReviews({});
      localStorage.removeItem(REVIEWS_STORAGE);
      confetti({
        particleCount: 50,
        spread: 40,
        colors: ['#ef4444', '#f87171']
      });
    }
  };

  // Compare score and determine improvement sign & styling
  const getTrendData = () => {
    if (!currentWeekReview) return { text: 'Pending review', icon: null, style: 'trend-pending' };
    if (!previousWeekReview) return { text: 'Stable (First Log)', icon: <Minus size={14} />, style: 'trend-stable' };

    const diff = currentWeekReview.happinessScore - previousWeekReview.happinessScore;
    if (diff > 0) {
      return { 
        text: `Improved (+${diff})`, 
        icon: <ChevronUp size={14} />, 
        style: 'trend-up' 
      };
    } else if (diff < 0) {
      return { 
        text: `Declined (${diff})`, 
        icon: <ChevronDown size={14} />, 
        style: 'trend-down' 
      };
    } else {
      return { 
        text: 'Stable (No Change)', 
        icon: <Minus size={14} />, 
        style: 'trend-stable' 
      };
    }
  };

  const trend = getTrendData();

  // Create list of last 6 weeks for historical dropdown selection
  const getPastWeeksList = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i * 7);
      const key = getWeekKey(d);
      list.push({
        key,
        label: getWeekRangeLabel(key) + (key === currentWeekKey ? ' (Current Week)' : '')
      });
    }
    return list;
  };

  const pastWeeks = getPastWeeksList();

  // Circular progress calculations
  const radius = 46;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // ~289.02
  const strokeDashoffset = circumference - (circumference * implStats.percent) / 100;

  return (
    <div className="dashboard-view-container animate-fade-in font-sans">
      
      {/* 1. Dashboard Header Section */}
      <div className="dashboard-header mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <TrendingUp size={24} className="text-indigo-500" />
            <h1 className="text-xl font-extrabold text-main">Weekly Performance Review</h1>
          </div>
          <p className="text-xs text-secondary mt-1">
            Analyze routine execution, track happiness alignment, and log core weekly resolutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Week Selection Dropdown */}
          <div className="relative">
            <select
              value={selectedWeekKey}
              onChange={(e) => setSelectedWeekKey(e.target.value)}
              className="sheet-select-dropdown"
              style={{
                padding: '10px 36px 10px 16px',
                border: '1.5px solid rgba(15, 23, 42, 0.1)',
                borderRadius: '14px',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                fontWeight: 750,
                color: '#1e293b',
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                appearance: 'none',
                cursor: 'pointer',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M3 5L6 8L9 5\' stroke=\'%23475569\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 14px center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
              }}
            >
              {pastWeeks.map(wk => (
                <option key={wk.key} value={wk.key}>{wk.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleResetAllReviews}
            className="flex items-center gap-2 text-xs font-bold border px-4 py-2.5 rounded-xl transition-all"
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1.5px solid rgba(15, 23, 42, 0.1)',
              padding: '10px 16px',
              cursor: 'pointer',
              fontWeight: 750,
              color: '#64748b',
            }}
          >
            <RotateCcw size={14} />
            Reset Data
          </button>

          <button
            onClick={handleOpenModal}
            className="btn-save flex items-center gap-2 text-xs"
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '11px 18px',
              borderRadius: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
            }}
          >
            {currentWeekReview ? <Edit size={14} /> : <Plus size={14} />} 
            {currentWeekReview ? 'Edit Alignment Log' : 'Log Weekly Review'}
          </button>
        </div>
      </div>

      {/* 2. Top Section: Visual Cards (Implementation Stats & Happiness Objective) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Card A: Habit Implementation Ring */}
        <div className="glass-card p-6 border border-slate-100 flex items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full pointer-events-none" />
          
          {/* Circular SVG Ring */}
          <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: '120px', height: '120px' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-95">
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              {/* Underlay Track */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress Stroke */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="url(#ringGrad)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            {/* Center score percentage label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-black text-main leading-none">{implStats.percent}%</span>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-secondary mt-1">Score</span>
            </div>
          </div>

          {/* Details list on the right */}
          <div className="flex-grow flex flex-col gap-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-secondary flex items-center gap-1.5">
              <ListTodo size={14} className="text-indigo-500" />
              Implementation score
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Total Task Expected</span>
                <span className="font-extrabold text-main">{implStats.total}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Done
                </span>
                <span className="font-extrabold text-emerald-600">{implStats.done}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-rose-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Not done
                </span>
                <span className="font-extrabold text-rose-500">{implStats.notDone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Happiness Index Compare */}
        <div className="glass-card p-6 border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-pink-500/5 to-rose-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <Award size={14} className="text-pink-500" />
                Happiness & Fulfilment in Life
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Rating scale: 1 - Very Sad to 10 - Very Happy</p>
            </div>
            
            {/* Trend Indicator Badge */}
            <span className={`trend-badge ${trend.style} flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider`}>
              {trend.icon}
              {trend.text}
            </span>
          </div>

          {/* Rating visual progress comparison */}
          <div className="my-4">
            {currentWeekReview ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-sm font-black text-pink-500">{currentWeekReview.happinessScore} / 10 Rating</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                  <div 
                    className="h-full bg-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentWeekReview.happinessScore * 10}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-3 rounded-2xl bg-pink-50/50 border border-dashed border-pink-200">
                <button 
                  onClick={handleOpenModal}
                  className="text-xs text-pink-600 hover:text-pink-800 font-bold flex items-center gap-1.5"
                >
                  <Sparkles size={14} className="animate-pulse" /> Complete Weekly Review to track Happiness
                </button>
              </div>
            )}
          </div>

          {/* Comparison Details Footer */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Last Week:</span>
              <span className="font-extrabold text-slate-700">
                {previousWeekReview ? `${previousWeekReview.happinessScore}/10` : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">This Week:</span>
              <span className="font-extrabold text-slate-800">
                {currentWeekReview ? `${currentWeekReview.happinessScore}/10` : 'Pending'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom Section: Side-by-Side Reflection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Gaps & Roadblocks */}
        <div className="glass-card p-6 border-l-4 border-l-rose-500/80 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500" />
              Gaps & Roadblocks to Address
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
              Performance Breakdown
            </span>
          </div>

          <div className="flex-grow min-h-[160px]">
            {currentWeekReview && currentWeekReview.risks.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {currentWeekReview.risks.map((risk, index) => (
                  <div key={index} className="flex gap-2.5 items-start p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all border border-slate-100/50">
                    <AlertCircle size={14} className="text-rose-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-700 leading-relaxed">{risk}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 text-slate-400">
                <Minus size={20} className="mb-2" />
                <span className="text-xs font-semibold">
                  {currentWeekReview ? 'No performance breakdown risks logged.' : 'Submit a review to list challenges.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Action Commitments */}
        <div className="glass-card p-6 border-l-4 border-l-emerald-500/80 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Zap size={16} className="text-emerald-500" />
              Commitments & Focus Areas
            </h3>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Action Commitment
            </span>
          </div>

          <div className="flex-grow min-h-[160px]">
            {currentWeekReview && currentWeekReview.commitments.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {currentWeekReview.commitments.map((commitment, index) => (
                  <div key={index} className="flex gap-2.5 items-start p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all border border-slate-100/50">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-700 leading-relaxed">{commitment}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 text-slate-400">
                <Minus size={20} className="mb-2" />
                <span className="text-xs font-semibold">
                  {currentWeekReview ? 'No action commitments logged.' : 'Submit a review to list actions.'}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. WEEKLY REVIEW INPUT MODAL */}
      {isModalOpen && (
        <div className="weekly-modal-overlay">
          <div className="weekly-modal-card glass-card border border-slate-200/50 shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-4 mb-5 border-slate-150">
              <div>
                <h3 className="font-extrabold text-main text-base flex items-center gap-2">
                  <Sparkles className="text-indigo-500" size={16} />
                  Weekly Review: {getWeekRangeLabel(selectedWeekKey)}
                </h3>
                <p className="text-[10px] text-secondary mt-0.5 font-semibold">Track happiness index, assess failures, and set action steps.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveReview} className="flex flex-col gap-5">
              
              {/* Field 1: Happiness Score */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-main uppercase tracking-wider">
                  1. Happiness & Fulfilment in Life Score (1-10)
                </label>
                
                {/* 1-10 Rating Blocks */}
                <div className="flex justify-between gap-2 mt-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFormHappinessScore(score)}
                      className={`rating-block-btn ${formHappinessScore === score ? 'active' : ''}`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-secondary font-bold px-1">
                  <span>1 - Very Sad 😟</span>
                  <span>10 - Very Happy 😊</span>
                </div>
              </div>

              {/* Field 2: Risks & Issues */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-main uppercase tracking-wider">
                  2. Risks/Issues/Gaps to address (reasons for performance breakdown)
                </label>
                <textarea
                  value={formRisksText}
                  onChange={(e) => setFormRisksText(e.target.value)}
                  placeholder="Enter each roadblock on a new line, e.g.:&#10;i was lazy&#10;i was busy in other work&#10;i have forgotten"
                  rows={4}
                  className="sheet-textarea border focus:border-slate-900"
                  style={{
                    width: '100%',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    resize: 'none',
                    outline: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Field 3: Commitments */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-main uppercase tracking-wider">
                  3. Action Commitment for next week
                </label>
                <textarea
                  value={formCommitmentsText}
                  onChange={(e) => setFormCommitmentsText(e.target.value)}
                  placeholder="Enter each action commitment on a new line, e.g.:&#10;i will shedule my time forr h.w&#10;i will not eat brefast till i wrtie blessigns"
                  rows={4}
                  className="sheet-textarea border focus:border-slate-900"
                  style={{
                    width: '100%',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    resize: 'none',
                    outline: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 justify-end mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-500 hover:text-slate-800 transition-all"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all hover:scale-103"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  Save Review
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
