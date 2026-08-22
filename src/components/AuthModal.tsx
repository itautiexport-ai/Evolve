import React, { useState } from 'react';
import type { User } from '../types/goal';
import { DEFAULT_ADMIN_USER, DEFAULT_REGULAR_USER } from '../data/authData';
import { ShieldCheck, UserCheck, Key, Lock, Mail, X, Check, Copy } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLogin: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if ((email === 'admin@lifegoals.com' || email === 'admin') && (password === 'admin123' || password === 'admin')) {
      onLogin(DEFAULT_ADMIN_USER);
      setError('');
      onClose();
    } else if (email === 'alex@lifegoals.com' || email === 'user') {
      onLogin(DEFAULT_REGULAR_USER);
      setError('');
      onClose();
    } else {
      setError('Invalid credentials. Admin ID: admin@lifegoals.com | Pass: admin123');
    }
  };

  const copyAdminId = () => {
    navigator.clipboard.writeText('admin@lifegoals.com');
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
        <div className="active-user-badge-box glass-card mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={currentUser.avatar} 
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
            <div><strong>Admin ID / Email:</strong> <code>admin@lifegoals.com</code></div>
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
          {error && <div className="error-banner mb-3">{error}</div>}

          <div className="form-group mb-3">
            <label className="form-label">Admin ID or Email</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="text"
                className="form-input with-icon"
                placeholder="admin@lifegoals.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <button type="submit" className="btn btn-primary">
              <ShieldCheck size={16} /> Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
