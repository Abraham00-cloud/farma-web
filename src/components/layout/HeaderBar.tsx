import React from 'react';
import type { AuthResponseDto } from '../../types/auth';

interface HeaderBarProps {
  authData: AuthResponseDto;
  onMenuToggle?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ authData, onMenuToggle }) => {
  // Determine dynamic role label based on user clearance
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

  return (
    <header className="sticky top-0 z-30 bg-[#101B14] lg:bg-[#F5F1E6] text-[#F2EFE3] lg:text-[#101B14] border-b border-[#F2EFE3]/10 lg:border-[#101B14]/10 px-4 sm:px-6 py-3 flex items-center justify-between font-sans shadow-xs transition-colors duration-200">

      {/* Left Section: Mobile Menu Toggle & User Info */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Mobile Sidebar Hamburger Toggle Button */}
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 rounded-[4px] bg-[#1B2A20] lg:bg-[#ECE6D6] border border-[#F2EFE3]/15 lg:border-[#101B14]/15 text-[#F2EFE3] lg:text-[#101B14] hover:bg-[#D9A63E] hover:text-[#101B14] transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-bold flex items-center space-x-1.5 sm:space-x-2 truncate">
            {/* Dynamic Role Prefix */}
            <span className="text-[#D9A63E] lg:text-[#3F6B47] text-[10px] sm:text-xs font-mono uppercase tracking-wider font-extrabold shrink-0">
              {getRoleLabel()}
            </span>
            <span className="text-[#F2EFE3] lg:text-[#101B14] font-mono tracking-tight truncate max-w-[140px] sm:max-w-none">
              {authData.email}
            </span>
          </h2>
          <span className="text-[10px] sm:text-[11px] text-[#8FA091] lg:text-[#101B14]/70 font-mono block truncate">
            Tenant ID: #{authData.organisationId ?? 'System Admin'}
          </span>
        </div>
      </div>

      {/* Right Section: Clearance Badge & Profile Avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs shrink-0">
        {/* Clearance Level Badge */}
        <div className="hidden sm:flex bg-[#1B2A20] lg:bg-[#ECE6D6] border border-[#F2EFE3]/15 lg:border-[#101B14]/15 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-[3px] flex-col items-end shadow-xs">
          <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase text-[#D9A63E] lg:text-[#3F6B47] tracking-wider">
            Clearance Level
          </span>
          <span className="font-extrabold text-[#F2EFE3] lg:text-[#101B14] font-mono uppercase text-[11px] sm:text-xs">
            {authData.role}
          </span>
        </div>

        {/* User Profile Avatar */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[3px] bg-[#1B2A20] lg:bg-[#101B14] text-[#F2EFE3] flex items-center justify-center font-bold text-xs sm:text-sm shadow-md font-mono border border-[#D9A63E]/60 relative shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9A63E] absolute top-1 right-1"></span>
          {authData.email ? authData.email.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};