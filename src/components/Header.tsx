import React from 'react';
import { Sparkles, Plus, Search, ShieldCheck, UserCheck, Menu } from 'lucide-react';
import type { FilterOptions, User } from '../types/goal';

interface HeaderProps {
  activeTab: 'home' | 'masters' | 'goals' | 'analytics' | 'admin';
  setActiveTab: (tab: 'home' | 'masters' | 'goals' | 'analytics' | 'admin') => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onOpenNewGoalModal: () => void;
  onOpenNewMasterModal: () => void;
  currentUser: User;
  onOpenAuthModal: () => void;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  filters,
  setFilters,
  onOpenNewGoalModal,
  onOpenNewMasterModal,
  currentUser,
  onOpenAuthModal,
  toggleSidebar,
}) => {
  return (
    <header className="evolve-top-header">
      <div className="header-left-side">
        <button onClick={toggleSidebar} className="sidebar-toggle-btn" aria-label="Toggle navigation">
          <Menu size={20} />
        </button>

        <div className="brand-header-title-box">
          <div className="brand-mini-logo">
            <Sparkles size={20} className="text-pink-600" />
          </div>
          <div>
            <h1 className="header-brand-title">Evolve</h1>
            <p className="header-brand-tagline">About becoming a better version of yourself.</p>
          </div>
        </div>
      </div>

      <div className="header-right-actions">
        {/* Search bar when in Goals tab */}
        {activeTab === 'goals' && (
          <div className="search-bar-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search goals, habits, milestones..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="search-input"
            />
            {filters.searchQuery && (
              <button
                className="search-clear"
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* User Account / Admin Badge Button */}
        <button 
          onClick={onOpenAuthModal}
          className={`auth-status-pill ${currentUser.role === 'ADMIN' ? 'admin' : 'user'}`}
          title="Click to manage Admin ID / User credentials"
        >
          {currentUser.role === 'ADMIN' ? (
            <>
              <ShieldCheck size={16} className="text-amber-600" />
              <span>Admin (ADMIN-001)</span>
            </>
          ) : (
            <>
              <UserCheck size={16} />
              <span>{currentUser.name}</span>
            </>
          )}
        </button>

        {/* Primary Action depending on active tab */}
        {activeTab === 'masters' ? (
          <button onClick={onOpenNewMasterModal} className="btn btn-primary-pastel add-goal-btn">
            <Plus size={18} />
            <span>Create Master</span>
          </button>
        ) : (
          <button onClick={onOpenNewGoalModal} className="btn btn-primary-pastel add-goal-btn">
            <Plus size={18} />
            <span>New Evolution Target</span>
          </button>
        )}
      </div>
    </header>
  );
};
