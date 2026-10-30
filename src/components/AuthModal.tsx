import React, { useState } from 'react';
import type { User } from '../types/goal';
import { authApi } from '../services/api';
import { ShieldCheck, Lock, Mail, X, Clock, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  currentUser?: User;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPendingAlert, setIsPendingAlert] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPendingAlert(false);

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('Please enter both your User ID / email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(cleanIdentifier, cleanPassword);
      if (res?.user) {
        onLogin(res.user);
        onClose();
      } else {
        throw new Error('Authentication failed.');
      }
    } catch (err: any) {
      if (err.code === 'PENDING_APPROVAL' || (err.status === 403 && String(err.message).toLowerCase().includes('pending'))) {
        setIsPendingAlert(true);
        setError('Your account is awaiting approval by an administrator. You will be able to log in once approved.');
      } else if (err.code === 'ACCOUNT_REJECTED' || (err.status === 403 && String(err.message).toLowerCase().includes('reject'))) {
        setError('Your account registration was rejected by an administrator.');
      } else {
        setError(err.message || 'Invalid User ID / email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ShieldCheck size={26} className="text-accent" />
            <div>
              <h3>Account Login</h3>
              <p className="modal-subtitle">Sign in with your User ID or email and password</p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Current Active User Status */}
        {currentUser && (
          <div className="active-user-badge-box glass-card mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`} 
                  alt={currentUser.name} 
                  className="user-avatar-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-main">{currentUser.name}</span>
                    <span className={`role-badge ${currentUser.role === 'ADMIN' ? 'admin' : 'user'}`}>
                      {currentUser.role === 'ADMIN' ? '👑 Admin' : '👤 User'}
                    </span>
                  </div>
                  <div className="text-xs text-secondary">{currentUser.email} • ID: {currentUser.id}</div>
                </div>
              </div>

              <span className="text-xs text-accent font-semibold px-2 py-1 bg-accent-light rounded-md">
                Active Session
              </span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleCustomLogin} className="auth-form mt-3">
          {error && (
            <div className={isPendingAlert ? "login-pending-alert mb-3" : "error-banner mb-3"}>
              {isPendingAlert ? <Clock size={16} className="text-amber-600 flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
              <span>{error}</span>
            </div>
          )}

          <div className="form-group mb-3">
            <label className="form-label">Email Address or User ID</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                className="form-input with-icon"
                placeholder="Enter email or User ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Password</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="form-input with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <ShieldCheck size={16} /> {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
