import React, { useState, useEffect } from 'react';
import type { User, UserStatus } from '../types/goal';
import { adminApi } from '../services/api';
import { 
  Users, 
  Plus, 
  Trash2, 
  UserCheck, 
  ClipboardList, 
  Edit2, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface EvolveUsersViewProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  onSwitchUser?: (user: User) => void;
}

export const EvolveUsersView: React.FC<EvolveUsersViewProps> = ({
  users,
  setUsers,
  currentUser,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  // Pending Approvals count
  const pendingUsers = users.filter(u => u.status === 'pending');

  // Tab State: 'pending' (Pending Approvals), 'add' (Add User), or 'list' (All Users)
  const [activeTab, setActiveTab] = useState<'pending' | 'add' | 'list'>('list');

  // Set default active tab dynamically based on role change or pending count
  useEffect(() => {
    if (isAdmin && pendingUsers.length > 0) {
      setActiveTab('pending');
    } else if (isAdmin) {
      setActiveTab('list');
    } else {
      setActiveTab('list');
    }
  }, [currentUser.id, isAdmin, pendingUsers.length]);

  // Form State
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vibeName, setVibeName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [status, setStatus] = useState<UserStatus>('approved');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const startEdit = (user: User) => {
    if (!isAdmin) return;
    setEditingUser(user);
    setUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setVibeName(user.vibeName || '');
    setPassword('');
    setRole(user.role);
    setStatus(user.status || 'approved');
    setFormError('');
    setSuccessMsg('');
    setActiveTab('add');
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setUserId('');
    setName('');
    setEmail('');
    setPhone('');
    setVibeName('');
    setPassword('');
    setRole('USER');
    setStatus('approved');
    setFormError('');
    setSuccessMsg('');
    setActiveTab('list');
  };

  // One-click Approve User
  const handleApproveUser = async (targetUser: User) => {
    if (!isAdmin) return;
    setFormError('');

    try {
      await adminApi.updateUserStatus(targetUser.id, 'approved');
      setUsers(prev => prev.map(u => {
        if (u.id === targetUser.id) {
          return {
            ...u,
            status: 'approved',
          };
        }
        return u;
      }));

      // Trigger confetti celebrating approval
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 }
      });

      setSuccessMsg(`Account for "${targetUser.name}" has been approved! The user can now log in.`);
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to approve user.');
    }
  };

  // Reject User
  const handleRejectUser = async (targetUser: User) => {
    if (!isAdmin) return;
    setFormError('');

    if (window.confirm(`Are you sure you want to reject the registration for "${targetUser.name}"?`)) {
      try {
        await adminApi.updateUserStatus(targetUser.id, 'rejected');
        setUsers(prev => prev.map(u => {
          if (u.id === targetUser.id) {
            return {
              ...u,
              status: 'rejected',
            };
          }
          return u;
        }));
        setSuccessMsg(`User registration for "${targetUser.name}" marked as rejected.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        setFormError(err.message || 'Failed to reject user.');
      }
    }
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
    if (!userId.trim() || !name.trim() || (!editingUser && !password.trim())) {
      setFormError('User ID, Full Name, and Password are required.');
      return;
    }

    const uppercaseId = userId.trim().toUpperCase();
    const finalEmail = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '')}@lifegoals.com`;

    if (editingUser) {
      const updatedData: any = {
        name: name.trim(),
        email: finalEmail,
        phone: phone.trim() || undefined,
        vibeName: vibeName.trim() || undefined,
        role,
        status,
      };
      if (password.trim()) {
        updatedData.password = password.trim();
      }

      try {
        await adminApi.updateUser(editingUser.id, updatedData);
      } catch (err: any) {
        setFormError(err.message || 'Failed to update user.');
        return;
      }

      const updatedUser: User = {
        ...editingUser,
        name: name.trim(),
        email: finalEmail,
        phone: phone.trim() || undefined,
        role,
        status,
        vibeName: vibeName.trim() || name.trim().split(' ')[0],
      };

      setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));

      setSuccessMsg(`User "${name.trim()}" successfully updated!`);
      setEditingUser(null);
      setUserId('');
      setName('');
      setEmail('');
      setPhone('');
      setVibeName('');
      setPassword('');
      setRole('USER');
      setStatus('approved');

      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('list');
      }, 1500);

    } else {
      // Create Mode
      let createdUser: any;
      try {
        createdUser = await adminApi.createUser({
          id: uppercaseId,
          name: name.trim(),
          email: finalEmail,
          phone: phone.trim() || undefined,
          password: password.trim(),
          role,
          status,
          vibeName: vibeName.trim() || undefined,
        });
      } catch (err: any) {
        setFormError(err.message || 'Failed to create user account.');
        return;
      }

      const newUser: User = {
        id: createdUser?.id || uppercaseId,
        name: name.trim(),
        email: finalEmail,
        phone: phone.trim() || undefined,
        role,
        status,
        vibeName: vibeName.trim() || name.trim().split(' ')[0],
        joinedDate: createdUser?.joinedDate || new Date().toISOString().split('T')[0],
        avatar: createdUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
        accessMasters: true,
        accessGoals: true,
        accessHabits: true,
        accessGratitude: true,
        accessMusic: true,
        accessOverallDashboard: true,
        accessHabitsDashboard: true,
        accessGoalPlanner: true,
        accessVisionBoard: true,
        accessAdmin: role === 'ADMIN',
      };

      setUsers(prev => [...prev, newUser]);
      
      setUserId('');
      setName('');
      setEmail('');
      setPhone('');
      setVibeName('');
      setPassword('');
      setRole('USER');
      setStatus('approved');
      setSuccessMsg(`User "${newUser.name}" successfully created!`);
      
      setTimeout(() => {
        setSuccessMsg('');
        setActiveTab('list');
      }, 1500);
    }
  };

  const handleDeleteUser = async (idToDelete: string) => {
    if (!isAdmin) return;

    if (idToDelete === currentUser.id) {
      alert('You cannot delete the currently logged in user.');
      return;
    }

    const target = users.find(u => u.id === idToDelete);
    const targetName = target ? target.name : idToDelete;

    if (window.confirm(`Are you sure you want to remove user "${targetName}"?`)) {
      try {
        await adminApi.deleteUser(idToDelete);
        setUsers(prev => prev.filter(u => u.id !== idToDelete));
        setSuccessMsg(`User "${targetName}" removed from system.`);
        setTimeout(() => setSuccessMsg(''), 2500);
      } catch (err: any) {
        setFormError(err.message || 'Failed to delete user.');
      }
    }
  };

  return (
    <div className="users-view-container animate-fade-in">
      <div className="users-view-header mb-6">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-emerald-600" />
          <h1 className="text-main font-bold">Users Management & Approvals</h1>
        </div>
        <p className="text-secondary mt-1">
          Review new user sign-up requests, grant login approvals, and manage security credentials.
        </p>
      </div>

      {/* Global Success Notification */}
      {successMsg && (
        <div className="success-alert mb-5 animate-scale-up">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Switcher Headers */}
      <div className="users-tabs-header mb-6">
        {isAdmin && (
          <button
            onClick={() => setActiveTab('pending')}
            className={`users-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <Clock size={16} />
            <span>Pending Approvals</span>
            {pendingUsers.length > 0 && (
              <span className="pending-badge-pill">
                {pendingUsers.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => {
            if (editingUser) {
              setEditingUser(null);
              setUserId('');
              setName('');
              setEmail('');
              setPhone('');
              setVibeName('');
              setPassword('');
              setRole('USER');
            }
            setActiveTab('list');
          }}
          className={`users-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
        >
          <ClipboardList size={16} />
          <span>All Users ({users.length})</span>
        </button>

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
      </div>

      <div className="users-tab-content-area">
        {/* ======================================================= */}
        {/* TAB 1: PENDING APPROVALS                                */}
        {/* ======================================================= */}
        {activeTab === 'pending' && isAdmin ? (
          <div className="pending-approvals-panel animate-scale-up">
            <div className="glass-card p-5 mb-4 border-amber-200" style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
              <div className="flex items-center gap-3">
                <Clock size={24} className="text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-950 text-sm">
                    {pendingUsers.length === 1 
                      ? '1 New User Awaiting Approval' 
                      : `${pendingUsers.length} Users Awaiting Approval`}
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    When new users register with their Full Name, Email, Phone, and Password, they remain pending until an administrator approves their account. Approved users can log in immediately.
                  </p>
                </div>
              </div>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-main text-base">All Caught Up!</h3>
                <p className="text-secondary text-sm mt-1 max-w-md mx-auto">
                  There are no pending sign-up requests. Every user account has been processed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUsers.map(user => (
                  <div key={user.id} className="pending-user-card glass-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-main text-base">{user.name}</span>
                          <span className="pending-chip">
                            <Clock size={11} /> Pending Approval
                          </span>
                        </div>
                        <span className="text-xs text-secondary font-mono">ID: {user.id}</span>
                      </div>
                      <span className="text-xs text-secondary font-semibold">
                        Registered: {user.joinedDate}
                      </span>
                    </div>

                    <div className="pending-card-details">
                      <div className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
                        <Mail size={14} className="text-indigo-500" />
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
                        <Phone size={14} className="text-emerald-500" />
                        <span className="font-semibold">{user.phone || 'Phone not provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <ShieldCheck size={14} className="text-slate-400" />
                        <span>Role: Standard User • Vibe: {user.vibeName || 'Default'}</span>
                      </div>
                    </div>

                    <div className="pending-actions-bar mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="btn btn-xs delete-btn"
                        title="Delete Request"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRejectUser(user)}
                          className="btn btn-xs btn-outline-rose"
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveUser(user)}
                          className="btn btn-xs btn-primary-approve"
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve User</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'add' && isAdmin ? (
          /* ======================================================= */
          /* TAB 2: CREATE / EDIT USER FORM                          */
          /* ======================================================= */
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

              <div className="form-group mb-4">
                <label className="form-label">USER ID</label>
                <input
                  type="text"
                  placeholder="e.g. EVO-1001"
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
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">PHONE NUMBER</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">VIBE NAME</label>
                <input
                  type="text"
                  placeholder="Vibe Name (e.g. Champion)"
                  value={vibeName}
                  onChange={e => setVibeName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group mb-4">
                <label className="form-label">SECURITY PASSWORD</label>
                <input
                  type="password"
                  placeholder={editingUser ? "Leave blank to keep current password" : "Security Password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="form-group">
                  <label className="form-label">ROLE</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'USER' | 'ADMIN')}
                    className="form-input"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ACCOUNT STATUS</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as UserStatus)}
                    className="form-input"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary-pastel w-full py-2.5 flex items-center justify-center gap-2">
                <Sparkles size={18} />
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
          /* ======================================================= */
          /* TAB 3: DIRECTORY LIST PANEL                             */
          /* ======================================================= */
          <div className="user-directory-card animate-scale-up">
            <div className="users-list-table-wrapper glass-card">
              <table className="users-list-table">
                <thead>
                  <tr>
                    <th>Profile Name</th>
                    <th>User ID</th>
                    <th>Email & Phone</th>
                    <th>Status</th>
                    <th>Type of ID</th>
                    <th>Joined Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isActiveSession = user.id === currentUser.id;
                    const userStatus = user.status || 'approved';

                    return (
                      <tr key={user.id} className={isActiveSession ? 'active-row' : ''}>
                        {/* Profile Name */}
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-list-name font-bold text-main">{user.name}</div>
                            {user.vibeName && (
                              <div className="text-xs text-secondary">Vibe: {user.vibeName}</div>
                            )}
                          </div>
                        </td>

                        {/* ID */}
                        <td className="user-id-cell font-mono text-secondary font-bold">{user.id}</td>

                        {/* Email & Phone */}
                        <td>
                          <div className="text-xs text-slate-700 font-medium">{user.email}</div>
                          <div className="text-xs text-slate-500 font-semibold">{user.phone || '—'}</div>
                        </td>

                        {/* Status */}
                        <td>
                          {userStatus === 'approved' ? (
                            <span className="badge badge-status-approved">
                              <CheckCircle2 size={11} /> Approved
                            </span>
                          ) : userStatus === 'pending' ? (
                            <span className="badge badge-status-pending">
                              <Clock size={11} /> Pending
                            </span>
                          ) : (
                            <span className="badge badge-status-rejected">
                              <XCircle size={11} /> Rejected
                            </span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="user-role-cell">
                          <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                            {user.role === 'ADMIN' ? 'Admin' : 'User'}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="user-date-cell text-secondary font-semibold">{user.joinedDate}</td>

                        {/* Actions */}
                        <td className="text-right">
                          <div className="user-actions-cell">
                            {/* Inline Approve Button for Pending Users */}
                            {isAdmin && userStatus === 'pending' && (
                              <button
                                onClick={() => handleApproveUser(user)}
                                className="btn btn-xs btn-primary-approve"
                                title="Approve User"
                              >
                                <CheckCircle2 size={12} />
                                <span>Approve</span>
                              </button>
                            )}

                            {isActiveSession && (
                              <span className="active-session-pill">
                                <UserCheck size={12} /> Active
                              </span>
                            )}
                            
                            {/* Actions restricted to Administrators only */}
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => startEdit(user)}
                                  className="btn btn-xs btn-outline-pastel ml-2"
                                  title="Edit user details"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={isActiveSession}
                                  className="btn btn-xs delete-btn"
                                  title="Delete user"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
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
