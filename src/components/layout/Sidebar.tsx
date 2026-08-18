import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
    userRole: string;
    onLogout: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    userRole,
    onLogout,
    isOpen = false,
    onClose = () => {},
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';
    const prefix = isProprietor ? '/proprietor' : '/manager';

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose(); // Automatically close mobile drawer after navigation
    };

    const navItemClass = (path: string) => {
        const isActive = location.pathname === path;
        return `w-full flex items-center space-x-3 px-4 py-3 rounded-none text-[0.88rem] font-medium transition-all duration-150 cursor-pointer ${
            isActive
                ? 'bg-[#1B2A20] text-[#F2EFE3] border-l-4 border-[#D9A63E]'
                : 'text-[#8FA091] hover:text-[#F2EFE3] hover:bg-[#1B2A20]/50'
        }`;
    };

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 lg:hidden transition-opacity"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar / Slide-Over Container */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#101B14] text-[#F2EFE3] border-r border-[#F2EFE3]/10 flex flex-col justify-between shrink-0 h-full font-sans shadow-xl transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="flex flex-col h-full overflow-y-auto">
                    {/* Brand Header */}
                    <div className="p-5 sm:p-6 border-b border-[#F2EFE3]/10 mb-2 flex items-center justify-between">
                        <div>
                            <div className="font-['Fraunces',serif] font-semibold text-[1.3rem] flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#D9A63E]"></span>
                                <span className="text-[#F2EFE3] tracking-tight">Farma</span>
                            </div>
                            <div className="mt-2 inline-block px-2 py-0.5 rounded bg-[#1B2A20] border border-[#F2EFE3]/10">
                                <p className="text-[10px] font-mono font-medium text-[#D9A63E] uppercase tracking-wider">
                                    {isProprietor ? 'Proprietor Portal' : 'Manager Portal'}
                                </p>
                            </div>
                        </div>

                        {/* Mobile Close Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="lg:hidden p-1.5 rounded hover:bg-[#1B2A20] text-[#8FA091] hover:text-[#F2EFE3] transition-colors cursor-pointer"
                            aria-label="Close sidebar"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation Links Group */}
                    <nav className="space-y-6 pb-6 flex-1">
                        {/* GENERAL OVERVIEW */}
                        <div>
                            <div className="px-4 pb-2">
                                <span className="text-[10px] font-mono font-bold text-[#8FA091]/70 uppercase tracking-widest">
                                    General
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/dashboard`)}
                                className={navItemClass(`${prefix}/dashboard`)}
                            >
                                <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                <span>Dashboard</span>
                            </button>
                        </div>

                        {/* INFRASTRUCTURE & STOCK */}
                        <div>
                            <div className="px-4 pb-2">
                                <span className="text-[10px] font-mono font-bold text-[#8FA091]/70 uppercase tracking-widest">
                                    Infrastructure &amp; Stock
                                </span>
                            </div>
                            
                            {isProprietor && (
                                <button
                                    type="button"
                                    onClick={() => handleNavigation(`${prefix}/managers`)}
                                    className={navItemClass(`${prefix}/managers`)}
                                >
                                    <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span>Personnel (Managers)</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/farms`)}
                                className={navItemClass(`${prefix}/farms`)}
                            >
                                <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>Farm Facilities</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/sections`)}
                                className={navItemClass(`${prefix}/sections`)}
                            >
                                <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Containment Pens</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/batches`)}
                                className={navItemClass(`${prefix}/batches`)}
                            >
                                <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span>Flock Batches</span>
                            </button>
                        </div>

                        {/* OPERATIONS & AUDITING */}
                        <div>
                            <div className="px-4 pb-2">
                                <span className="text-[10px] font-mono font-bold text-[#8FA091]/70 uppercase tracking-widest">
                                    Operations &amp; Auditing
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/daily-logs`)}
                                className={navItemClass(`${prefix}/daily-logs`)}
                            >
                                <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                <span>Daily Logs &amp; Telemetry</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/inventory`)}
                                className={navItemClass(`${prefix}/inventory`)}
                            >
                                <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <span>Inventory &amp; Supplies</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/financials`)}
                                className={navItemClass(`${prefix}/financials`)}
                            >
                                <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Financial P&amp;L</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/analytics`)}
                                className={navItemClass(`${prefix}/analytics`)}
                            >
                                <svg className="w-4 h-4 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                                <span>Biosecurity &amp; Analytics</span>
                            </button>
                        </div>
                    </nav>

                    {/* Footer Session Actions */}
                    <div className="p-4 border-t border-[#F2EFE3]/10 bg-[#101B14]">
                        <div className="px-2 pb-2 text-[11px] font-mono text-[#8FA091]">
                            Role: <span className="font-bold text-[#D9A63E] uppercase">{userRole}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onLogout();
                            }}
                            className="w-full text-left px-3 py-2.5 rounded-[3px] text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-2.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};