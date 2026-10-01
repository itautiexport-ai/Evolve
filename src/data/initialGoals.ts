import type { Goal } from '../types/goal';

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'Achieve Financial Freedom & Investment Portfolio',
    description: 'Build a diversified passive income portfolio across stocks, index funds, and real estate assets.',
    category: 'Money & Finances',
    priority: 'critical',
    status: 'in-progress',
    targetDate: '2027-12-31',
    createdAt: '2026-01-15',
    progress: 45,
    targetValue: 100000,
    currentValue: 45000,
    unit: '$',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    isPinned: true,
    tags: ['Wealth', 'Investments', 'Independence'],
    milestones: [
      { id: 'm1', title: 'Emergency fund of 6 months expenses', completed: true },
      { id: 'm2', title: 'Automate monthly index fund contributions ($2,000/mo)', completed: true },
      { id: 'm3', title: 'Reach $50,000 portfolio milestone', completed: false },
      { id: 'm4', title: 'Acquire first rental investment property', completed: false },
    ],
    journalEntries: [
      {
        id: 'j1',
        date: '2026-06-20',
        content: 'Hit $45k total portfolio milestone! Rebalanced crypto and index fund allocation.',
        mood: '🔥 Empowered'
      }
    ]
  },
  {
    id: 'goal-2',
    title: 'Run a Full Marathon (42.2 km)',
    description: 'Transform physical endurance and discipline by training systematically to complete a full marathon under 4 hours.',
    category: 'Health & Fitness',
    priority: 'high',
    status: 'in-progress',
    targetDate: '2026-11-15',
    createdAt: '2026-02-01',
    progress: 60,
    targetValue: 42,
    currentValue: 25,
    unit: 'km',
    imageUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80',
    isPinned: true,
    tags: ['Fitness', 'Endurance', 'Marathon'],
    milestones: [
      { id: 'm5', title: 'Run a continuous 10km without stopping', completed: true },
      { id: 'm6', title: 'Complete Half Marathon (21km) in official race', completed: true },
      { id: 'm7', title: 'Complete 30km long weekend training run', completed: false },
      { id: 'm8', title: 'Cross the official Marathon finish line', completed: false },
    ],
    journalEntries: [
      {
        id: 'j2',
        date: '2026-07-12',
        content: 'Completed 25km Sunday run in 2h 15m. Felt strong towards the last 5k!',
        mood: '⚡ Energized'
      }
    ]
  },
  {
    id: 'goal-3',
    title: 'Publish Tech Book & Launch SaaS Product',
    description: 'Author a comprehensive guide on modern software engineering architecture while building an AI-powered SaaS companion tool.',
    category: 'Career & Work',
    priority: 'high',
    status: 'in-progress',
    targetDate: '2026-12-01',
    createdAt: '2026-03-10',
    progress: 30,
    targetValue: 10,
    currentValue: 3,
    unit: 'chapters',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    isPinned: false,
    tags: ['Writing', 'SaaS', 'Engineering'],
    milestones: [
      { id: 'm9', title: 'Finalize book outline & sample chapter draft', completed: true },
      { id: 'm10', title: 'Build MVP core features of SaaS app', completed: true },
      { id: 'm11', title: 'Write chapters 4 through 8', completed: false },
      { id: 'm12', title: 'Launch ProductHunt & Book pre-orders', completed: false },
    ],
    journalEntries: []
  },
  {
    id: 'goal-4',
    title: 'Explore Northern Lights in Iceland & Japan Cherry Blossoms',
    description: 'Experience world wonders: view Aurora Borealis from a glass igloo in Iceland and witness Sakura season in Kyoto.',
    category: 'Fun & Recreation',
    priority: 'medium',
    status: 'not-started',
    targetDate: '2027-04-15',
    createdAt: '2026-04-01',
    progress: 10,
    targetValue: 2,
    currentValue: 0,
    unit: 'trips',
    imageUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80',
    isPinned: false,
    tags: ['Travel', 'BucketList', 'Japan', 'Iceland'],
    milestones: [
      { id: 'm13', title: 'Set up dedicated Travel Savings Account', completed: true },
      { id: 'm14', title: 'Book Tokyo & Kyoto spring flight tickets', completed: false },
      { id: 'm15', title: 'Book Iceland aurora tour & glass igloo', completed: false },
    ],
    journalEntries: []
  },
  {
    id: 'goal-5',
    title: 'Master Mindful Daily Meditation & Read 24 Books',
    description: 'Cultivate mental clarity, emotional resilience, and deep knowledge by reading 2 books per month and practicing 15min daily meditation.',
    category: 'Personal Growth & Learning',
    priority: 'medium',
    status: 'in-progress',
    targetDate: '2026-12-31',
    createdAt: '2026-01-01',
    progress: 70,
    targetValue: 24,
    currentValue: 17,
    unit: 'books',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    isPinned: false,
    tags: ['Mindfulness', 'Reading', 'Habits'],
    milestones: [
      { id: 'm16', title: 'Read 10 books in H1', completed: true },
      { id: 'm17', title: 'Complete 30-day streak of Headspace meditation', completed: true },
      { id: 'm18', title: 'Reach 20 books milestone', completed: false },
      { id: 'm19', title: 'Finish 24 books challenge', completed: false },
    ],
    journalEntries: [
      {
        id: 'j3',
        date: '2026-08-01',
        content: 'Finished reading "Atomic Habits" for the 2nd time. Implementing the habit stacking rule!',
        mood: '🌱 Growing'
      }
    ]
  }
];

export const CATEGORIES_WITH_META = [
  { name: 'Spirituality', icon: 'Sparkles', color: '#a78bfa', gradient: 'from-violet-300 to-purple-400' },
  { name: 'Money & Finances', icon: 'DollarSign', color: '#facc15', gradient: 'from-amber-300 to-yellow-400' },
  { name: 'Career & Work', icon: 'Briefcase', color: '#3b82f6', gradient: 'from-blue-300 to-blue-400' },
  { name: 'Health & Fitness', icon: 'Activity', color: '#ef4444', gradient: 'from-red-300 to-red-400' },
  { name: 'Fun & Recreation', icon: 'Compass', color: '#f97316', gradient: 'from-orange-300 to-orange-400' },
  { name: 'Environment', icon: 'Home', color: '#10b981', gradient: 'from-green-300 to-emerald-400' },
  { name: 'Community', icon: 'Globe', color: '#06b6d4', gradient: 'from-cyan-300 to-sky-400' },
  { name: 'Family & Friends', icon: 'Users', color: '#ec4899', gradient: 'from-pink-300 to-rose-400' },
  { name: 'Partner & Love', icon: 'Heart', color: '#f43f5e', gradient: 'from-rose-300 to-pink-400' },
  { name: 'Personal Growth & Learning', icon: 'BookOpen', color: '#8b5cf6', gradient: 'from-violet-300 to-purple-400' },
];

export const MOTIVATIONAL_QUOTES = [
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { quote: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" }
];
