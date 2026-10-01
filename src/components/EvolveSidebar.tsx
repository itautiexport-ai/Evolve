import React, { useState } from 'react';
import { EvolveLogo } from './EvolveLogo';
import { ChevronDown, Users, Layers, ShieldCheck, Heart, Target, Sparkles, Music, CalendarCheck, TrendingUp, LayoutDashboard } from 'lucide-react';

interface EvolveSidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  logoUrl?: string;
}

export const EvolveSidebar: React.FC<EvolveSidebarProps> = ({
  activeNav,
  setActiveNav,
  logoUrl,
}) => {
  // Expansion state for collapsible main sections
  const [isMastersExpanded, setIsMastersExpanded] = useState(false);
  const [isGoalsExpanded, setIsGoalsExpanded] = useState(false);

  return (
    <aside className="screenshot-sidebar animate-fade-in">
      {/* Top Logo Container - Clickable to go to Home Page */}
      <div 
        className="sidebar-logo-container logo-clickable" 
        onClick={() => setActiveNav('home')}
        style={{ cursor: 'pointer' }}
        title="Go to Home Page"
      >
        <EvolveLogo logoUrl={logoUrl} />
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-menu-list">
        {/* DASHBOARD */}
        <div className="sidebar-section">
          <button
            onClick={() => setActiveNav('overall-dashboard')}
            className={`sidebar-nav-item ${activeNav === 'overall-dashboard' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <LayoutDashboard size={18} className="nav-icon" style={{ color: '#4f46e5' }} />
              <span className="nav-item-label">DASHBOARD</span>
            </div>
          </button>
        </div>

        {/* MASTERS MODULE SECTION */}
        <div className="sidebar-section">
          <div
            className={`sidebar-nav-item ${activeNav === 'masters' ? 'active' : ''}`}
            style={{ padding: 0 }}
          >
            <button
              onClick={() => setActiveNav('masters')}
              className="nav-item-main-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexGrow: 1,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '14px 0 14px 18px',
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
                textTransform: 'inherit',
                letterSpacing: 'inherit',
                fontWeight: 'inherit'
              }}
            >
              <Layers size={18} className="nav-icon" />
              <span className="nav-item-label">MASTERS</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMastersExpanded(!isMastersExpanded);
              }}
              className="nav-item-arrow-btn"
              style={{
                background: 'none',
                border: 'none',
                padding: '14px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'inherit',
                alignSelf: 'stretch'
              }}
              aria-label="Toggle Masters sub-modules"
            >
              <ChevronDown 
                size={14} 
                className="nav-item-arrow-down" 
                style={{ 
                  transform: isMastersExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease' 
                }}
              />
            </button>
          </div>

          {/* Sub-modules list - renders only when expanded */}
          {isMastersExpanded && (
            <div className="sidebar-sub-menu animate-slide-down">
              <button
                onClick={() => setActiveNav('users')}
                className={`sidebar-sub-item ${activeNav === 'users' ? 'active' : ''}`}
              >
                <Users size={15} className="sub-nav-icon" />
                <span className="sub-item-label">Users</span>
              </button>
              <button
                onClick={() => setActiveNav('permissions')}
                className={`sidebar-sub-item ${activeNav === 'permissions' ? 'active' : ''}`}
              >
                <ShieldCheck size={15} className="sub-nav-icon" />
                <span className="sub-item-label">Permissions</span>
              </button>
            </div>
          )}
        </div>
        
        {/* GRATITUDE JOURNAL */}
        <div className="sidebar-section">
          <button
            onClick={() => setActiveNav('gratitude')}
            className={`sidebar-nav-item ${activeNav === 'gratitude' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <Heart size={18} className="nav-icon" />
              <span className="nav-item-label">GRATITUDE JOURNAL</span>
            </div>
          </button>
        </div>

        {/* LET THE MUSIC PLAY */}
        <div className="sidebar-section">
          <button
            onClick={() => setActiveNav('music')}
            className={`sidebar-nav-item ${activeNav === 'music' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <Music size={18} className="nav-icon" style={{ color: '#0ea5e9' }} />
              <span className="nav-item-label">LET THE MUSIC PLAY</span>
            </div>
          </button>
        </div>

        {/* MY GOALS */}
        <div className="sidebar-section">
          <div
            className={`sidebar-nav-item ${activeNav === 'goals' ? 'active' : ''}`}
            style={{ padding: 0 }}
          >
            <button
              onClick={() => setActiveNav('goals')}
              className="nav-item-main-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexGrow: 1,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '14px 0 14px 18px',
                textAlign: 'left',
                font: 'inherit',
                color: 'inherit',
                textTransform: 'inherit',
                letterSpacing: 'inherit',
                fontWeight: 'inherit'
              }}
            >
              <Target size={18} className="nav-icon" />
              <span className="nav-item-label">MY GOALS</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsGoalsExpanded(!isGoalsExpanded);
              }}
              className="nav-item-arrow-btn"
              style={{
                background: 'none',
                border: 'none',
                padding: '14px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'inherit',
                alignSelf: 'stretch'
              }}
              aria-label="Toggle Goals sub-modules"
            >
              <ChevronDown 
                size={14} 
                className="nav-item-arrow-down" 
                style={{ 
                  transform: isGoalsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.2s ease' 
                }}
              />
            </button>
          </div>

          {/* Sub-modules list - renders only when expanded */}
          {isGoalsExpanded && (
            <div className="sidebar-sub-menu animate-slide-down">
              <button
                onClick={() => setActiveNav('goals-planner')}
                className={`sidebar-sub-item ${activeNav === 'goals-planner' ? 'active' : ''}`}
              >
                <Target size={15} className="sub-nav-icon" />
                <span className="sub-item-label">My Goal Planner</span>
              </button>
              <button
                onClick={() => setActiveNav('goals-vision')}
                className={`sidebar-sub-item ${activeNav === 'goals-vision' ? 'active' : ''}`}
              >
                <Sparkles size={15} className="sub-nav-icon" />
                <span className="sub-item-label">Create Vision Board</span>
              </button>
            </div>
          )}
        </div>

        {/* MY HABIT TRACKER */}
        <div className="sidebar-section">
          <button
            onClick={() => setActiveNav('habits')}
            className={`sidebar-nav-item ${activeNav === 'habits' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <CalendarCheck size={18} className="nav-icon" style={{ color: '#4f46e5' }} />
              <span className="nav-item-label">MY HABIT TRACKER</span>
            </div>
          </button>
        </div>

        {/* HABITS DASHBOARD */}
        <div className="sidebar-section">
          <button
            onClick={() => setActiveNav('habits-dashboard')}
            className={`sidebar-nav-item ${activeNav === 'habits-dashboard' ? 'active' : ''}`}
          >
            <div className="nav-item-content">
              <TrendingUp size={18} className="nav-icon" style={{ color: '#ec4899' }} />
              <span className="nav-item-label">HABITS DASHBOARD</span>
            </div>
          </button>
        </div>
      </nav>
    </aside>
  );
};
