import React from 'react';
import type { User } from '../types/goal';
import { ShieldCheck, Lock, Unlock, Settings, Users } from 'lucide-react';

interface EvolvePermissionsViewProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const EvolvePermissionsView: React.FC<EvolvePermissionsViewProps> = ({
  users,
  setUsers,
}) => {
  const togglePermission = (
    userId: string, 
    field: 'accessMasters' | 'accessGoals' | 'accessAdmin' | 'accessGratitude' | 'accessMusic' | 'accessHabits' | 'accessGoalPlanner' | 'accessVisionBoard' | 'accessHabitsDashboard' | 'accessOverallDashboard'
  ) => {
    setUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      
      const currentVal = user[field] !== undefined 
        ? user[field] 
        : (field === 'accessAdmin' ? user.role === 'ADMIN' : true);
        
      return {
        ...user,
        [field]: !currentVal
      };
    }));
  };

  return (
    <div className="permissions-view-container animate-fade-in">
      <div className="permissions-view-header mb-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-emerald-600" />
            <h1 className="text-main font-bold">Role & Module Permissions</h1>
          </div>
          <p className="text-secondary mt-1">
            Restrict or enable user access permissions across application modules and sub-modules.
          </p>
        </div>
      </div>

      <div className="permissions-card glass-card">
        <div className="card-header border-b pb-4 mb-4 flex items-center justify-between">
          <h2 className="text-main font-bold flex items-center gap-2">
            <Settings size={18} className="text-emerald-600" /> Security Access Matrix
          </h2>
          <span className="text-xs text-secondary font-bold flex items-center gap-1">
            <Users size={14} /> Registered Accounts: {users.length}
          </span>
        </div>

        <div className="table-responsive">
          <table className="permissions-table">
            <thead>
              <tr>
                <th>USER / PROFILE</th>
                <th className="text-center">ROLE</th>
                <th className="text-center">MASTERS ACCESS</th>
                <th className="text-center">GOALS ACCESS</th>
                <th className="text-center">GOAL PLANNER</th>
                <th className="text-center">VISION BOARD</th>
                <th className="text-center">GRATITUDE ACCESS</th>
                <th className="text-center">HABITS ACCESS</th>
                <th className="text-center">DASHBOARD</th>
                <th className="text-center">HABITS DASHBOARD</th>
                <th className="text-center">MUSIC ACCESS</th>
                <th className="text-center">ADMIN PANEL ACCESS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                // Read permissions with fallback values
                const hasMastersAccess = user.accessMasters !== undefined ? user.accessMasters : true;
                const hasGoalsAccess = user.accessGoals !== undefined ? user.accessGoals : true;
                const hasGoalPlannerAccess = user.accessGoalPlanner !== undefined ? user.accessGoalPlanner : true;
                const hasVisionBoardAccess = user.accessVisionBoard !== undefined ? user.accessVisionBoard : true;
                const hasGratitudeAccess = user.accessGratitude !== undefined ? user.accessGratitude : true;
                const hasHabitsAccess = user.accessHabits !== undefined ? user.accessHabits : true;
                const hasOverallDashboardAccess = user.accessOverallDashboard !== undefined ? user.accessOverallDashboard : true;
                const hasHabitsDashboardAccess = user.accessHabitsDashboard !== undefined ? user.accessHabitsDashboard : true;
                const hasMusicAccess = user.accessMusic !== undefined ? user.accessMusic : true;
                const hasAdminAccess = user.accessAdmin !== undefined ? user.accessAdmin : user.role === 'ADMIN';

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-table-profile">
                        <div>
                          <div className="user-table-name font-bold text-main">{user.name}</div>
                          <div className="user-table-id text-secondary">
                            ID: {user.id} • Vibe: {user.vibeName || 'None'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                        {user.role === 'ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    
                    {/* Masters Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasMastersAccess}
                          onChange={() => togglePermission(user.id, 'accessMasters')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasMastersAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Goals Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasGoalsAccess}
                          onChange={() => togglePermission(user.id, 'accessGoals')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasGoalsAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Goal Planner Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasGoalPlannerAccess}
                          onChange={() => togglePermission(user.id, 'accessGoalPlanner')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasGoalPlannerAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Vision Board Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasVisionBoardAccess}
                          onChange={() => togglePermission(user.id, 'accessVisionBoard')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasVisionBoardAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Gratitude Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasGratitudeAccess}
                          onChange={() => togglePermission(user.id, 'accessGratitude')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasGratitudeAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Habits Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasHabitsAccess}
                          onChange={() => togglePermission(user.id, 'accessHabits')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasHabitsAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Overall Dashboard Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasOverallDashboardAccess}
                          onChange={() => togglePermission(user.id, 'accessOverallDashboard')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasOverallDashboardAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Habits Dashboard Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasHabitsDashboardAccess}
                          onChange={() => togglePermission(user.id, 'accessHabitsDashboard')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasHabitsDashboardAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Music Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasMusicAccess}
                          onChange={() => togglePermission(user.id, 'accessMusic')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasMusicAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>

                    {/* Admin Access Toggle */}
                    <td className="text-center">
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={hasAdminAccess}
                          onChange={() => togglePermission(user.id, 'accessAdmin')}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className="toggle-status-label">
                        {hasAdminAccess ? <Unlock size={12} className="text-emerald-600 inline ml-1.5" /> : <Lock size={12} className="text-rose-500 inline ml-1.5" />}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
