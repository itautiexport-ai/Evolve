import React, { useState } from 'react';
import type { User } from '../types/goal';
import { authApi, setAuthToken } from '../services/api';
import { ShieldCheck, Lock, Mail, X, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      setAuthToken(result.token);
      onLogin(result.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.signup(name, email, password);
      const result = await authApi.login(email, password);
      setAuthToken(result.token);
      onLogin(result.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
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
              <h3>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
              <p className="modal-subtitle">
                {mode === 'login' ? 'Sign in to access your data' : 'Sign up to get started'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="divider-or">
          <span>{mode === 'login' ? 'SIGN IN' : 'SIGN UP'}</span>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="auth-form mt-3">
          {error && <div className="error-banner mb-3">{error}</div>}

          {mode === 'signup' && (
            <div className="form-group mb-3">
              <label className="form-label">Full Name</label>
              <div className="input-icon-wrapper">
                <UserIcon size={18} className="input-icon" />
                <input
                  type="text"
                  className="form-input with-icon"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group mb-3">
            <label className="form-label">Email</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="form-input with-icon"
                placeholder="you@example.com"
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
                minLength={6}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <ShieldCheck size={16} />
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <div className="text-center mt-3">
            <button
              type="button"
              className="btn-link text-xs"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
