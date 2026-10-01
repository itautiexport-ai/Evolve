import React, { useState, useEffect } from 'react';
import type { Goal, MasterItem, User, JournalEntry } from './types/goal';
import type { Habit } from './types/habit';
import { authApi, goalsApi, habitsApi, mastersApi, setAuthToken, clearAuthToken } from './services/api';
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
import { ManifestationView } from './components/ManifestationView';
import { MusicPlayerView } from './components/MusicPlayerView';
import { MyHabitTrackerView } from './components/MyHabitTrackerView';
import { AuthModal } from './components/AuthModal';
import { JournalModal } from './components/JournalModal';
import { HabitsDashboardView } from './components/HabitsDashboardView';
import { OverallDashboardView } from './components/OverallDashboardView';
import { ShieldAlert, Mail, Lock, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

// const MASTERS_STORAGE = 'evolve_masters_v3';
// const GOALS_STORAGE = 'evolve_goals_v3';
const USER_STORAGE = 'evolve_user_v3';
const USERS_STORAGE = 'evolve_users_v3';
// const HABITS_STORAGE = 'evolve_habits_v3';

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
  // NOTE: This is temporary local-only data. The "Manage Users" feature 
  // will be connected to the backend in a later phase.
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.filter((u: User) => u.id !== 'USER-002');
      } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'CRM0001',
        name: 'Admin ID',
        email: 'admin@evolve.local',
        role: 'ADMIN',
        joinedDate: new Date().toISOString().split('T')[0],
      }
    ];
  });

  // Sync Users to LocalStorage
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE, JSON.stringify(users));
  }, [users]);

  // Masters List (loaded from API after login)
  const [masters, setMasters] = useState<MasterItem[]>([]);

  // Goals List (loaded from API after login)
  const [goals, setGoals] = useState<Goal[]>([]);

  // Habits List (loaded from API after login)
  const [habits, setHabits] = useState<Habit[]>([]);

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Goal CRUD / Interactive states
  const [selectedGoalForJournal, setSelectedGoalForJournal] = useState<Goal | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);

  // Goal Save Handler (handles both Create and Update)
  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    try {
      if (goalData.id) {
        // Edit mode
        const updated = await goalsApi.update(goalData.id, goalData);
        setGoals(prev => prev.map(g => g.id === goalData.id ? { ...g, ...updated } as Goal : g));
      } else {
        // Add mode
        const newGoalData = {
          ...goalData,
          status: goalData.status || 'active',
          isPinned: false,
          progress: goalData.progress || 0,
        };
        const created = await goalsApi.create(newGoalData);
        setGoals(prev => [...prev, { ...created, milestones: [], journalEntries: [] } as Goal]);
      }
    } catch (err) {
      console.error("Failed to save goal:", err);
    }
  };

  // Goal Delete Handler
  const handleDeleteGoal = async (id: string) => {
    try {
      await goalsApi.delete(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };



  // Update Goal Status directly
  const handleUpdateStatus = async (goalId: string, newStatus: Goal['status']) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    try {
      await goalsApi.update(goalId, { ...goal, status: newStatus });
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: newStatus } : g));
    } catch (err) {
      console.error("Failed to update goal status:", err);
    }
  };

  // Add Reflection Journal Entry to Goal
  const handleAddJournalEntry = async (goalId: string, entry: Omit<JournalEntry, 'id'>) => {
    try {
      const created = await goalsApi.addJournalEntry(goalId, entry.content, entry.mood, entry.date);
      const newEntry: JournalEntry = { ...entry, id: created.id };
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g;
        const currentEntries = g.journalEntries || [];
        return {
          ...g,
          journalEntries: [...currentEntries, newEntry]
        };
      }));
      setSelectedGoalForJournal(prev => {
        if (!prev || prev.id !== goalId) return prev;
        return {
          ...prev,
          journalEntries: [...(prev.journalEntries || []), newEntry]
        };
      });
    } catch (err) {
      console.error("Failed to add journal entry:", err);
    }
  };

  // Habit Event Handlers
  const handleToggleHabit = async (habitId: string, dateStr: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const isCurrentlyDone = !!habit.history[dateStr];
    const newHistory = { ...habit.history };
    if (isCurrentlyDone) {
      delete newHistory[dateStr];
    } else {
      newHistory[dateStr] = true;
    }
    const currentStreak = calculateStreak(newHistory, habit.frequency);
    const bestStreak = Math.max(habit.bestStreak || 0, currentStreak);

    try {
      await habitsApi.setHistory(habitId, dateStr, !isCurrentlyDone);
      await habitsApi.update(habitId, { ...habit, streak: currentStreak, bestStreak });
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        return { ...h, history: newHistory, streak: currentStreak, bestStreak };
      }));
    } catch (err) {
      console.error("Failed to toggle habit:", err);
    }
  };

  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    try {
      if (habitData.id) {
        const updated = await habitsApi.update(habitData.id, habitData);
        setHabits(prev => prev.map(h => h.id === habitData.id ? { ...h, ...updated } as Habit : h));
      } else {
        const newHabitData = {
          name: habitData.name || '',
          description: habitData.description || '',
          category: habitData.category || 'Health & Fitness',
          frequency: habitData.frequency || 'daily',
          streak: 0,
          bestStreak: 0,
        };
        const created = await habitsApi.create(newHabitData);
        setHabits(prev => [...prev, { ...created, history: {} } as Habit]);
      }
    } catch (err) {
      console.error("Failed to save habit:", err);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await habitsApi.delete(id);
      setHabits(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error("Failed to delete habit:", err);
    }
  };

  const handleLogout = () => {
    if (currentUser && currentUser.id) {
      sessionStorage.removeItem(`evolve_feeling_asked_${currentUser.id}`);
    }
    localStorage.removeItem(USER_STORAGE);
    clearAuthToken();
    setCurrentUser(null);
    setActiveNav('home');
  };

  // Cache logged-in user's session info locally (not sensitive - just 
  // profile info for convenience, actual data always comes from the API)
  useEffect(() => {
    localStorage.setItem(USER_STORAGE, JSON.stringify(currentUser));
  }, [currentUser]);

  // Fetch this user's goals, habits, and masters from the backend 
  // whenever they log in (or the app loads with an existing session)
  useEffect(() => {
    if (!currentUser) {
      setGoals([]);
      setHabits([]);
      setMasters([]);
      return;
    }

    const loadData = async () => {
      try {
        const [fetchedGoals, fetchedHabits, fetchedMasters] = await Promise.all([
          goalsApi.getAll(),
          habitsApi.getAll(),
          mastersApi.getAll(),
        ]);
        setGoals(fetchedGoals);
        setHabits(fetchedHabits);
        setMasters(fetchedMasters);
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    };

    loadData();
  }, [currentUser]);

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
            renderAccessDenied('Create Vision Board')
          )
        ) : activeNav === 'manifestation-poster' ? (
          currentUser.accessVisionBoard !== false ? (
            <ManifestationView />
          ) : (
            renderAccessDenied('Manifestation')
          )
        ) : null}
      </main>

      {/* Auth & Admin Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
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
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedVisionBoard, setSavedVisionBoard] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('evolve_vision_board_v3');
    if (saved) {
      try {
        setSavedVisionBoard(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved vision board:", e);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      setAuthToken(result.token);
      onLogin(result.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.signup(name, email, password);
      const result = await authApi.login(email, password);
      setAuthToken(result.token);
      onLogin(result.user);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderLoginFormCard = () => (
    <div className="login-glass-card">
      <div className="login-logo-circle">
        <ShieldCheck size={28} />
      </div>

      <h2 className="login-title-rainbow">
        {mode === 'login' ? 'Evolve Login Portal' : 'Create Your Evolve Account'}
      </h2>
      <p className="login-subtitle">
        {mode === 'login'
          ? 'Please enter your credentials to access your dashboard'
          : 'Sign up to start tracking your goals and habits'}
      </p>

      {error && (
        <div className="login-error-alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup}>
        {mode === 'signup' && (
          <div className="login-form-group">
            <label className="login-form-label">Full Name</label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                type="text"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="login-input-field"
              />
            </div>
          </div>
        )}

        <div className="login-form-group">
          <label className="login-form-label">Email Address</label>
          <div className="login-input-wrapper">
            <Mail size={16} className="login-input-icon" />
            <input
              type="email"
              required
              placeholder="you@example.com"
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
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input-field"
            />
          </div>
        </div>

        <button type="submit" className="login-submit-btn" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="login-divider-or" style={{ marginTop: '16px', cursor: 'pointer' }}>
        <span
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </span>
      </div>
    </div>
  );

  const CATEGORIES_KEYS = [
    { key: 'spirituality', label: 'Spirituality' },
    { key: 'finances', label: 'Money & Finances' },
    { key: 'career', label: 'Career & Work' },
    { key: 'health', label: 'Health & Fitness' },
    { key: 'recreation', label: 'Fun & Recreation' },
    { key: 'environment', label: 'Environment' },
    { key: 'community', label: 'Community' },
    { key: 'family', label: 'Family & Friends' },
    { key: 'love', label: 'Partner & Love' },
    { key: 'growth', label: 'Personal Growth & Learning' }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="login-fullscreen-container">
      {savedVisionBoard ? (
        <div className="login-split-container animate-scale-up">
          {/* Left Pinned Board side */}
          <div className="login-pinned-board-side">
            <h2 className="login-pinned-board-title">✨ MY {currentYear} VISION BOARD ✨</h2>
            <div className="login-pinned-grid" style={{ marginTop: '16px' }}>
              {CATEGORIES_KEYS.map((cat) => {
                const data = savedVisionBoard[cat.key];
                if (!data) return null;
                return (
                  <div key={cat.key} className="login-pinned-polaroid">
                    <img 
                      src={data.imageUrl} 
                      alt={cat.label} 
                      className="login-pinned-polaroid-img" 
                    />
                    <div className="login-pinned-polaroid-category">{cat.label}</div>
                    <div className="login-pinned-polaroid-text">"{data.aspiration}"</div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Right Glass Card Login form */}
          <div className="login-glass-card-side">
            {renderLoginFormCard()}
          </div>
        </div>
      ) : (
        renderLoginFormCard()
      )}
    </div>
  );
};

export default App;
