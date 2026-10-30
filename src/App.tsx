import React, { useState, useEffect } from 'react';
import type { Goal, MasterItem, User, JournalEntry } from './types/goal';
import type { Habit } from './types/habit';
import { authApi, goalsApi, habitsApi, mastersApi, adminApi, preferencesApi, onSessionExpired, clearAuthToken } from './services/api';
import { DEFAULT_ADMIN_USER } from './data/authData';
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
import { LoginForm } from './components/LoginForm';
import { JournalModal } from './components/JournalModal';
import { HabitsDashboardView } from './components/HabitsDashboardView';
import { OverallDashboardView } from './components/OverallDashboardView';
import { ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

// const MASTERS_STORAGE = 'evolve_masters_v3';
// const GOALS_STORAGE = 'evolve_goals_v3';
const USER_STORAGE = 'evolve_user_v3';
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

  // Local data import state
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [isImportingLocal, setIsImportingLocal] = useState(false);

  // Authenticate and validate session on initial mount
  useEffect(() => {
    authApi.getMe()
      .then(res => {
        if (res?.user) {
          setCurrentUser(res.user);
        }
      })
      .catch(() => {
        clearAuthToken();
        localStorage.removeItem(USER_STORAGE);
        setCurrentUser(null);
      });

    const unsubscribe = onSessionExpired(() => {
      setCurrentUser(null);
      clearAuthToken();
      localStorage.removeItem(USER_STORAGE);
      setGoals([]);
      setHabits([]);
      setMasters([]);
    });

    return () => unsubscribe();
  }, []);

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

  // Users List (Defaults to local storage or fallback, and synced via adminApi for administrators)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('evolve_users_v3');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return parsed.filter((u: User) => u.id !== 'USER-002').map((u: User) => ({
          ...u,
          status: u.status || 'approved',
        }));
      } catch (e) { console.error(e); }
    }
    return [
      { ...DEFAULT_ADMIN_USER, name: 'Admin ID', id: 'CRM0001', status: 'approved' }
    ];
  });

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      adminApi.getUsers()
        .then(res => {
          if (Array.isArray(res)) setUsers(res);
        })
        .catch(err => console.warn("Failed to load users for admin:", err));
    }
  }, [currentUser]);

  // Check for legacy local data
  useEffect(() => {
    if (!currentUser) return;
    const localGoals = localStorage.getItem('evolve_goals_v3');
    const localHabits = localStorage.getItem('evolve_habits_v3');
    const localMasters = localStorage.getItem('evolve_masters_v3');
    if (localGoals || localHabits || localMasters) {
      setHasLegacyData(true);
    }
  }, [currentUser]);

  const handleImportAllLegacyData = async () => {
    setIsImportingLocal(true);
    try {
      const localGoals = localStorage.getItem('evolve_goals_v3');
      if (localGoals) {
        const parsed = JSON.parse(localGoals);
        for (const g of parsed) {
          await goalsApi.create(g);
        }
        localStorage.removeItem('evolve_goals_v3');
      }

      const localHabits = localStorage.getItem('evolve_habits_v3');
      if (localHabits) {
        const parsed = JSON.parse(localHabits);
        for (const h of parsed) {
          await habitsApi.create(h);
        }
        localStorage.removeItem('evolve_habits_v3');
      }

      const localMasters = localStorage.getItem('evolve_masters_v3');
      if (localMasters) {
        const parsed = JSON.parse(localMasters);
        for (const m of parsed) {
          await mastersApi.create(m);
        }
        localStorage.removeItem('evolve_masters_v3');
      }

      const [newGoals, newHabits, newMasters] = await Promise.all([
        goalsApi.getAll(),
        habitsApi.getAll(),
        mastersApi.getAll(),
      ]);
      setGoals(newGoals);
      setHabits(newHabits);
      setMasters(newMasters);
      setHasLegacyData(false);
      confetti({ particleCount: 80, spread: 60 });
    } catch (err) {
      console.error("Failed to import legacy data:", err);
    } finally {
      setIsImportingLocal(false);
    }
  };

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

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("Logout API call error:", err);
    }
    if (currentUser && currentUser.id) {
      sessionStorage.removeItem(`evolve_feeling_asked_${currentUser.id}`);
    }
    localStorage.removeItem(USER_STORAGE);
    clearAuthToken();
    setCurrentUser(null);
    setGoals([]);
    setHabits([]);
    setMasters([]);
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
        const [fetchedGoals, fetchedHabits, fetchedMasters, prefRes] = await Promise.all([
          goalsApi.getAll(),
          habitsApi.getAll(),
          mastersApi.getAll(),
          preferencesApi.get().catch(() => ({ preferences: {} })),
        ]);
        setGoals(fetchedGoals);
        setHabits(fetchedHabits);
        setMasters(fetchedMasters);
        if (prefRes?.preferences?.activeNav) {
          setActiveNav(prefRes.preferences.activeNav);
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    };

    loadData();
  }, [currentUser]);

  // Sync active navigation preference to user preferences
  useEffect(() => {
    if (currentUser) {
      preferencesApi.save({ activeNav }).catch(() => {});
    }
  }, [activeNav, currentUser]);

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
      <LoginForm 
        users={users}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem(USER_STORAGE, JSON.stringify(user));
        }}
        onRegisterUser={(newUser) => {
          setUsers(prev => [...prev, newUser]);
        }}
      />
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

        {/* Legacy Local Data Import Prompt Banner */}
        {hasLegacyData && (
          <div className="mx-6 mt-4 p-4 rounded-xl flex items-center justify-between border" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#92400e' }}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>💾</span>
              <span>We detected offline data stored in your browser from a previous session. Would you like to migrate it to your cloud account?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImportAllLegacyData}
                disabled={isImportingLocal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition"
              >
                {isImportingLocal ? "Importing..." : "Import to Cloud"}
              </button>
              <button
                onClick={() => setHasLegacyData(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-200 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

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
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem(USER_STORAGE, JSON.stringify(user));
        }}
        users={users}
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

export default App;
