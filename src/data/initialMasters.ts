import type { MasterItem } from '../types/goal';

export const INITIAL_MASTERS: MasterItem[] = [
  {
    id: 'master-1',
    title: 'Emotional Intelligence & Stoic Calm',
    category: 'Mindset & Mental Mastery',
    level: 'Master',
    progress: 85,
    description: 'Mastery over emotional triggers, maintaining unwavering clarity under pressure, and practicing daily gratitude.',
    keyPractices: [
      '10-minute morning mindfulness & breathwork',
      'Reframing negative thoughts into opportunities',
      'Daily journaling on personal emotional reactions'
    ],
    colorTheme: 'pink',
    updatedAt: '2026-08-10',
  },
  {
    id: 'master-2',
    title: 'Peak Physical Vitality & Fitness',
    category: 'Health & Physical Mastery',
    level: 'Practitioner',
    progress: 70,
    description: 'Optimizing circadian rhythm, strength training 4x/week, and maintaining clean nutrient-dense fuel.',
    keyPractices: [
      'Consistent 10,000 steps daily movement',
      'Hydration routine with electrolytes',
      '7.5+ hours of restorative sleep per night'
    ],
    colorTheme: 'green',
    updatedAt: '2026-08-11',
  },
  {
    id: 'master-3',
    title: 'Software Engineering & AI System Design',
    category: 'Skill & Career Mastery',
    level: 'Grandmaster',
    progress: 92,
    description: 'Building high-performance agentic AI applications, scalable microservices, and modern user interfaces.',
    keyPractices: [
      'Building 1 real-world production module weekly',
      'Reading system design paper breakdowns',
      'Refactoring complex code for modular simplicity'
    ],
    colorTheme: 'yellow',
    updatedAt: '2026-08-09',
  },
  {
    id: 'master-4',
    title: 'Financial Independence & Asset Allocation',
    category: 'Financial Freedom Mastery',
    level: 'Master',
    progress: 80,
    description: 'Disciplined capital growth, index fund compounding, asset diversification, and cash flow optimization.',
    keyPractices: [
      'Automating 40% income savings allocation',
      'Monthly net worth & portfolio audit',
      'Continuous learning in investment strategy'
    ],
    colorTheme: 'green',
    updatedAt: '2026-08-08',
  },
  {
    id: 'master-5',
    title: 'Deep Work & Atomic Habit Consistency',
    category: 'Habit & Discipline Mastery',
    level: 'Practitioner',
    progress: 78,
    description: 'Eliminating digital distractions, working in focused 90-minute blocks, and maintaining non-negotiable streaks.',
    keyPractices: [
      'No phone notifications during deep focus blocks',
      'Strict shutdown ritual at end of workday',
      'Habit stacking for seamless morning routines'
    ],
    colorTheme: 'pink',
    updatedAt: '2026-08-11',
  },
  {
    id: 'master-6',
    title: 'Charismatic Communication & Leadership',
    category: 'Skill & Career Mastery',
    level: 'Apprentice',
    progress: 55,
    description: 'Articulating ideas with precision, active empathetic listening, and inspiring teams toward shared vision.',
    keyPractices: [
      'Practicing active listening without interrupting',
      'Delivering weekly presentations or tech talks',
      'Studying influential speech dynamics'
    ],
    colorTheme: 'yellow',
    updatedAt: '2026-08-07',
  },
];
