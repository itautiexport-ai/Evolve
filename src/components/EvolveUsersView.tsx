import React, { useState, useEffect } from 'react';
import type { User } from '../types/goal';
import { Users, Plus, Trash2, UserCheck, ClipboardList, Edit2, ShieldAlert } from 'lucide-react';
import { adminApi } from '../services/api';

interface EvolveUsersViewProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  onSwitchUser: (user: User) => void;
}

export const EvolveUsersView: React.FC<EvolveUsersViewProps> = ({
  users,
  setUsers,
  currentUser,
  onSwitchUser,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  // Tab State: 'add' (Add User) or 'list' (Active Users) - Defaults to 'add' for Admins, 'list' for standard users
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('list');

  // Set default active tab dynamically based on role change (e.g. if switched session)
  useEffect(() => {
    if (isAdmin) {
      setActiveTab('add');
    } else {
      setActiveTab('list');
    }
  }, [currentUser.id, isAdmin]);

  // Form State
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [vibeName, setVibeName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const startEdit = (user: User) => {
    if (!isAdmin) return;
    setEditingUser(user);
    setUserId(user.id);
    setName(user.name);
    setVibeName(user.vibeName || '');
    setPassword(user.password || '');
    setRole(user.role);
    setFormError('');
    setSuccessMsg('');
    setActiveTab('add');
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setUserId('');
    setName('');
    setVibeName('');
    setPassword('');
    setRole('USER');
    setFormError('');
    setSuccessMsg('');
    setActiveTab('list');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    // Security Gate check
    if (!isAdmin) {
      setFormError('Only administrators have access rights to add or edit accounts.');
      return;
    }

    // Validations
    if (!userId.trim() || !name.trim() || !vibeName.trim() || (!editingUser && !password.trim())) {
      setFormError('All fields are required.');
      return;
    }

    const uppercaseId = userId.trim().toUpperCase();

    if (editingUser) {
      const updatedData: any = {
        name: name.trim(),
        vibeName: vibeName.trim(),
        role,
      };
      if (password.trim()) {
        updatedData.password = password.trim();
      }

      try {
        await adminApi.updateUser(editingUser.id, updatedData);
        const updatedUser: User = {
          ...editingUser,
          name: name.trim(),
          vibeName: vibeName.trim(),
          role,
          password: password || editingUser.password,
        };

        setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));

        if (editingUser.id === currentUser.id) {
          onSwitchUser(updatedUser);
        }

        setSuccessMsg(`User "${name.trim()}" successfully updated in database!`);
        setEditingUser(null);
        setUserId('');
        setName('');
        setVibeName('');
        setPassword('');
        setRole('USER');

        setTimeout(() => {
          setSuccessMsg('');
          setActiveTab('list');
        }, 1200);
      } catch (err: any) {
        setFormError(err.message || "Failed to update user in database.");
      }
    } else {
      const email = `${name.trim().toLowerCase().replace(/\s+/g, '')}@evolve.local`;
      try {
        const created = await adminApi.createUser({
          id: uppercaseId,
          name: name.trim(),
          email,
          password: password.trim(),
          role,
          vibeName: vibeName.trim(),
        });

        setUsers(prev => [...prev, created]);
        setUserId('');
        setName('');
        setVibeName('');
        setPassword('');
        setRole('USER');
        setSuccessMsg(`User "${created.name}" successfully created in database!`);

        setTimeout(() => {
          setSuccessMsg('');
          setActiveTab('list');
        }, 1200);
      } catch (err: any) {
        setFormError(err.message || "Failed to create user in database.");
      }
    }
  };

  const handleDeleteUser = async (idToDelete: string) => {
    if (idToDelete === currentUser.id) {
      alert('You cannot delete the currently logged in administrator.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user ${idToDelete}? This will permanently delete their account and associated data.`)) {
      try {
        await adminApi.deleteUser(idToDelete);
        setUsers(prev => prev.filter(u => u.id !== idToDelete));
      } catch (err: any) {
        alert(err.message || "Failed to delete user.");
      }
    }
  };

  return (
    <div className="users-view-container animate-fade-in">
      <div className="users-view-header mb-6">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-emerald-600" />
          <h1 className="text-main font-bold">Users Management</h1>
        </div>
        <p className="text-secondary mt-1">
          Create new security credentials and manage registered profiles.
        </p>
      </div>

      {/* Tab Switcher Headers */}
      <div className="users-tabs-header mb-6">
        {isAdmin && (
          <button
            onClick={() => {
              if (activeTab !== 'add') {
                setActiveTab('add');
              }
            }}
            className={`users-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          >
            <Plus size={16} />
            <span>{editingUser ? 'Edit User' : 'Add New User'}</span>
          </button>
        )}
        <button
          onClick={() => {
            if (editingUser) {
              setEditingUser(null);
              setUserId('');
              setName('');
              setVibeName('');
              setPassword('');
              setRole('USER');
            }
            setActiveTab('list');
          }}
          className={`users-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
        >
          <ClipboardList size={16} />
          <span>Active Users ({users.length})</span>
        </button>
      </div>

      <div className="users-tab-content-area">
        {activeTab === 'add' && isAdmin ? (
          /* Creation / Edit Form Panel */
          <div className="user-form-card glass-card max-w-md mx-auto animate-scale-up">
            <div className="card-header border-b pb-4 mb-4 flex justify-between items-center">
              <h2 className="text-main font-bold flex items-center gap-2">
                <Plus size={18} className="text-emerald-600" />
                {editingUser ? 'Edit User Profile' : 'Register New Account'}
              </h2>
              {editingUser && (
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  className="btn btn-xs btn-outline-pastel"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="user-creation-form">
              {formError && (
                <div className="error-alert mb-4">
                  <span>⚠️ {formError}</span>
                </div>
              )}
              {successMsg && (
                <div className="success-alert mb-4">
                  <span>✅ {successMsg}</span>
                </div>
              )}

              <div className="form-group mb-4">
                <label className="form-label">USER ID</label>
                <input
                  type="text"
                  placeholder="USER ID"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">FULL NAME</label>
                <input
                  type="text"
                  placeholder="FULL NAME"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">VIBE NAME</label>
                <input
                  type="text"
                  placeholder="VIBE NAME"
                  value={vibeName}
                  onChange={e => setVibeName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">SECURITY PASSWORD</label>
                <input
                  type="password"
                  placeholder="SECURITY PASSWORD"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Type of ID Dropdown */}
              <div className="form-group mb-5">
                <label className="form-label">TYPE OF ID</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'USER' | 'ADMIN')}
                  className="form-input"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary-pastel w-full py-2.5 flex items-center justify-center gap-2">
                <Plus size={18} />
                <span>{editingUser ? 'Save Profile Changes' : 'Create User Account'}</span>
              </button>
            </form>
          </div>
        ) : activeTab === 'add' && !isAdmin ? (
          <div className="glass-card p-8 text-center max-w-md mx-auto animate-scale-up">
            <ShieldAlert size={48} className="text-rose-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-main mb-2">Access Denied</h2>
            <p className="text-secondary text-sm leading-relaxed">
              You are currently logged in as a standard user. Add, Edit, and Delete privileges are restricted exclusively to administrators.
            </p>
          </div>
        ) : (
          /* Directory List Panel - Rendered in vertical list/table form */
          <div className="user-directory-card animate-scale-up">
            <div className="users-list-table-wrapper glass-card">
              <table className="users-list-table">
                <thead>
                  <tr>
                    <th>Profile Name</th>
                    <th>User ID</th>
                    <th>Vibe Name</th>
                    <th>Password</th>
                    <th>Type of ID</th>
                    <th>Joined Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isActiveSession = user.id === currentUser.id;

                    return (
                      <tr key={user.id} className={isActiveSession ? 'active-row' : ''}>
                        {/* Profile Name (Photo removed completely) */}
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-list-name font-bold text-main">{user.name}</div>
                          </div>
                        </td>
                        <td className="user-id-cell font-mono text-secondary font-bold">{user.id}</td>
                        <td className="user-vibe-cell font-semibold text-main">{user.vibeName || 'N/A'}</td>
                        <td className="user-password-cell font-mono text-secondary font-semibold">{user.password || 'N/A'}</td>
                        <td className="user-role-cell">
                          <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                            {user.role === 'ADMIN' ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="user-date-cell text-secondary font-semibold">{user.joinedDate}</td>
                        <td className="text-right">
                          <div className="user-actions-cell">
                            {isActiveSession ? (
                              <span className="active-session-pill">
                                <UserCheck size={12} /> Active
                              </span>
                            ) : (
                              <button
                                onClick={() => onSwitchUser(user)}
                                className="btn btn-xs btn-outline-pastel"
                              >
                                Switch
                              </button>
                            )}
                            {/* Actions: Edit restricted to Admins, Delete open to all */}
                            {isAdmin && (
                              <button
                                onClick={() => startEdit(user)}
                                className="btn btn-xs btn-outline-pastel ml-2"
                                title="Edit user details"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={isActiveSession}
                              className="btn btn-xs delete-btn ml-2"
                              title="Delete user"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
