import React from 'react';
import type { AuthResponseDto } from '../../types/auth';

interface HeaderBarProps {
  authData: AuthResponseDto;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ authData }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F5F1E6] border-b border-[#101B14]/10 px-6 py-3.5 flex items-center justify-between font-sans shadow-xs text-[#101B14]">
      <div>
        <h2 className="text-sm font-bold text-[#101B14] flex items-center space-x-2">
          <span className="text-[#3F6B47] text-xs font-mono uppercase tracking-wider font-extrabold">Operator:</span>
          <span className="text-[#101B14] font-mono tracking-tight">{authData.email}</span>
        </h2>
        <span className="text-[11px] text-[#101B14]/70 font-mono">
          Enterprise Tenant ID: #{authData.organisationId ?? 'System Admin'}
        </span>
      </div>

      {/* Profile Header Badges with lighter tone contrast */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="bg-[#ECE6D6] border border-[#101B14]/15 px-3.5 py-1.5 rounded-[3px] flex flex-col items-end shadow-xs">
          <span className="text-[9px] font-mono font-bold uppercase text-[#3F6B47] tracking-wider">
            Clearance Level
          </span>
          <span className="font-extrabold text-[#101B14] font-mono uppercase">
            {authData.role}
          </span>
        </div>

        <div className="w-10 h-10 rounded-[3px] bg-[#101B14] text-[#F2EFE3] flex items-center justify-center font-bold text-sm shadow-md font-mono border border-[#D9A63E]/40 relative">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9A63E] absolute top-1 right-1"></span>
          {authData.email.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};