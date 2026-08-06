import React from 'react';
import type { AuthResponseDto } from '../../types/auth';

interface HeaderBarProps {
  authData: AuthResponseDto;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ authData }) => {
  return (
    <header className="bg-white border-b border-[#E1E6E2] px-6 py-3.5 flex items-center justify-between font-sans shadow-2xs">
      <div>
        <h2 className="text-sm font-bold text-[#1C2A26] flex items-center space-x-2">
          <span>Active Operator:</span>
          <span className="text-[#C2410C] font-mono">{authData.email}</span>
        </h2>
        <span className="text-[11px] text-slate-500 font-mono">
          Enterprise Tenant ID: #{authData.organisationId ?? 'System Admin'}
        </span>
      </div>

      {/* Profile Header Badges (Matching SQI school portal structure) */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="bg-[#F3F5F3] border border-[#E1E6E2] px-3.5 py-1.5 rounded-xl flex flex-col items-end">
          <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider">
            Clearance Level
          </span>
          <span className="font-extrabold text-[#15803D] font-mono">
            {authData.role}
          </span>
        </div>

        <div className="w-10 h-10 rounded-xl bg-[#1C2A26] text-white flex items-center justify-center font-bold text-sm shadow-xs font-mono border border-[#2A3D38]">
          {authData.email.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};