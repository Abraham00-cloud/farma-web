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
    
    const roleString = userRole ? userRole.toUpperCase() : '';
    const isProprietor = roleString === 'PROPRIETOR' || roleString === 'ADMIN';
    const prefix = isProprietor ? '/proprietor' : '/manager';

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose(); 
    };

    const navItemClass = (path: string) => {
        const isActive = location.pathname === path;
        return `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm transition-colors duration-200 cursor-pointer ${
            isActive
                ? 'bg-farma-gold/10 text-farma-gold font-bold shadow-sm'
                : 'text-white/60 font-medium hover:text-white hover:bg-white/5'
        }`;
    };

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-farma-forest/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-farma-forest text-farma-cream flex flex-col justify-between shrink-0 h-full font-sans shadow-2xl transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
                    
                    <div className="p-6 border-b border-white/10 mb-4 flex items-start justify-between">
                        <div className="flex flex-col gap-3">
                            <div className="font-bold text-2xl flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-farma-gold text-farma-forest shadow-sm">
                                    <span className="font-bold text-lg leading-none mt-0.5">F</span>
                                </div>
                                <span className="tracking-tight text-white">Farma</span>
                            </div>
                            
                            <div className="inline-flex px-2.5 py-1 rounded-md bg-farma-green/20 border border-farma-green/30 w-fit">
                                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                    {isProprietor ? 'Organisation Owner' : 'Facility Manager'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                            aria-label="Close sidebar"
                        >
                            <IconClose className="w-4 h-4" />
                        </button>
                    </div>

                    <nav className="flex-1 px-4 space-y-8 pb-6">
                        
                        <div className="space-y-1.5">
                            <div className="px-2 mb-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    Overview
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/dashboard`)}
                                className={navItemClass(`${prefix}/dashboard`)}
                            >
                                <IconDashboard className="w-5 h-5 opacity-80" />
                                <span>Dashboard</span>
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <div className="px-2 mb-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    Organisation Setup
                                </span>
                            </div>
                            
                            {isProprietor && (
                                <button
                                    type="button"
                                    onClick={() => handleNavigation(`${prefix}/managers`)}
                                    className={navItemClass(`${prefix}/managers`)}
                                >
                                    <IconUsers className="w-5 h-5 opacity-80" />
                                    <span>Staff & Managers</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/farms`)}
                                className={navItemClass(`${prefix}/farms`)}
                            >
                                <IconFarm className="w-5 h-5 opacity-80" />
                                <span>Farm Facilities</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/sections`)}
                                className={navItemClass(`${prefix}/sections`)}
                            >
                                <IconPen className="w-5 h-5 opacity-80" />
                                <span>Pens & Houses</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/batches`)}
                                className={navItemClass(`${prefix}/batches`)}
                            >
                                <IconBatch className="w-5 h-5 opacity-80" />
                                <span>Flock Batches</span>
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <div className="px-2 mb-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    Daily Operations
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/daily-logs`)}
                                className={navItemClass(`${prefix}/daily-logs`)}
                            >
                                <IconLogs className="w-5 h-5 opacity-80" />
                                <span>Daily Activity Logs</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/inventory`)}
                                className={navItemClass(`${prefix}/inventory`)}
                            >
                                <IconInventory className="w-5 h-5 opacity-80" />
                                <span>Warehouse Inventory</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleNavigation(`${prefix}/analytics`)}
                                className={navItemClass(`${prefix}/analytics`)}
                            >
                                <IconAnalytics className="w-5 h-5 opacity-80" />
                                <span>Health &amp; Analytics</span>
                            </button>

                            {isProprietor && (
                                <button
                                    type="button"
                                    onClick={() => handleNavigation(`${prefix}/financials`)}
                                    className={navItemClass(`${prefix}/financials`)}
                                >
                                    <IconFinancials className="w-5 h-5 opacity-80" />
                                    <span>Financial P&amp;L</span>
                                </button>
                            )}
                        </div>
                    </nav>

                    <div className="p-4 bg-white/5 border-t border-white/10 m-4 rounded-xl">
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onLogout();
                            }}
                            className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold bg-farma-terracotta/10 text-farma-terracotta hover:bg-farma-terracotta hover:text-white transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group"
                        >
                            <IconLogout className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Log Out</span>
                        </button>
                    </div>

                </div>
            </aside>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </>
    );
};

// ==========================================
// Reusable SVG Components
// ==========================================

const IconClose = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconDashboard = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const IconUsers = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const IconFarm = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const IconPen = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
);

const IconBatch = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const IconLogs = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const IconInventory = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
);

const IconAnalytics = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const IconFinancials = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconLogout = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);