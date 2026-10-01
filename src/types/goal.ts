export type Category = 
  | 'Spirituality'
  | 'Money & Finances'
  | 'Career & Work'
  | 'Health & Fitness'
  | 'Fun & Recreation'
  | 'Environment'
  | 'Community'
  | 'Family & Friends'
  | 'Partner & Love'
  | 'Personal Growth & Learning';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Status = 'not-started' | 'in-progress' | 'completed' | 'on-hold' | 'active';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood: '🔥 Empowered' | '🎯 Focused' | '🌱 Growing' | '🏆 Proud' | '⚡ Energized';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  targetDate: string;
  createdAt: string;
  progress: number; // 0 - 100
  targetValue?: number;
  currentValue?: number;
  unit?: string; // e.g., "$", "kg", "books", "countries"
  imageUrl?: string;
  milestones: Milestone[];
  journalEntries: JournalEntry[];
  tags: string[];
  isPinned?: boolean;
  reward?: string;
  purpose?: string;
  successCriteria?: string;
  requirements?: string;
  challenges?: string;
}

export interface FilterOptions {
  category: string;
  status: string;
  priority: string;
  searchQuery: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  joinedDate: string;
  vibeName?: string;
  password?: string;
  accessMasters?: boolean;
  accessGoals?: boolean;
  accessAdmin?: boolean;
  accessGratitude?: boolean;
  accessMusic?: boolean;
  accessHabits?: boolean;
  accessGoalPlanner?: boolean;
  accessVisionBoard?: boolean;
  accessHabitsDashboard?: boolean;
  accessOverallDashboard?: boolean;
}

export interface AdminLogEntry {
  id: string;
  timestamp: string;
  action: string;
  adminId: string;
  details: string;
}

export type MasterCategory = 
  | 'Mindset & Mental Mastery'
  | 'Health & Physical Mastery'
  | 'Skill & Career Mastery'
  | 'Financial Freedom Mastery'
  | 'Habit & Discipline Mastery';

export interface MasterItem {
  id: string;
  title: string;
  category: MasterCategory;
  level: 'Apprentice' | 'Practitioner' | 'Master' | 'Grandmaster';
  progress: number; // 0 - 100
  description: string;
  keyPractices: string[];
  colorTheme: 'green' | 'yellow' | 'pink';
  icon?: string;
  updatedAt: string;
}


