import React, { useState } from 'react';
import type { User } from '../types/goal';
import { authApi } from '../services/api';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginFormProps {
  onLogin: (user: User) => void;
  users?: User[];
  onRegisterUser?: (newUser: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onRegisterUser,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [pendingUserAttempt, setPendingUserAttempt] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Sign Up Form State
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Waiting / Pending Confirmation Screen State
  const [pendingConfirmationUser, setPendingConfirmationUser] = useState<User | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusCheckMsg, setStatusCheckMsg] = useState<{ type: 'pending' | 'approved'; text: string } | null>(null);

  // Handle Authenticated Sign In via Backend
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setPendingUserAttempt(null);

    const cleanIdentifier = email.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setSignInError('Please enter both your User ID / Email and password.');
      return;
    }

    setIsSigningIn(true);
    try {
      const res = await authApi.login(cleanIdentifier, cleanPassword);
      if (res?.user) {
        onLogin(res.user);
      } else {
        throw new Error('Authentication succeeded but user record was not returned.');
      }
    } catch (err: any) {
      if (err.code === 'PENDING_APPROVAL' || (err.status === 403 && String(err.message).toLowerCase().includes('pending'))) {
        const pendingUser: User = err.data?.user || {
          id: cleanIdentifier,
          name: cleanIdentifier,
          email: cleanIdentifier,
          phone: '',
          role: 'USER',
          status: 'pending',
          joinedDate: new Date().toISOString().split('T')[0],
        };
        setPendingUserAttempt(pendingUser);
        setSignInError('PENDING_APPROVAL');
      } else if (err.code === 'ACCOUNT_REJECTED' || (err.status === 403 && String(err.message).toLowerCase().includes('reject'))) {
        setSignInError('Your registration request was rejected by an administrator. Please contact support.');
      } else {
        setSignInError(err.message || 'Invalid User ID / email or password. Please verify your credentials.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Authenticated Sign Up via Backend
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');

    // Validations
    if (!signUpFullName.trim()) {
      setSignUpError('Please enter your full name.');
      return;
    }

    const cleanEmail = signUpEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setSignUpError('Please enter a valid email address.');
      return;
    }

    if (!signUpPhone.trim()) {
      setSignUpError('Please enter your phone number.');
      return;
    }

    if (!signUpPassword || signUpPassword.length < 4) {
      setSignUpError('Password must be at least 4 characters long.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSigningUp(true);
    try {
      const res = await authApi.signup({
        name: signUpFullName.trim(),
        email: cleanEmail,
        phone: signUpPhone.trim(),
        password: signUpPassword,
      });

      if (res?.user) {
        setPendingConfirmationUser(res.user);
        if (onRegisterUser) {
          onRegisterUser(res.user);
        }
        // Reset form fields
        setSignUpFullName('');
        setSignUpEmail('');
        setSignUpPhone('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
      } else {
        throw new Error('Registration could not be completed. Please try again.');
      }
    } catch (err: any) {
      setSignUpError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  // Check live approval status directly from authenticated backend
  const handleCheckApprovalStatus = async (targetUser: User) => {
    setCheckingStatus(true);
    setStatusCheckMsg(null);

    try {
      const res = await authApi.checkStatus(targetUser.id || targetUser.email);
      if (res?.status === 'approved') {
        setStatusCheckMsg({
          type: 'approved',
          text: '🎉 Congratulations! Your account has been approved by the Admin! You can now sign in with your password.',
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          setPendingConfirmationUser(null);
          setPendingUserAttempt(null);
          setSignInError('');
          setActiveTab('signin');
          setEmail(targetUser.email || targetUser.id);
        }, 1800);
      } else if (res?.status === 'rejected') {
        setStatusCheckMsg({
          type: 'pending',
          text: '❌ Your registration request was rejected by an administrator. Please contact support.',
        });
      } else {
        setStatusCheckMsg({
          type: 'pending',
          text: '⏳ Still pending administrator approval. Please wait for an admin to review your account.',
        });
      }
    } catch (err: any) {
      setStatusCheckMsg({
        type: 'pending',
        text: err.message || 'Unable to check approval status. Please try again in a few moments.',
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  // ==========================================
  // RENDER: PENDING APPROVAL CONFIRMATION SCREEN
  // ==========================================
  if (pendingConfirmationUser) {
    return (
      <div className="login-fullscreen-container">
        <div className="login-glass-card pending-card animate-scale-up">
          <div className="pending-icon-pulse">
            <Clock size={36} className="text-amber-500" />
          </div>

          <span className="pending-status-pill">
            <Clock size={13} /> Status: Pending Admin Approval
          </span>

          <h2 className="login-title-rainbow" style={{ fontSize: '1.6rem', marginTop: '12px' }}>
            Registration Submitted!
          </h2>

          <p className="login-subtitle" style={{ marginBottom: '20px' }}>
            Welcome, <strong>{pendingConfirmationUser.name}</strong>. Your account has been successfully registered on Evolve.
          </p>

          <div className="pending-info-box">
            <div className="pending-info-row">
              <span className="pending-info-label">Full Name:</span>
              <span className="pending-info-val">{pendingConfirmationUser.name}</span>
            </div>
            <div className="pending-info-row">
              <span className="pending-info-label">Email:</span>
              <span className="pending-info-val">{pendingConfirmationUser.email}</span>
            </div>
            <div className="pending-info-row">
              <span className="pending-info-label">Phone No.:</span>
              <span className="pending-info-val">{pendingConfirmationUser.phone || 'N/A'}</span>
            </div>
            <div className="pending-info-row">
              <span className="pending-info-label">Account ID:</span>
              <span className="pending-info-val font-mono">{pendingConfirmationUser.id}</span>
            </div>
          </div>

          <div className="pending-instruction-alert">
            <ShieldCheck size={18} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-900 text-left leading-relaxed">
              <strong>Admin Approval Required:</strong> For platform security, new accounts must be approved by the administrator before you can log in. Once approved, you can sign in with your email or User ID and password.
            </p>
          </div>

          {statusCheckMsg && (
            <div className={`status-check-feedback ${statusCheckMsg.type}`}>
              {statusCheckMsg.text}
            </div>
          )}

          <div className="flex flex-col gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => handleCheckApprovalStatus(pendingConfirmationUser)}
              disabled={checkingStatus}
              className="btn-status-check"
            >
              <RefreshCw size={16} className={checkingStatus ? 'animate-spin' : ''} />
              <span>{checkingStatus ? 'Checking Status...' : 'Check Approval Status'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingConfirmationUser(null);
                setActiveTab('signin');
                setEmail(pendingConfirmationUser.email);
              }}
              className="btn-back-signin"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN AUTH PORTAL (SIGN IN / SIGN UP)
  // ==========================================
  return (
    <div className="login-fullscreen-container">
      <div className="login-glass-card animate-scale-up">
        {/* Logo Circle */}
        <div className="login-logo-circle">
          <ShieldCheck size={28} />
        </div>

        <h2 className="login-title-rainbow">Evolve Life & Goals</h2>
        <p className="login-subtitle">
          {activeTab === 'signin' 
            ? 'Sign in to access your personal dashboard & habits' 
            : 'Register a new account on Evolve platform'}
        </p>

        {/* Tab Switcher */}
        <div className="auth-tab-switch-container">
          <button
            type="button"
            className={`auth-tab-switch-btn ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('signin');
              setSignInError('');
              setPendingUserAttempt(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-switch-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('signup');
              setSignUpError('');
            }}
          >
            Create Account
          </button>
        </div>

        {/* ======================================================= */}
        {/* SIGN IN TAB CONTENT                                    */}
        {/* ======================================================= */}
        {activeTab === 'signin' && (
          <div className="animate-fade-in">
            {/* Error or Pending Alert */}
            {signInError === 'PENDING_APPROVAL' && pendingUserAttempt ? (
              <div className="login-pending-alert animate-shake">
                <div className="flex items-center gap-2 text-amber-700 font-bold mb-1">
                  <Clock size={18} />
                  <span>Account Pending Admin Approval</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed mb-3">
                  Your account for <strong>{pendingUserAttempt.email || pendingUserAttempt.id}</strong> is awaiting approval by an administrator. You will be able to log in as soon as your account is approved.
                </p>
                <button
                  type="button"
                  onClick={() => handleCheckApprovalStatus(pendingUserAttempt)}
                  disabled={checkingStatus}
                  className="btn btn-xs bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 w-full"
                >
                  <RefreshCw size={13} className={checkingStatus ? 'animate-spin' : ''} />
                  <span>{checkingStatus ? 'Checking Status...' : 'Check If Admin Approved'}</span>
                </button>
              </div>
            ) : signInError ? (
              <div className="login-error-alert animate-shake">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{signInError}</span>
              </div>
            ) : null}

            <form onSubmit={handleSignIn}>
              <div className="login-form-group">
                <label className="login-form-label">Email Address or User ID</label>
                <div className="login-input-wrapper">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Enter email or User ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input-field"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="login-form-group">
                <label className="login-form-label">Password</label>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input-field"
                    style={{ paddingRight: '40px' }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit-btn" disabled={isSigningIn}>
                <span>{isSigningIn ? 'Signing In...' : 'Sign In to Evolve'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="auth-switch-footer mt-4">
              <span>Don't have an account yet?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setSignInError('');
                }}
                className="auth-switch-link"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* SIGN UP TAB CONTENT                                    */}
        {/* ======================================================= */}
        {activeTab === 'signup' && (
          <div className="animate-fade-in">
            <div className="signup-approval-notice mb-4">
              <ShieldAlert size={16} className="text-emerald-700 flex-shrink-0" />
              <p className="text-xs text-emerald-900 text-left font-medium">
                New accounts are reviewed and approved by an administrator before access is granted.
              </p>
            </div>

            {signUpError && (
              <div className="login-error-alert animate-shake">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{signUpError}</span>
              </div>
            )}

            <form onSubmit={handleSignUp} className="signup-form">
              {/* Full Name */}
              <div className="login-form-group">
                <label className="login-form-label">Full Name</label>
                <div className="login-input-wrapper">
                  <UserIcon size={16} className="login-input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    className="login-input-field"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="login-form-group">
                <label className="login-form-label">Email Address</label>
                <div className="login-input-wrapper">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="login-input-field"
                  />
                </div>
              </div>

              {/* Phone No */}
              <div className="login-form-group">
                <label className="login-form-label">Phone Number</label>
                <div className="login-input-wrapper">
                  <Phone size={16} className="login-input-icon" />
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    className="login-input-field"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-form-group">
                <label className="login-form-label">Login Password</label>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    placeholder="Choose a secure password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="login-input-field"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="password-toggle-btn"
                    title={showSignUpPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="login-form-group">
                <label className="login-form-label">Confirm Password</label>
                <div className="login-input-wrapper">
                  <CheckCircle2 size={16} className="login-input-icon" />
                  <input
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    className="login-input-field"
                  />
                </div>
              </div>

              <button type="submit" className="login-submit-btn signup-btn" disabled={isSigningUp}>
                <ShieldCheck size={18} />
                <span>{isSigningUp ? 'Submitting Registration...' : 'Create Account & Request Approval'}</span>
              </button>
            </form>

            <div className="auth-switch-footer mt-4">
              <span>Already have an account?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setSignUpError('');
                }}
                className="auth-switch-link"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
