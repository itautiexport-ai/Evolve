export type HabitCategory =
  | 'Health & Fitness'
  | 'Productivity'
  | 'Personal Growth'
  | 'Mindfulness & Wellbeing'
  | 'Relationships'
  | 'Financial';

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
