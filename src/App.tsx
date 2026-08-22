import React, { useState, useEffect } from 'react';
import type { Goal, MasterItem, User, JournalEntry } from './types/goal';
import type { Habit } from './types/habit';
import { INITIAL_MASTERS } from './data/initialMasters';
import { INITIAL_GOALS } from './data/initialGoals';
import { DEFAULT_ADMIN_USER, DEFAULT_REGULAR_USER } from './data/authData';
import { EvolveSidebar } from './components/EvolveSidebar';
import { EvolveHeader } from './components/EvolveHeader';
import { EvolveHomePage } from './components/EvolveHomePage';
import { MastersView } from './components/MastersView';
import { EvolveUsersView } from './components/EvolveUsersView';
import { EvolvePermissionsView } from './components/EvolvePermissionsView';
import { EvolveGratitudeView } from './components/EvolveGratitudeView';
import { MyGoalsView } from './components/MyGoalsView';
import { MyGoalsHomeView } from './components/MyGoalsHomeView';
import { VisionBoardView } from './components/VisionBoardView';
import { MusicPlayerView } from './components/MusicPlayerView';
import { MyHabitTrackerView } from './components/MyHabitTrackerView';
import { AuthModal } from './components/AuthModal';
import { JournalModal } from './components/JournalModal';
import { HabitsDashboardView } from './components/HabitsDashboardView';
import { OverallDashboardView } from './components/OverallDashboardView';
import { ShieldAlert, Mail, Lock, ShieldCheck, Key, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const MASTERS_STORAGE = 'evolve_masters_v3';
const GOALS_STORAGE = 'evolve_goals_v3';
const USER_STORAGE = 'evolve_user_v3';
const USERS_STORAGE = 'evolve_users_v3';
const HABITS_STORAGE = 'evolve_habits_v3';

// Daily Streak Calculation helper
const calculateStreak = (history: { [dateStr: string]: boolean }, _frequency: 'daily' | 'weekly' | 'monthly'): number => {
  let streak = 0;
  
  // Format Date to YYYY-MM-DD local
  const formatDate = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - (offset * 60 * 1000));
    return local.toISOString().split('T')[0];
  };

  let checkDate = new Date();
  const todayStr = formatDate(checkDate);
  
  if (history[todayStr]) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const dateStr = formatDate(checkDate);
      if (history[dateStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    // Check yesterday
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = formatDate(checkDate);
    if (history[yesterdayStr]) {
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
      while (true) {
        const dateStr = formatDate(checkDate);
        if (history[dateStr]) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    } else {
      streak = 0;
    }
  }
  
  return streak;
};

export const App: React.FC = () => {
  // Navigation State (Matches Sidebar)
  const [activeNav, setActiveNav] = useState<string>('habits-dashboard');

  // Active User Profile (Defaults to null so user must authenticate)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_STORAGE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { console.error(e); }
    }
    return null;
  });

  // How are you feeling today popup modal state
  const [isFeelingModalOpen, setIsFeelingModalOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      const sessionKey = `evolve_feeling_asked_${currentUser.id}`;
      const hasAsked = sessionStorage.getItem(sessionKey);
      if (!hasAsked) {
        setIsFeelingModalOpen(true);
        setSelectedMood(null);
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  }, [currentUser]);

  // Users List (Defaults to Admin ID only, filters out example user USER-002)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.filter((u: User) => u.id !== 'USER-002');
      } catch (e) { console.error(e); }
    }
    return [
      { ...DEFAULT_ADMIN_USER, name: 'Admin ID', id: 'CRM0001' }
    ];
  });

  // Sync Users to LocalStorage
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE, JSON.stringify(users));
  }, [users]);

  // Masters List
  const [masters] = useState<MasterItem[]>(() => {
    const saved = localStorage.getItem(MASTERS_STORAGE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MASTERS;
  });

  // Goals List
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem(GOALS_STORAGE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_GOALS;
  });

  // Habits List
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem(HABITS_STORAGE);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    
    // Generate dates dynamically for sample habits to maintain fresh streaks on first load!
    const getPastDateStr = (daysAgo: number) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const offset = d.getTimezoneOffset();
      const local = new Date(d.getTime() - (offset * 60 * 1000));
      return local.toISOString().split('T')[0];
    };

    return [
      {
        id: 'habit-1',
        name: 'Drink 3L of Water',
        description: 'Stay hydrated to maintain high cognitive energy and focus.',
        frequency: 'daily',
        category: 'Health & Fitness',
        streak: 5,
        bestStreak: 12,
        history: {
          [getPastDateStr(0)]: true,
          [getPastDateStr(1)]: true,
          [getPastDateStr(2)]: true,
          [getPastDateStr(3)]: true,
          [getPastDateStr(4)]: true,
        },
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'habit-2',
        name: 'Morning Mindfulness',
        description: '10 minutes of box breathing and grounding before starting work.',
        frequency: 'daily',
        category: 'Mindfulness & Wellbeing',
        streak: 3,
        bestStreak: 7,
        history: {
          [getPastDateStr(0)]: true,
          [getPastDateStr(1)]: true,
          [getPastDateStr(2)]: true,
        },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'habit-3',
        name: 'Read 10 Pages',
        description: 'Read a chapter of a non-fiction book to learn something new.',
        frequency: 'daily',
        category: 'Personal Growth',
        streak: 0,
        bestStreak: 15,
        history: {
          [getPastDateStr(1)]: true,
          [getPastDateStr(2)]: true,
        },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  });

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Goal CRUD / Interactive states
  const [selectedGoalForJournal, setSelectedGoalForJournal] = useState<Goal | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Goal Save Handler (handles both Create and Update)
  const handleSaveGoal = (goalData: Partial<Goal>) => {
    if (goalData.id) {
      // Edit mode
      setGoals(prev => prev.map(g => g.id === goalData.id ? { ...g, ...goalData } as Goal : g));
    } else {
      // Add mode
      const newGoal: Goal = {
        ...goalData,
        id: 'goal-' + Date.now(),
        status: 'active',
        isPinned: false,
        journalEntries: [],
        progress: goalData.progress || 0,
      } as Goal;
      setGoals(prev => [...prev, newGoal]);
    }
  };

  // Goal Delete Handler
  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };



  // Update Goal Status directly
  const handleUpdateStatus = (goalId: string, newStatus: Goal['status']) => {
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
  };

  // Add Reflection Journal Entry to Goal
  const handleAddJournalEntry = (goalId: string, entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: 'journal-' + Date.now(),
    };
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const currentEntries = g.journalEntries || [];
      return {
        ...g,
        journalEntries: [...currentEntries, newEntry]
      };
    }));
    // Also update current active journal view so it updates instantly in the modal
    setSelectedGoalForJournal(prev => {
      if (!prev || prev.id !== goalId) return prev;
      return {
        ...prev,
        journalEntries: [...(prev.journalEntries || []), newEntry]
      };
    });
  };

  // Habit Event Handlers
  const handleToggleHabit = (habitId: string, dateStr: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      
      const newHistory = { ...h.history };
      if (newHistory[dateStr]) {
        delete newHistory[dateStr];
      } else {
        newHistory[dateStr] = true;
      }
      
      const currentStreak = calculateStreak(newHistory, h.frequency);
      const bestStreak = Math.max(h.bestStreak || 0, currentStreak);
      
      return {
        ...h,
        history: newHistory,
        streak: currentStreak,
        bestStreak
      };
    }));
  };

  const handleSaveHabit = (habitData: Partial<Habit>) => {
    if (habitData.id) {
      setHabits(prev => prev.map(h => {
        if (h.id !== habitData.id) return h;
        return {
          ...h,
          ...habitData,
        } as Habit;
      }));
    } else {
      const newHabit: Habit = {
        id: 'habit-' + Date.now(),
        name: habitData.name || '',
        description: habitData.description || '',
        category: habitData.category || 'Health & Fitness',
        frequency: habitData.frequency || 'daily',
        streak: 0,
        bestStreak: 0,
        history: {},
        createdAt: new Date().toISOString(),
      };
      setHabits(prev => [...prev, newHabit]);
    }
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleLogout = () => {
    if (currentUser && currentUser.id) {
      sessionStorage.removeItem(`evolve_feeling_asked_${currentUser.id}`);
    }
    localStorage.removeItem(USER_STORAGE);
    setCurrentUser(null);
    setActiveNav('home');
  };

  // Sync LocalStorage
  useEffect(() => {
    localStorage.setItem(MASTERS_STORAGE, JSON.stringify(masters));
  }, [masters]);

  useEffect(() => {
    localStorage.setItem(GOALS_STORAGE, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(USER_STORAGE, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(HABITS_STORAGE, JSON.stringify(habits));
  }, [habits]);

  const renderAccessDenied = (moduleName: string) => (
    <div className="glass-card p-12 text-center max-w-md mx-auto mt-12 animate-scale-up">
      <ShieldAlert size={48} className="text-rose-500 mx-auto mb-4" />
      <h2 className="text-lg font-bold text-main mb-2">Access Denied</h2>
      <p className="text-secondary text-sm leading-relaxed">
        Your account does not have access permissions for the {moduleName} module. Please contact the administrator.
      </p>
    </div>
  );

  if (!currentUser) {
    return (
      <LoginForm onLogin={(user) => setCurrentUser(user)} />
    );
  }

  return (
    <div className={`screenshot-layout-container ${activeNav === 'home' ? 'home-wallpaper-bg' : 'plain-white-bg'}`}>
      {/* Left Sidebar */}
      <EvolveSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      {/* Main Content Area */}
      <main className="screenshot-main-content">
        {/* Top Header with Navigation */}
        <EvolveHeader
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onLogout={handleLogout}
        />

        {/* View Switcher */}
        {activeNav === 'overall-dashboard' ? (
          currentUser.accessOverallDashboard !== false ? (
            <OverallDashboardView
              currentUser={currentUser}
              habits={habits}
              goals={goals}
              onToggleHabit={handleToggleHabit}
              setActiveNav={setActiveNav}
            />
          ) : (
            renderAccessDenied('Dashboard')
          )
        ) : activeNav === 'home' ? (
          <EvolveHomePage
            currentUser={currentUser}
            masters={masters}
            goals={goals}
            setActiveNav={setActiveNav}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        ) : activeNav === 'masters' ? (
          currentUser.accessMasters !== false ? (
            <MastersView setActiveNav={setActiveNav} />
          ) : (
            renderAccessDenied('Masters')
          )
        ) : activeNav === 'users' ? (
          <EvolveUsersView
            users={users}
            setUsers={setUsers}
            currentUser={currentUser}
            onSwitchUser={setCurrentUser}
          />
        ) : activeNav === 'permissions' ? (
          <EvolvePermissionsView
            users={users}
            setUsers={setUsers}
          />
        ) : activeNav === 'gratitude' ? (
          currentUser.accessGratitude !== false ? (
            <EvolveGratitudeView currentUser={currentUser} />
          ) : (
            renderAccessDenied('Gratitude Journal')
          )
        ) : activeNav === 'habits' ? (
          currentUser.accessHabits !== false ? (
            <MyHabitTrackerView
              habits={habits}
              onSaveHabit={handleSaveHabit}
              onDeleteHabit={handleDeleteHabit}
              onToggleHabit={handleToggleHabit}
            />
          ) : (
            renderAccessDenied('My Habit Tracker')
          )
        ) : activeNav === 'habits-dashboard' ? (
          currentUser.accessHabitsDashboard !== false ? (
            <HabitsDashboardView
              habits={habits}
            />
          ) : (
            renderAccessDenied('Habits Dashboard')
          )
        ) : activeNav === 'music' ? (
          currentUser.accessMusic !== false ? (
            <MusicPlayerView />
          ) : (
            renderAccessDenied('Music Player')
          )
        ) : activeNav === 'goals' ? (
          currentUser.accessGoals !== false ? (
            <MyGoalsHomeView
              goals={goals}
              setActiveNav={setActiveNav}
            />
          ) : (
            renderAccessDenied('My Goals')
          )
        ) : activeNav === 'goals-planner' ? (
          currentUser.accessGoals !== false && currentUser.accessGoalPlanner !== false ? (
            <MyGoalsView
              goals={goals}
              onSaveGoal={handleSaveGoal}
              onDeleteGoal={handleDeleteGoal}
              onUpdateStatus={handleUpdateStatus}
              onOpenJournal={(goal) => {
                setSelectedGoalForJournal(goal);
                setIsJournalModalOpen(true);
              }}
            />
          ) : (
            renderAccessDenied('My Goal Planner')
          )
        ) : activeNav === 'goals-vision' ? (
          currentUser.accessGoals !== false && currentUser.accessVisionBoard !== false ? (
            <VisionBoardView
              goals={goals}
              onOpenJournal={(goal) => {
                setSelectedGoalForJournal(goal);
                setIsJournalModalOpen(true);
              }}
            />
          ) : (
            renderAccessDenied('Vision Board')
          )
        ) : null}
      </main>

      {/* Auth & Admin Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => setCurrentUser(user)}
      />

      {/* Reflection Journal Modal */}
      <JournalModal
        isOpen={isJournalModalOpen}
        onClose={() => {
          setIsJournalModalOpen(false);
          setSelectedGoalForJournal(null);
        }}
        goal={selectedGoalForJournal}
        onAddJournalEntry={handleAddJournalEntry}
      />

      {/* "How Are You Feeling Today" Pop-up Modal */}
      {isFeelingModalOpen && (
        <div className="feeling-modal-overlay">
          <div className="feeling-modal-card">
            <div className="feeling-modal-glow1"></div>
            <div className="feeling-modal-glow2"></div>
            
            <h2 className="feeling-title-rainbow">How are you feeling Today?</h2>
            
            {!selectedMood ? (
              <>
                <p className="feeling-desc">Select a mood to tune your energy for today's session!</p>
                <div className="mood-grid">
                  <button 
                    type="button"
                    onClick={() => setSelectedMood('Happy')}
                    className="mood-btn"
                    style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#78350f' }}
                  >
                    <span className="mood-emoji">😊</span>
                    <span className="mood-label">Happy</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedMood('Energized')}
                    className="mood-btn"
                    style={{ background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', color: '#0369a1' }}
                  >
                    <span className="mood-emoji">🚀</span>
                    <span className="mood-label">Energized</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedMood('Calm')}
                    className="mood-btn"
                    style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#15803d' }}
                  >
                    <span className="mood-emoji">🧘</span>
                    <span className="mood-label">Calm</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedMood('Tired')}
                    className="mood-btn"
                    style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', color: '#475569' }}
                  >
                    <span className="mood-emoji">😴</span>
                    <span className="mood-label">Tired</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedMood('Anxious')}
                    className="mood-btn"
                    style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#b91c1c' }}
                  >
                    <span className="mood-emoji">😟</span>
                    <span className="mood-label">Anxious</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedMood('Productive')}
                    className="mood-btn"
                    style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', color: '#6b21a8' }}
                  >
                    <span className="mood-emoji">💪</span>
                    <span className="mood-label">Productive</span>
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsFeelingModalOpen(false)}
                  className="btn-cancel"
                  style={{ width: '100%' }}
                >
                  Skip
                </button>
              </>
            ) : (
              <div className="mood-feedback-container">
                <span style={{ fontSize: '3rem', marginBottom: '14px', display: 'block' }}>
                  {selectedMood === 'Happy' && '✨'}
                  {selectedMood === 'Energized' && '🔥'}
                  {selectedMood === 'Calm' && '🌱'}
                  {selectedMood === 'Tired' && '💤'}
                  {selectedMood === 'Anxious' && '🫂'}
                  {selectedMood === 'Productive' && '🎯'}
                </span>
                
                <h3 className="feedback-text">
                  {selectedMood === 'Happy' && "Awesome! Positive vibes on lock!"}
                  {selectedMood === 'Energized' && "Incredible! Let's crush your goals!"}
                  {selectedMood === 'Calm' && "Mindfulness is power. Stay centered!"}
                  {selectedMood === 'Tired' && "It is okay to rest. Take things slow today."}
                  {selectedMood === 'Anxious' && "Take a deep breath. You are doing great."}
                  {selectedMood === 'Productive' && "Focus is set! Time to build positive momentum."}
                </h3>
                
                <p className="feedback-message">
                  {selectedMood === 'Happy' && "Your happiness compounds. Spread the energy!"}
                  {selectedMood === 'Energized' && "Harness this speed to complete your tasks!"}
                  {selectedMood === 'Calm' && "A peaceful mind does excellent work."}
                  {selectedMood === 'Tired' && "Focus on micro-progress or simple reflections."}
                  {selectedMood === 'Anxious' && "Evolve is your safe space. One step at a time."}
                  {selectedMood === 'Productive' && "Great work is built on small, consistent steps."}
                </p>
                
                <button 
                  type="button"
                  onClick={() => {
                    setIsFeelingModalOpen(false);
                    // Trigger confetti for high energy moods
                    if (['Happy', 'Energized', 'Productive'].includes(selectedMood)) {
                      confetti({
                        particleCount: 80,
                        spread: 60,
                        origin: { y: 0.6 }
                      });
                    }
                  }}
                  className="btn-save"
                  style={{ width: '100%' }}
                >
                  Let's Begin!
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Full-screen Login Component
interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    const isAdminEmail = cleanEmail === 'admin@liinexus.com' || cleanEmail === 'admin';
    const isAdminPassword = password === 'admin123' || password === 'admin';
    
    const isUserEmail = cleanEmail === 'alex@lifegoals.com' || cleanEmail === 'user';
    const isUserPassword = password === 'user123' || password === 'user';

    if (isAdminEmail && isAdminPassword) {
      onLogin(DEFAULT_ADMIN_USER);
      setError('');
    } else if (isUserEmail && isUserPassword) {
      onLogin(DEFAULT_REGULAR_USER);
      setError('');
    } else {
      setError('Invalid credentials. Please enter correct Email and Password.');
    }
  };

  return (
    <div className="login-fullscreen-container">
      <div className="login-glass-card">
        <div className="login-logo-circle">
          <ShieldCheck size={28} />
        </div>
        
        <h2 className="login-title-rainbow">Evolve Login Portal</h2>
        <p className="login-subtitle">Please enter your credentials to access your dashboard</p>

        <div className="login-cred-box">
          <div className="login-cred-title">
            <Key size={14} /> Demo Credentials
          </div>
          <div className="login-cred-line">
            Admin: <code>admin@liinexus.com</code> / <code>admin123</code>
          </div>
          <div className="login-cred-line">
            User: <code>alex@lifegoals.com</code> / <code>user123</code>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button 
            type="button" 
            className="login-instant-btn"
            style={{ margin: 0, fontSize: '0.8rem', padding: '10px 8px' }}
            onClick={() => {
              setEmail('admin@liinexus.com');
              setPassword('admin123');
            }}
          >
            <Zap size={14} /> Auto-fill Admin
          </button>
          <button 
            type="button" 
            className="login-instant-btn"
            style={{ margin: 0, fontSize: '0.8rem', padding: '10px 8px', background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
            onClick={() => {
              setEmail('alex@lifegoals.com');
              setPassword('user123');
            }}
          >
            <Zap size={14} /> Auto-fill User
          </button>
        </div>

        <div className="login-divider-or">Or Sign In Manually</div>

        {error && (
          <div className="login-error-alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="login-form-group">
            <label className="login-form-label">Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                type="email"
                required
                placeholder="admin@liinexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input-field"
              />
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-form-label">Password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input-field"
              />
            </div>
          </div>

          <button type="submit" className="login-submit-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
