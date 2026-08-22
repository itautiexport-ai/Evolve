import type { User, AdminLogEntry } from '../types/goal';

export const DEFAULT_ADMIN_USER: User = {
  id: 'ADMIN-001',
  name: 'System Administrator',
  email: 'admin@liinexus.com',
  role: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  joinedDate: '2025-01-01',
};

export const DEFAULT_REGULAR_USER: User = {
  id: 'USER-002',
  name: 'Alex Rivera',
  email: 'alex@lifegoals.com',
  role: 'USER',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
  joinedDate: '2025-02-15',
};

export const INITIAL_ADMIN_LOGS: AdminLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-11 10:30:00',
    action: 'SYSTEM_INIT',
    adminId: 'ADMIN-001',
    details: 'LifeGoals platform initialized with Admin ID ADMIN-001.',
  },
  {
    id: 'log-2',
    timestamp: '2026-08-11 11:15:22',
    action: 'SECURITY_CHECK',
    adminId: 'ADMIN-001',
    details: 'Admin privileges verified for admin@lifegoals.com.',
  },
];
