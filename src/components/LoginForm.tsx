import React, { useState } from 'react';
import type { User } from '../types/goal';
import { DEFAULT_ADMIN_USER, DEFAULT_REGULAR_USER } from '../data/authData';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Key, 
  Zap, 
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
  users: User[];
  onRegisterUser: (newUser: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  users,
  onRegisterUser,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [pendingUserAttempt, setPendingUserAttempt] = useState<User | null>(null);

  // Sign Up Form State
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpError, setSignUpError] = useState('');

  // Waiting / Pending Confirmation Screen State
  const [pendingConfirmationUser, setPendingConfirmationUser] = useState<User | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusCheckMsg, setStatusCheckMsg] = useState<{ type: 'pending' | 'approved'; text: string } | null>(null);

  // Handle Manual Sign In
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setPendingUserAttempt(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Look up user in registered users list
    const foundUser = users.find(u => 
      u.email.trim().toLowerCase() === cleanEmail || 
      u.id.toLowerCase() === cleanEmail
    );

    if (foundUser) {
      if (foundUser.password && foundUser.password !== cleanPassword) {
        setSignInError('Incorrect password. Please verify your credentials.');
        return;
      }

      // Check Approval Status
      if (foundUser.status === 'pending') {
        setPendingUserAttempt(foundUser);
        setSignInError('PENDING_APPROVAL');
        return;
      }

      if (foundUser.status === 'rejected') {
        setSignInError('Your registration request was not approved by the administrator. Please contact support.');
        return;
      }

      // Approved!
      onLogin(foundUser);
      return;
    }

    // 2. Check Demo Credentials fallback
    const isAdminEmail = cleanEmail === 'admin@liinexus.com' || cleanEmail === 'admin';
    const isAdminPassword = cleanPassword === 'admin123' || cleanPassword === 'admin';

    const isUserEmail = cleanEmail === 'alex@lifegoals.com' || cleanEmail === 'user';
    const isUserPassword = cleanPassword === 'user123' || cleanPassword === 'user';

    if (isAdminEmail && isAdminPassword) {
      onLogin(DEFAULT_ADMIN_USER);
      return;
    }

    if (isUserEmail && isUserPassword) {
      onLogin(DEFAULT_REGULAR_USER);
      return;
    }

    setSignInError('Invalid email or password. Please check your credentials or register a new account.');
  };

  // Handle Sign Up Submission
  const handleSignUp = (e: React.FormEvent) => {
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

    // Check if email already registered
    const existing = users.find(u => u.email.trim().toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.status === 'pending') {
        setPendingConfirmationUser(existing);
        return;
      }
      setSignUpError('An account with this email address already exists. Please Sign In.');
      return;
    }

    // Generate unique User ID
    const newUserId = 'EVO-' + Math.floor(1000 + Math.random() * 9000);

    const newUser: User = {
      id: newUserId,
      name: signUpFullName.trim(),
      email: cleanEmail,
      phone: signUpPhone.trim(),
      password: signUpPassword,
      role: 'USER',
      status: 'pending', // Starts in pending approval state!
      vibeName: signUpFullName.trim().split(' ')[0],
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(signUpFullName.trim())}`,
      accessMasters: true,
      accessGoals: true,
      accessHabits: true,
      accessGratitude: true,
      accessMusic: true,
      accessOverallDashboard: true,
      accessHabitsDashboard: true,
      accessGoalPlanner: true,
      accessVisionBoard: true,
      accessAdmin: false,
    };

    onRegisterUser(newUser);

    // Switch to Pending Confirmation View
    setPendingConfirmationUser(newUser);

    // Reset form fields
    setSignUpFullName('');
    setSignUpEmail('');
    setSignUpPhone('');
    setSignUpPassword('');
    setSignUpConfirmPassword('');
  };

  // Check live approval status from users list / storage
  const handleCheckApprovalStatus = (targetUser: User) => {
    setCheckingStatus(true);
    setStatusCheckMsg(null);

    setTimeout(() => {
      // Re-read latest users
      let latestUsers = users;
      try {
        const stored = localStorage.getItem('evolve_users_v3');
        if (stored) {
          latestUsers = JSON.parse(stored);
        }
      } catch (err) {
        console.error(err);
      }

      const freshUser = latestUsers.find(u => u.id === targetUser.id || u.email.toLowerCase() === targetUser.email.toLowerCase());

      if (freshUser && freshUser.status === 'approved') {
        setStatusCheckMsg({
          type: 'approved',
          text: '🎉 Congratulations! Your account has been approved by the Admin! Logging you in...',
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          onLogin(freshUser);
        }, 1500);
      } else {
        setStatusCheckMsg({
          type: 'pending',
          text: '⏳ Still pending administrator approval. Please wait for an admin to review your account.',
        });
      }
      setCheckingStatus(false);
    }, 600);
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
              <strong>Admin Approval Required:</strong> For platform security, new accounts must be approved by the administrator before you can log in. Once approved, you can sign in with your email and password.
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
            {/* Demo Quick Credentials Card */}
            <div className="login-cred-box">
              <div className="login-cred-title">
                <Key size={14} /> Quick Demo Access
              </div>
              <div className="login-cred-line">
                Admin: <code>admin@liinexus.com</code> / <code>admin123</code>
              </div>
              <div className="login-cred-line">
                User: <code>alex@lifegoals.com</code> / <code>user123</code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button 
                type="button" 
                className="login-instant-btn"
                style={{ margin: 0, fontSize: '0.8rem', padding: '10px 8px' }}
                onClick={() => {
                  setEmail('admin@liinexus.com');
                  setPassword('admin123');
                  setSignInError('');
                  setPendingUserAttempt(null);
                }}
              >
                <Zap size={14} /> Auto-fill Admin
              </button>
              <button 
                type="button" 
                className="login-instant-btn"
                style={{ 
                  margin: 0, 
                  fontSize: '0.8rem', 
                  padding: '10px 8px', 
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', 
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' 
                }}
                onClick={() => {
                  setEmail('alex@lifegoals.com');
                  setPassword('user123');
                  setSignInError('');
                  setPendingUserAttempt(null);
                }}
              >
                <Zap size={14} /> Auto-fill User
              </button>
            </div>

            <div className="login-divider-or">Or Sign In with Email</div>

            {/* Error or Pending Alert */}
            {signInError === 'PENDING_APPROVAL' && pendingUserAttempt ? (
              <div className="login-pending-alert animate-shake">
                <div className="flex items-center gap-2 text-amber-700 font-bold mb-1">
                  <Clock size={18} />
                  <span>Account Pending Admin Approval</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed mb-3">
                  Your account for <strong>{pendingUserAttempt.email}</strong> is awaiting approval by an administrator. You will be able to log in as soon as your account is approved.
                </p>
                <button
                  type="button"
                  onClick={() => handleCheckApprovalStatus(pendingUserAttempt)}
                  className="btn btn-xs bg-amber-500 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 w-full"
                >
                  <RefreshCw size={13} className={checkingStatus ? 'animate-spin' : ''} />
                  <span>Check If Admin Approved</span>
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
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input-field"
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

              <button type="submit" className="login-submit-btn">
                <span>Sign In to Evolve</span>
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

              <button type="submit" className="login-submit-btn signup-btn">
                <ShieldCheck size={18} />
                <span>Create Account & Request Approval</span>
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
