import React from 'react';
import { Bell } from 'lucide-react';
import type { User } from '../types/goal';

interface EvolveHeaderProps {
  currentUser: User;
  onOpenAuthModal: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onLogout: () => void;
}

export const EvolveHeader: React.FC<EvolveHeaderProps> = ({
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  const userInitial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U';
  const displayName = currentUser.name || 'Admin ID';
  const displayId = currentUser.id || 'CRM0001';

  return (
    <header className="screenshot-header">
      {/* Left Space Placeholder to maintain layout */}
      <div className="header-left-space" />

      {/* Center navigation spacer */}
      <div className="header-center-space" />

      {/* Extreme Right: Profile Info & Logout */}
      <div className="header-right-wrapper">
        {/* Notification Bell Box */}
        <button className="bell-icon-card" title="Notifications" aria-label="Notifications">
          <Bell size={18} className="bell-icon" />
        </button>

        {/* User Profile Info Card */}
        <div className="user-profile-stack" onClick={onOpenAuthModal} title="Manage Admin ID">
          <div className="user-avatar-circle">
            <span>{userInitial}</span>
          </div>

          <div className="user-text-details">
            <span className="user-full-name">{displayName.toUpperCase()}</span>
            <span className="user-id-code">{displayId}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
};

