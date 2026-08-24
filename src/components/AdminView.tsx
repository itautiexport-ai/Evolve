import React, { useState } from 'react';
import type { Goal, User, AdminLogEntry } from '../types/goal';
import { INITIAL_ADMIN_LOGS, DEFAULT_ADMIN_USER, DEFAULT_REGULAR_USER } from '../data/authData';
import { INITIAL_GOALS } from '../data/initialGoals';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Trash2, 
  Download, 
  RotateCcw, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  PlusCircle,
  FileText,
  Key
} from 'lucide-react';

interface AdminViewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  defaultTab?: 'overview' | 'goals' | 'users' | 'logs';
}

export const AdminView: React.FC<AdminViewProps> = ({
  goals,
  setGoals,
  currentUser,
  onSwitchUser,
  defaultTab,
}) => {
  const [adminLogs, setAdminLogs] = useState<AdminLogEntry[]>(INITIAL_ADMIN_LOGS);
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'goals' | 'users' | 'logs'>(defaultTab || 'overview');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const addLog = (action: string, details: string) => {
    const newLog: AdminLogEntry = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      adminId: currentUser.id,
      details,
    };
    setAdminLogs(prev => [newLog, ...prev]);
  };

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetToSeedData = () => {
    if (window.confirm('ADMIN ACTION: Are you sure you want to reset all goals to the default system seed data?')) {
      setGoals(INITIAL_GOALS);
      addLog('DATA_RESET', 'Reset system goals database to default 12 initial life goals.');
      showNotification('System database successfully reset to seed data!');
    }
  };

  const handleClearAllGoals = () => {
    if (window.confirm('ADMIN DANGER ACTION: Delete ALL goals in system? This cannot be undone.')) {
      setGoals([]);
      addLog('DATA_PURGED', 'Admin purged all goals from the system storage.');
      showNotification('All goals deleted by Admin.');
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(goals, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `lifegoals_admin_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addLog('BACKUP_EXPORTED', `Exported system backup JSON containing ${goals.length} goals.`);
    showNotification('System data exported successfully!');
  };

  const handleQuickAddAdminGoal = () => {
    const adminGoal: Goal = {
      id: 'admin-goal-' + Date.now(),
      title: '👑 Admin Priority: Launch Enterprise Portal',
      description: 'System Admin goal added via Admin Control Dashboard.',
      category: 'Career & Work',
      priority: 'critical',
      status: 'in-progress',
      targetDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      progress: 50,
      targetValue: 100,
      currentValue: 50,
      unit: '%',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      milestones: [
        { id: 'm1', title: 'Verify Admin ID Authentication', completed: true },
        { id: 'm2', title: 'Configure System Permissions', completed: true },
        { id: 'm3', title: 'Deploy Global Control Panel', completed: false }
      ],
      journalEntries: [
        {
          id: 'j1',
          date: new Date().toISOString().split('T')[0],
          content: 'Admin ID verification and privileges activated successfully.',
          mood: '🔥 Empowered'
        }
      ],
      tags: ['Admin', 'System', 'Priority'],
      isPinned: true
    };

    setGoals(prev => [adminGoal, ...prev]);
    addLog('GOAL_CREATED', 'Admin created top priority goal: Launch Enterprise Portal');
    showNotification('New Admin Priority Goal created and pinned!');
  };

  // Calculations
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const criticalCount = goals.filter(g => g.priority === 'critical').length;
  const storageBytes = new Blob([JSON.stringify(goals)]).size;
  const storageKB = (storageBytes / 1024).toFixed(2);

  return (
    <div className="admin-container">
      {/* Status Alert Banner */}
      {statusMessage && (
        <div className="admin-notification-toast">
          <CheckCircle size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Admin Hero Badge Header */}
      <div className="admin-header-card glass-card mb-4">
        <div className="admin-hero-info">
          <div className="admin-avatar-wrapper">
            <img src={currentUser.avatar} alt="Admin" className="admin-hero-avatar" />
            <span className="admin-badge-icon" title="Super Admin"><ShieldCheck size={16} /></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="admin-title text-main">System Admin Control Center</h2>
              <span className="admin-pill-tag">Role: {currentUser.role}</span>
            </div>
            <p className="admin-subtitle">
              Logged in as <strong>{currentUser.name}</strong> • Admin ID: <code>{currentUser.id}</code> • <code>{currentUser.email}</code>
            </p>
          </div>
        </div>

        <div className="admin-quick-actions">
          <button onClick={handleExportBackup} className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <Download size={15} /> Export Backup
          </button>
          <button onClick={handleResetToSeedData} className="btn btn-secondary btn-sm flex items-center gap-1.5">
            <RotateCcw size={15} /> Reset Seed Data
          </button>
          <button onClick={handleQuickAddAdminGoal} className="btn btn-accent btn-sm flex items-center gap-1.5">
            <PlusCircle size={15} /> Add Admin Goal
          </button>
        </div>
      </div>

      {/* Admin Navigation Sub-tabs */}
      <div className="admin-nav-tabs glass-card mb-4">
        <button
          className={`admin-tab-btn ${activeAdminTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('overview')}
        >
          <Activity size={16} /> System Overview
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('goals')}
        >
          <Database size={16} /> Global Goals ({goals.length})
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('users')}
        >
          <Users size={16} /> User Roles & Accounts
        </button>
        <button
          className={`admin-tab-btn ${activeAdminTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('logs')}
        >
          <FileText size={16} /> Audit Logs ({adminLogs.length})
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="admin-grid-2">
          {/* Key Admin Metrics */}
          <div className="admin-metric-card glass-card">
            <div className="metric-icon-box blue">
              <Database size={24} />
            </div>
            <div>
              <div className="text-xs text-secondary font-medium">Total Database Goals</div>
              <div className="text-2xl font-bold text-main">{goals.length}</div>
              <div className="text-xs text-accent mt-1">{completedCount} Completed ({goals.length > 0 ? Math.round((completedCount/goals.length)*100) : 0}%)</div>
            </div>
          </div>

          <div className="admin-metric-card glass-card">
            <div className="metric-icon-box purple">
              <Key size={24} />
            </div>
            <div>
              <div className="text-xs text-secondary font-medium">Active Admin Account</div>
              <div className="text-lg font-bold text-main">admin@lifegoals.com</div>
              <div className="text-xs text-accent mt-1">ID: ADMIN-001 (SuperAdmin)</div>
            </div>
          </div>

          <div className="admin-metric-card glass-card">
            <div className="metric-icon-box orange">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-xs text-secondary font-medium">Critical Focus Goals</div>
              <div className="text-2xl font-bold text-main">{criticalCount}</div>
              <div className="text-xs text-secondary mt-1">Requires immediate milestone tracking</div>
            </div>
          </div>

          <div className="admin-metric-card glass-card">
            <div className="metric-icon-box green">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-xs text-secondary font-medium">Local Database Storage</div>
              <div className="text-2xl font-bold text-main">{storageKB} KB</div>
              <div className="text-xs text-green mt-1">JSON Cache Healthy</div>
            </div>
          </div>

          {/* Quick Management Panel */}
          <div className="glass-card span-2 p-4">
            <h3 className="text-base font-bold text-main mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-accent" /> System Admin Control Operations
            </h3>
            <p className="text-xs text-secondary mb-4">
              As an authenticated System Administrator, you have full control over data seeding, database backups, and goal moderation.
            </p>

            <div className="admin-action-buttons-row">
              <button onClick={handleExportBackup} className="btn btn-secondary flex items-center gap-2">
                <Download size={16} /> Download Full Data Backup (.json)
              </button>

              <button onClick={handleResetToSeedData} className="btn btn-secondary flex items-center gap-2">
                <RotateCcw size={16} /> Restore Demo Goals (12 Seeds)
              </button>

              <button onClick={handleClearAllGoals} className="btn btn-danger flex items-center gap-2">
                <Trash2 size={16} /> Purge All Database Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL GOALS TABLE */}
      {activeAdminTab === 'goals' && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-main">Global Goal Database</h3>
            <span className="text-xs text-secondary">{goals.length} records active</span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {goals.map(g => (
                  <tr key={g.id}>
                    <td><code>{g.id}</code></td>
                    <td className="font-semibold">{g.title}</td>
                    <td><span className="badge-cat">{g.category}</span></td>
                    <td>
                      <span className={`badge-priority ${g.priority}`}>
                        {g.priority}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="cat-progress-bg min-w-16">
                          <div className="cat-progress-fill bg-accent" style={{ width: `${g.progress}%` }} />
                        </div>
                        <span className="text-xs">{g.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setGoals(prev => prev.filter(item => item.id !== g.id));
                          addLog('GOAL_DELETED', `Deleted goal ${g.id}: ${g.title}`);
                        }}
                        className="icon-btn-danger text-xs p-1"
                        title="Delete Goal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER ROLES */}
      {activeAdminTab === 'users' && (
        <div className="glass-card p-4">
          <h3 className="text-base font-bold text-main mb-3">System Accounts & Permission Roles</h3>

          <div className="user-cards-grid">
            {/* Admin User Card */}
            <div className={`user-role-card ${currentUser.id === DEFAULT_ADMIN_USER.id ? 'active' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <img src={DEFAULT_ADMIN_USER.avatar} alt="Admin" className="user-avatar-md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-main">{DEFAULT_ADMIN_USER.name}</span>
                    <span className="role-badge admin">👑 ADMIN</span>
                  </div>
                  <div className="text-xs text-secondary">{DEFAULT_ADMIN_USER.email}</div>
                  <div className="text-xs text-accent">ID: {DEFAULT_ADMIN_USER.id}</div>
                </div>
              </div>

              {currentUser.id === DEFAULT_ADMIN_USER.id ? (
                <div className="text-xs font-semibold text-accent mt-3">✓ Currently Logged In as Admin</div>
              ) : (
                <button
                  onClick={() => {
                    onSwitchUser(DEFAULT_ADMIN_USER);
                    addLog('USER_SWITCH', 'Switched active session to System Administrator (ADMIN-001)');
                  }}
                  className="btn btn-primary btn-sm w-full mt-3"
                >
                  Switch to Admin Account
                </button>
              )}
            </div>

            {/* Standard User Card */}
            <div className={`user-role-card ${currentUser.id === DEFAULT_REGULAR_USER.id ? 'active' : ''}`}>
              <div className="flex items-center gap-3 mb-2">
                <img src={DEFAULT_REGULAR_USER.avatar} alt="User" className="user-avatar-md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-main">{DEFAULT_REGULAR_USER.name}</span>
                    <span className="role-badge user">👤 USER</span>
                  </div>
                  <div className="text-xs text-secondary">{DEFAULT_REGULAR_USER.email}</div>
                  <div className="text-xs text-secondary">ID: {DEFAULT_REGULAR_USER.id}</div>
                </div>
              </div>

              {currentUser.id === DEFAULT_REGULAR_USER.id ? (
                <div className="text-xs font-semibold text-secondary mt-3">✓ Currently Logged In as Regular User</div>
              ) : (
                <button
                  onClick={() => {
                    onSwitchUser(DEFAULT_REGULAR_USER);
                    addLog('USER_SWITCH', 'Switched active session to Standard User (USER-002)');
                  }}
                  className="btn btn-secondary btn-sm w-full mt-3"
                >
                  Switch to Regular Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeAdminTab === 'logs' && (
        <div className="glass-card p-4">
          <h3 className="text-base font-bold text-main mb-3">Admin Security Audit Logs</h3>
          <div className="logs-timeline">
            {adminLogs.map(log => (
              <div key={log.id} className="log-item">
                <div className="log-header">
                  <span className="log-action">{log.action}</span>
                  <span className="log-time">{log.timestamp}</span>
                </div>
                <div className="log-details">{log.details}</div>
                <div className="log-meta">Triggered by Admin ID: {log.adminId}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
