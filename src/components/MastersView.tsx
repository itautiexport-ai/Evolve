import React from 'react';
import { Users, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

interface MastersViewProps {
  setActiveNav: (nav: string) => void;
}

export const MastersView: React.FC<MastersViewProps> = ({ setActiveNav }) => {
  const subModules = [
    {
      id: 'users',
      title: 'Users',
      description: 'Create and manage system accounts, credentials, and user profiles.',
      icon: <Users size={32} className="text-emerald-600" />,
      colorClass: 'green-pastel-theme'
    },
    {
      id: 'permissions',
      title: 'Permissions',
      description: 'Configure permission roles, restrict access gates, and manage user security settings.',
      icon: <ShieldCheck size={32} className="text-blue-600" />,
      colorClass: 'blue-pastel-theme'
    }
  ];

  return (
    <div className="masters-landing-container animate-fade-in">
      <div className="masters-landing-header mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Layers size={28} className="text-emerald-600" />
          <h1 className="masters-landing-title text-main">Masters Module</h1>
        </div>
        <p className="masters-landing-desc text-secondary">
          Configure administrative settings, register user profiles, and manage system permissions.
        </p>
      </div>

      <div className="sub-modules-grid">
        {subModules.map((sub) => (
          <div
            key={sub.id}
            onClick={() => setActiveNav(sub.id)}
            className={`sub-module-card ${sub.colorClass}`}
          >
            <div className="sub-module-card-icon-box">
              {sub.icon}
            </div>
            <div className="sub-module-card-body">
              <h2 className="sub-module-card-title">{sub.title}</h2>
              <p className="sub-module-card-desc">{sub.description}</p>
              <div className="sub-module-card-link">
                <span>Configure Sub-module</span>
                <ArrowRight size={16} className="arrow-icon" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
