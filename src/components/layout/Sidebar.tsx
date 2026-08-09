import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
    userRole: string;
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    userRole,
    onLogout,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 shrink-0 h-full z-20">
            <div className="space-y-6">
                {/* Logo / Brand Header */}
                <div className="flex items-center space-x-3 px-2">
                    <div className="w-10 h-10 rounded-xl bg-[#C2410C] flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
                        🌾
                    </div>
                    <div>
                        <h1 className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                            FARMA
                        </h1>
                        <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 uppercase">
                            {isProprietor ? 'Proprietor Control' : 'Manager Workspace'}
                        </p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1">
                    {/* GENERAL OVERVIEW */}
                    <div className="pb-1">
                        <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider px-3">
                            GENERAL OVERVIEW
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/dashboard'
                            ? 'bg-[#C2410C] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>📊</span>
                        <span>System Dashboard</span>
                    </button>

                    {/* INFRASTRUCTURE & STOCK */}
                    <div className="pt-4 pb-1">
                        <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider px-3">
                            INFRASTRUCTURE & STOCK
                        </span>
                    </div>

                    {/* 🔒 Proprietor / Admin Only Navigation Item */}
                    {isProprietor && (
                        <button
                            type="button"
                            onClick={() => navigate('/managers')}
                            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/managers'
                                ? 'bg-[#C2410C] text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <span>👥</span>
                            <span>Personnel (Managers)</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => navigate('/farms')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/farms'
                            ? 'bg-[#C2410C] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>🚜</span>
                        <span>Farm Facilities</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/sections')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/sections'
                            ? 'bg-[#C2410C] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>🏠</span>
                        <span>Containment Pens</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/batches')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/batches'
                            ? 'bg-[#C2410C] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>🐣</span>
                        <span>Flock Batches</span>
                    </button>

                    {/* OPERATIONS & AUDITING */}
                    <div className="pt-4 pb-1">
                        <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider px-3">
                            OPERATIONS & AUDITING
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/daily-logs')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/daily-logs'
                            ? 'bg-[#C2410C] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>📝</span>
                        <span>Daily Logs & Telemetry</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/inventory')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/inventory'
                            ? 'bg-[#C2410C] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>📦</span>
                        <span>Inventory & Supplies</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/financials')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/financials'
                            ? 'bg-[#C2410C] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>💰</span>
                        <span>Financial Intelligence & P&L</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/analytics')}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${location.pathname === '/analytics'
                                ? 'bg-[#C2410C] text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <span>📈</span>
                        <span>Biosecurity Radar & Analytics</span>
                    </button>
                </nav>
            </div>

            {/* Footer Session Actions */}
            <div className="pt-4 border-t border-slate-200">
                <div className="px-3 pb-2 text-[10px] font-mono text-slate-400">
                    Role: <span className="font-bold text-emerald-700">{userRole}</span>
                </div>
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                    Terminate Session
                </button>
            </div>
        </aside>
    );
};