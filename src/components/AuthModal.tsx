import React, { useState } from 'react';
import type { User } from '../types/goal';
import { authApi } from '../services/api';
import { DEFAULT_ADMIN_USER, DEFAULT_REGULAR_USER } from '../data/authData';
import { ShieldCheck, UserCheck, Key, Lock, Mail, X, Check, Copy, Clock, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  currentUser?: User;
  users?: User[];
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  users = [],
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPendingAlert, setIsPendingAlert] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPendingAlert(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check in local users list for pending status
    const foundUser = users.find(u => 
      u.email.trim().toLowerCase() === cleanEmail || 
      u.id.toLowerCase() === cleanEmail
    );

    if (foundUser) {
      if (foundUser.password && foundUser.password !== cleanPassword) {
        setError('Incorrect password. Please verify your credentials.');
        return;
      }

      if (foundUser.status === 'pending') {
        setIsPendingAlert(true);
        setError(`Account for ${foundUser.email} is pending administrator approval. Please wait for an admin to approve your account before logging in.`);
        return;
      }

      if (foundUser.status === 'rejected') {
        setError('Your registration request was rejected by an administrator.');
        return;
      }

      onLogin(foundUser);
      onClose();
      return;
    }

    // 2. Try authApi if available
    setLoading(true);
    try {
      const res = await authApi.login(cleanEmail, cleanPassword);
      if (res?.user?.status === 'pending') {
        setIsPendingAlert(true);
        setError(`Account for ${cleanEmail} is pending administrator approval.`);
        setLoading(false);
        return;
      }
      onLogin(res.user);
      onClose();
      return;
    } catch {
      // Fall through to demo check
    } finally {
      setLoading(false);
    }

    // 3. Demo fallback
    if ((cleanEmail === 'admin@liinexus.com' || cleanEmail === 'admin@lifegoals.com' || cleanEmail === 'admin') && 
        (cleanPassword === 'admin123' || cleanPassword === 'admin')) {
      onLogin(DEFAULT_ADMIN_USER);
      onClose();
    } else if ((cleanEmail === 'alex@lifegoals.com' || cleanEmail === 'user') && 
               (cleanPassword === 'user123' || cleanPassword === 'user' || cleanPassword === '')) {
      onLogin(DEFAULT_REGULAR_USER);
      onClose();
    } else {
      setError('Invalid credentials. Admin: admin@liinexus.com | Pass: admin123');
    }
  };

  const copyAdminId = () => {
    navigator.clipboard.writeText('admin@liinexus.com');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ShieldCheck size={26} className="text-accent" />
            <div>
              <h3>Admin & User Login</h3>
              <p className="modal-subtitle">Access Admin Control Center & Manage Platform</p>
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

              {currentUser.role === 'ADMIN' ? (
                <span className="text-xs text-accent font-semibold px-2 py-1 bg-accent-light rounded-md">
                  Active Admin Session
                </span>
              ) : (
                <button
                  onClick={() => {
                    onLogin(DEFAULT_ADMIN_USER);
                    onClose();
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Switch to Admin
                </button>
              )}
            </div>
          </div>
        )}

        {/* Admin Quick Credentials Card */}
        <div className="admin-credentials-card mb-4">
          <div className="cred-title flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-accent">
              <Key size={14} /> Official Admin ID Credentials:
            </span>
            <button onClick={copyAdminId} className="copy-btn text-xs">
              {copiedId ? <Check size={12} className="text-green" /> : <Copy size={12} />}
              {copiedId ? 'Copied' : 'Copy Admin ID'}
            </button>
          </div>
          <div className="cred-details text-xs">
            <div><strong>Admin ID / Email:</strong> <code>admin@liinexus.com</code></div>
            <div><strong>Password:</strong> <code>admin123</code></div>
            <div><strong>Admin Code:</strong> <code>ADMIN-001</code></div>
          </div>
          <button
            onClick={() => {
              onLogin(DEFAULT_ADMIN_USER);
              onClose();
            }}
            className="btn btn-accent w-full mt-3 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} />
            <span>⚡ Instant One-Click Admin Login</span>
          </button>
        </div>

        <div className="divider-or"><span>OR SIGN IN WITH CREDENTIALS</span></div>

        {/* Manual Login Form */}
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
                placeholder="admin@liinexus.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                onLogin(DEFAULT_REGULAR_USER);
                onClose();
              }}
              className="btn btn-secondary"
            >
              <UserCheck size={16} /> Log in as Standard User
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
