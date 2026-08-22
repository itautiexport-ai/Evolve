import React from 'react';
import { 
  Sparkles, 
  Award, 
  Home, 
  Target, 
  BarChart2, 
  ShieldCheck, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import type { User } from '../types/goal';

interface SidebarProps {
  activeTab: 'home' | 'masters' | 'goals' | 'analytics' | 'admin';
  setActiveTab: (tab: 'home' | 'masters' | 'goals' | 'analytics' | 'admin') => void;
  currentUser: User;
  onOpenAuthModal: () => void;
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuthModal,
  isOpen,
}) => {
  return (
    <aside className={`evolve-sidebar glass-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Sidebar Brand Header */}
      <div className="sidebar-brand-box">
        <div className="brand-logo-pastel">
          <Sparkles className="logo-sparkle text-emerald-600" size={24} />
        </div>
        <div>
          <h1 className="sidebar-app-name">Evolve</h1>
          <p className="sidebar-app-tagline">Becoming better every day</p>
        </div>
      </div>

      {/* Sidebar Navigation Modules */}
      <nav className="sidebar-modules-list">
        <div className="sidebar-section-title">Core Modules</div>

        {/* 1. MASTERS MODULE (FIRST MODULE AS REQUESTED) */}
        <button
          className={`sidebar-module-btn theme-pink ${activeTab === 'masters' ? 'active' : ''}`}
          onClick={() => setActiveTab('masters')}
        >
          <div className="module-icon-box pink">
            <Award size={18} />
          </div>
          <div className="module-info">
            <span className="module-name">Masters</span>
            <span className="module-desc">Pillars of Self-Mastery</span>
          </div>
          <ChevronRight size={16} className="module-arrow" />
        </button>

        {/* 2. HOME PAGE MODULE */}
        <button
          className={`sidebar-module-btn theme-green ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <div className="module-icon-box green">
            <Home size={18} />
          </div>
          <div className="module-info">
            <span className="module-name">Home</span>
            <span className="module-desc">Evolution Dashboard</span>
          </div>
          <ChevronRight size={16} className="module-arrow" />
        </button>

        {/* 3. GOALS & TARGETS MODULE */}
        <button
          className={`sidebar-module-btn theme-yellow ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <div className="module-icon-box yellow">
            <Target size={18} />
          </div>
          <div className="module-info">
            <span className="module-name">Goals & Targets</span>
            <span className="module-desc">Milestone Targets</span>
          </div>
          <ChevronRight size={16} className="module-arrow" />
        </button>

        {/* 4. ANALYTICS MODULE */}
        <button
          className={`sidebar-module-btn theme-green ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <div className="module-icon-box green">
            <BarChart2 size={18} />
          </div>
          <div className="module-info">
            <span className="module-name">Growth Analytics</span>
            <span className="module-desc">Progress Insights</span>
          </div>
          <ChevronRight size={16} className="module-arrow" />
        </button>

        {/* 5. ADMIN CONTROL PANEL MODULE */}
        <div className="sidebar-section-title mt-4">System Administration</div>
        <button
          className={`sidebar-module-btn theme-yellow ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <div className="module-icon-box yellow">
            <ShieldCheck size={18} />
          </div>
          <div className="module-info">
            <span className="module-name">Admin Control</span>
            <span className="module-desc">System & Users</span>
          </div>
          <ChevronRight size={16} className="module-arrow" />
        </button>
      </nav>

      {/* Sidebar Bottom User & Admin Badge */}
      <div className="sidebar-footer-user">
        <button 
          onClick={onOpenAuthModal} 
          className="user-profile-card-btn glass-card"
          title="Manage Admin ID & User Credentials"
        >
          <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar-sm" />
          <div className="user-profile-info">
            <span className="user-profile-name">{currentUser.name}</span>
            <span className={`user-role-pill ${currentUser.role === 'ADMIN' ? 'admin' : 'user'}`}>
              {currentUser.role === 'ADMIN' ? '👑 Admin ID' : '👤 User'}
            </span>
          </div>
          {currentUser.role === 'ADMIN' ? <ShieldCheck size={16} className="text-amber-500" /> : <UserCheck size={16} />}
        </button>
      </div>
    </aside>
  );
};
