export type HabitCategory =
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

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: HabitCategory;
  streak: number;
  bestStreak: number;
  history: { [dateStr: string]: boolean }; // e.g. { "2026-08-14": true }
  createdAt: string;
}
