import React from 'react';

interface EvolveLogoProps {
  className?: string;
  logoUrl?: string;
}

export const EvolveLogo: React.FC<EvolveLogoProps> = ({ className = '', logoUrl }) => {
  return (
    <div className={`evolve-logo-box ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt="Evolve Logo" className="logo-img" />
      ) : (
        <div className="evolve-brand-badge">
          {/* Tree & Growth Icon matching the clean aesthetic */}
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15C50 15 35 30 35 48C35 56.2843 41.7157 63 50 63C58.2843 63 65 56.2843 65 48C65 30 50 15 50 15Z" fill="#10B981"/>
            <path d="M30 35C30 35 20 45 20 58C20 64.6274 25.3726 70 32 70C38.6274 70 44 64.6274 44 58C44 45 30 35 30 35Z" fill="#059669"/>
            <path d="M70 35C70 35 56 45 56 58C56 64.6274 61.3726 70 68 70C74.6274 70 80 64.6274 80 58C80 45 70 35 70 35Z" fill="#34D399"/>
            <rect x="46" y="60" width="8" height="25" rx="4" fill="#047857"/>
            <path d="M35 85H65" stroke="#047857" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <div className="logo-text-group">
            <span className="logo-main-text">evolve</span>
            <span className="logo-sub-text">b e c o m i n g  b e t t e r</span>
          </div>
        </div>
      )}
    </div>
  );
};
