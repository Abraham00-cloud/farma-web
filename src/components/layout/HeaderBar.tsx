import React, { useState, useEffect } from 'react';
import type { AuthResponseDto, UserResponseDto } from '../../types/auth';
import { userService } from '../../services/userService';

interface HeaderBarProps {
  authData: AuthResponseDto;
  onMenuToggle?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ authData, onMenuToggle }) => {
  // 1. Local state to hold the fetched user profile data
  const [userProfile, setUserProfile] = useState<UserResponseDto | null>(null);

  // 2. Fetch the user's actual name on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserProfile = async () => {
      // If the backend didn't attach the userId to the Auth response, we must fallback to email
      if (!authData.userId) return;

      try {
        const profileData = await userService.getUserById(authData.userId);
        if (isMounted) {
          setUserProfile(profileData);
        }
      } catch (error) {
        console.warn("Failed to fetch full user profile for header bar", error);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [authData.userId]);

  const getRoleLabel = () => {
    const role = authData.role?.toUpperCase();
    if (role === 'PROPRIETOR' || role === 'ADMIN') {
      return 'Proprietor:';
    }
    if (role === 'MANAGER') {
      return 'Site Manager:';
    }
    return 'User:';
  };

  // 3. Dynamic Display Logic
  // If the API call succeeded, construct the human name. Otherwise, fallback to the email.
  const displayString = userProfile 
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : (authData.email?.toLowerCase() || 'system.user');

  // Extract the first letter for the Avatar (from the human name, or email as fallback)
  const initial = displayString.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-farma-forest lg:bg-farma-cream text-white lg:text-farma-forest border-b border-white/10 lg:border-farma-forest/10 px-4 sm:px-6 py-3 flex items-center justify-between font-sans shadow-sm transition-colors duration-200">

      <div className="flex items-center space-x-3 min-w-0">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 rounded-md bg-white/5 lg:bg-farma-sand border border-white/10 lg:border-farma-forest/15 text-white lg:text-farma-forest hover:bg-farma-gold hover:text-farma-forest transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <IconMenu />
          </button>
        )}

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-bold flex items-center space-x-1.5 sm:space-x-2 truncate">
            <span className="text-farma-gold lg:text-farma-green text-[10px] sm:text-xs uppercase tracking-wider font-bold shrink-0">
              {getRoleLabel()}
            </span>
            {/* The display text changes dynamically from 'email' to 'First Last' once the API resolves */}
            <span className="text-white lg:text-farma-forest tracking-tight truncate max-w-[140px] sm:max-w-none">
              {displayString}
            </span>
          </h2>
          <span className="text-[10px] sm:text-[11px] text-white/60 lg:text-farma-forest/70 font-semibold block truncate tabular-nums">
            Org ID: #{authData.organisationId ?? 'System Admin'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 text-xs shrink-0">
        <div className="hidden sm:flex bg-white/5 lg:bg-farma-sand border border-white/10 lg:border-farma-forest/15 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-md flex-col items-end shadow-sm">
          <span className="text-[8px] sm:text-[9px] font-bold uppercase text-farma-gold lg:text-farma-green tracking-widest">
            Clearance Level
          </span>
          <span className="font-bold text-white lg:text-farma-forest uppercase text-[11px] sm:text-xs">
            {authData.role}
          </span>
        </div>

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-white/10 lg:bg-farma-forest text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm border border-farma-gold/40 relative shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-farma-gold absolute top-1 right-1"></span>
          {initial}
        </div>
      </div>
    </header>
  );
};

// ==========================================
// Reusable SVG Components
// ==========================================

const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);