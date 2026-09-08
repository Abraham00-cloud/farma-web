import React, { useState } from 'react';

interface LandingPageProps {
    onProprietorClick: () => void;
    onManagerClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onProprietorClick, onManagerClick }) => {
    const [portalOpen, setPortalOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Pragmatic Ticker Data
    const tickerData = [
        { tag: 'FLOCK-A1', label: 'Feed Conversion 1.48 (Optimal)', state: 'ok' },
        { tag: 'PEN-B2', label: 'Temperature Alert: 34.5°C', state: 'warn' },
        { tag: 'INVENTORY', label: 'Feed stock updated', state: 'ok' },
        { tag: 'HEALTH', label: 'Daily checks completed', state: 'ok' },
        { tag: 'FLOCK-D4', label: 'Average weight +1.2kg', state: 'ok' },
        { tag: 'PEN-A1', label: 'Mortality spike detected', state: 'warn' },
        { tag: 'SYSTEM', label: 'All facilities synced', state: 'ok' },
        { tag: 'FINANCE', label: 'Net Profit Margin 34.1%', state: 'ok' },
    ];

    const navLinks = [
        { label: 'Home', path: '#home' },
        { label: 'About', path: '/about' },
        { label: 'How it Works', path: '#architecture' },
        { label: 'Pricing', path: '#pricing' },
        { label: 'Testimonials', path: '#testimonials' },
        { label: 'Contact', path: '/contact' }
    ];

    const closeAllMenus = () => {
        setPortalOpen(false);
        setMobileMenuOpen(false);
    };

    return (
        <div className="font-['IBM_Plex_Sans',sans-serif] bg-[#ECE6D6] text-[#161F17] antialiased scroll-smooth selection:bg-[#3F6B47] selection:text-white min-h-screen overflow-x-hidden relative">
            
            {/* Inject Google Fonts & Ticker Animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
                
                @keyframes scroll-ticker {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-ticker {
                    animation: scroll-ticker 38s linear infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .animate-ticker { animation: none; }
                }
            `}} />

            {/* ===== NAV ===== */}
            <header className="sticky top-0 z-50 bg-[#101B14]/95 backdrop-blur-md border-b border-[#F2EFE3]/10 text-[#F2EFE3]">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 flex items-center justify-between h-[72px]">
                    <a href="#home" onClick={closeAllMenus} className="font-['Fraunces',serif] font-semibold text-[1.4rem] flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {/* 🟢 FIXED LOGO: Gold Box, Dark F for high contrast on Dark Nav */}
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#D9A63E] text-[#101B14] shadow-sm">
                            <span className="font-bold text-xl leading-none">F</span>
                        </div>
                        Farma
                    </a>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-8 lg:gap-9">
                        {navLinks.map((item) => (
                            <a key={item.label} href={item.path} className="text-[0.92rem] opacity-80 hover:opacity-100 transition-opacity relative group py-1">
                                {item.label}
                                <span className="absolute left-0 right-0 -bottom-1 h-[1px] bg-[#D9A63E] scale-x-0 origin-left transition-transform duration-250 group-hover:scale-x-100"></span>
                            </a>
                        ))}
                    </nav>

                    {/* Desktop Farm Portal Dropdown */}
                    <div className="relative hidden md:block">
                        <button
                            onClick={() => setPortalOpen(!portalOpen)}
                            className="font-['IBM_Plex_Mono',monospace] text-[0.78rem] tracking-[0.04em] bg-[#D9A63E] hover:bg-[#e9b752] text-[#101B14] px-4 py-2.5 rounded-[3px] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            System Login
                            <svg className={`w-3 h-3 transition-transform duration-200 ${portalOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 8" fill="none">
                                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>

                        {/* Dropdown Options */}
                        <div className={`absolute top-[calc(100%+10px)] right-0 bg-[#1B2A20] border border-[#F2EFE3]/10 rounded-md w-[280px] p-2 shadow-2xl transition-all duration-200 origin-top-right z-50 ${portalOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible -translate-y-2 scale-95'}`}>
                            <button onClick={() => { closeAllMenus(); onProprietorClick(); }} className="w-full text-left flex flex-col gap-0.5 p-3 rounded hover:bg-[#233327] transition-colors cursor-pointer">
                                <span className="text-[0.88rem] font-semibold text-[#F2EFE3]">Organisation Owner</span>
                                <span className="text-[0.74rem] text-[#D9A63E] font-['IBM_Plex_Mono',monospace]">Master Dashboard &amp; Finances</span>
                            </button>
                            <div className="h-[1px] bg-[#F2EFE3]/10 my-1 mx-1"></div>
                            <button onClick={() => { closeAllMenus(); onManagerClick(); }} className="w-full text-left flex flex-col gap-0.5 p-3 rounded hover:bg-[#233327] transition-colors cursor-pointer">
                                <span className="text-[0.88rem] font-semibold text-[#F2EFE3]">Facility Manager</span>
                                <span className="text-[0.74rem] text-[#8FA091] font-['IBM_Plex_Mono',monospace]">Daily Logs &amp; Pen Tracking</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                        className="flex md:hidden flex-col justify-center items-center gap-1.5 w-10 h-10 rounded hover:bg-[#F2EFE3]/10 transition-colors cursor-pointer"
                    >
                        <span className={`w-6 h-[2px] bg-[#F2EFE3] transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-[8px]' : ''}`}></span>
                        <span className={`w-6 h-[2px] bg-[#F2EFE3] transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                        <span className={`w-6 h-[2px] bg-[#F2EFE3] transition-all duration-200 ${mobileMenuOpen ? '-translate-y-[8px] -rotate-45' : ''}`}></span>
                    </button>
                </div>

                {/* ===== MOBILE MENU DRAWER ===== */}
                <div className={`md:hidden fixed inset-x-0 top-[72px] bg-[#101B14] border-b border-[#F2EFE3]/10 p-5 transition-all duration-300 z-40 shadow-2xl ${mobileMenuOpen ? 'max-h-[calc(100vh-72px)] opacity-100 overflow-y-auto visible' : 'max-h-0 opacity-0 overflow-hidden invisible'}`}>
                    <nav className="flex flex-col gap-4 mb-6">
                        {navLinks.map((item) => (
                            <a
                                key={item.label}
                                href={item.path}
                                onClick={closeAllMenus}
                                className="text-[1.05rem] font-medium text-[#F2EFE3] hover:text-[#D9A63E] transition-colors border-b border-[#F2EFE3]/5 pb-2.5"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>

                    <div className="bg-[#1B2A20] border border-[#F2EFE3]/10 rounded-md p-3.5 space-y-2">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.1em] text-[#D9A63E] uppercase block mb-1">
                            System Access
                        </span>
                        <button
                            onClick={() => { closeAllMenus(); onProprietorClick(); }}
                            className="w-full text-left p-3 rounded bg-[#101B14] border border-[#F2EFE3]/10 text-[#F2EFE3] flex flex-col gap-0.5 active:bg-[#233327]"
                        >
                            <span className="text-[0.9rem] font-semibold">Organisation Owner</span>
                            <span className="text-[0.74rem] text-[#D9A63E] font-['IBM_Plex_Mono',monospace]">Master Dashboard &amp; Finances</span>
                        </button>
                        <button
                            onClick={() => { closeAllMenus(); onManagerClick(); }}
                            className="w-full text-left p-3 rounded bg-[#101B14] border border-[#F2EFE3]/10 text-[#F2EFE3] flex flex-col gap-0.5 active:bg-[#233327]"
                        >
                            <span className="text-[0.9rem] font-semibold">Facility Manager</span>
                            <span className="text-[0.74rem] text-[#8FA091] font-['IBM_Plex_Mono',monospace]">Daily Logs &amp; Pen Tracking</span>
                        </button>
                    </div>
                </div>
            </header>

            {(portalOpen || mobileMenuOpen) && (
                <div onClick={closeAllMenus} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"></div>
            )}

            {/* ===== HERO ===== */}
            <section id="home" className="relative bg-[#101B14] text-[#F2EFE3] overflow-hidden pt-12 sm:pt-20">
                {/* Ambient Brand Orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#3F6B47] rounded-full mix-blend-screen filter blur-[150px] opacity-40 pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#D9A63E] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none"></div>
                
                <div className="absolute inset-0 opacity-90" style={{
                    background: `repeating-linear-gradient(180deg, transparent 0 64px, rgba(63,107,71,0.16) 64px 66px), linear-gradient(180deg, transparent 55%, #101B14 100%)`
                }}></div>

                <div className="relative z-10 text-center pb-12 sm:pb-16 max-w-[1180px] mx-auto px-4 sm:px-8">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.7rem] sm:text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#D9A63E] mb-4 sm:mb-5 block">
                        The Operating System for Modern Poultry
                    </span>
                    <h1 className="font-['Fraunces',serif] font-medium text-[clamp(2.1rem,5.4vw,4.4rem)] leading-[1.1] tracking-[-0.01em] max-w-[820px] mx-auto mb-5 sm:mb-6">
                        Run your entire farm network from <em className="italic text-[#D9A63E] font-medium not-italic">one dashboard.</em>
                    </h1>
                    <p className="max-w-[650px] mx-auto mb-8 sm:mb-10 text-[0.98rem] sm:text-[1.08rem] leading-[1.6] text-[#8FA091]">
                        Whether your organisation operates a single facility or a network of farms across the state, Farma connects your managers in the field directly to your financial ledger.
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3.5 max-w-md sm:max-w-none mx-auto mb-12 sm:mb-16">
                        <button onClick={onProprietorClick} className="w-full sm:w-auto text-center px-8 py-3.5 rounded-[3px] font-semibold text-[0.94rem] bg-[#D9A63E] text-[#101B14] hover:bg-[#e9b752] transition-colors cursor-pointer shadow-lg shadow-[#D9A63E]/20">
                            Register Your Organisation
                        </button>
                        <a href="#architecture" className="w-full sm:w-auto text-center bg-[#3F6B47] hover:bg-[#4E7F55] text-[#F2EFE3] px-8 py-3.5 rounded-[3px] font-semibold text-[0.94rem] border border-[#3F6B47] transition-all hover:-translate-y-[1px]">
                            See How it Works
                        </a>
                    </div>
                </div>

                {/* Ticker Band */}
                <div className="relative z-10 border-t border-[#F2EFE3]/10 bg-[#1B2A20] overflow-hidden py-3.5 shadow-xl">
                    <div className="flex w-max animate-ticker">
                        {[...tickerData, ...tickerData].map((t, i) => (
                            <div key={i} className="flex items-center gap-2.5 font-['IBM_Plex_Mono',monospace] text-[0.74rem] sm:text-[0.78rem] text-[#8FA091] px-4 sm:px-6 border-r border-[#F2EFE3]/10 whitespace-nowrap">
                                <span className={`w-1.5 h-1.5 rounded-full ${t.state === 'ok' ? 'bg-[#4E7F55]' : 'bg-[#D9A63E]'}`}></span>
                                <b className="text-[#F2EFE3] font-semibold">{t.tag}</b>
                                <span>{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PRAGMATIC TRUST BADGES ===== */}
            <div className="bg-[#F5F1E6] border-b border-[#101B14]/10 py-6 sm:py-7">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 flex flex-wrap justify-center items-center gap-x-6 sm:gap-x-12 gap-y-4">
                    {[
                        { icon: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11m-8-11v11', label: 'Multi-Farm Management' },
                        { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: 'Role-Based Access Control' },
                        { icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', label: 'Real-Time Data Syncing' },
                        { icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm1-13h-2v4H9v2h2v4h2v-4h2V9h-2V7z', label: 'Automated Financial Ledger' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 font-['IBM_Plex_Mono',monospace] text-[0.8rem] sm:text-[0.85rem] text-[#101B14]/80 font-medium">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#3F6B47] shrink-0">
                                <path d={item.icon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* HOW IT WORKS: THE MULTI-TENANCY PITCH */}
            <section id="architecture" className="py-16 sm:py-24 max-w-[1180px] mx-auto px-4 sm:px-8 relative">
                <div className="max-w-[700px] mb-12 sm:mb-16">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#3F6B47] mb-3 block">
                        How Farma Works
                    </span>
                    <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                        Built for the organisation. Simple for the facilities.
                    </h2>
                    <p className="mt-4 text-[#4b564d] text-[1rem] sm:text-[1.05rem] leading-[1.6]">
                        Stop chasing managers for weekly reports. Farma connects the people working in the pens directly to the owner making the financial decisions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { 
                            tag: 'THE OWNER', 
                            title: 'Master Dashboard', 
                            desc: 'You create the central organisation account. Add as many farm locations as you own, manage global inventory, and see exactly how much profit every single flock is generating.', 
                            metric: '▲ Full Financial Access', 
                            icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' 
                        },
                        { 
                            tag: 'THE MANAGER', 
                            title: 'Facility Operations', 
                            desc: 'You assign managers to specific farm locations. They log in daily to record feed usage, report bird health, and log mortalities—without ever seeing the master financial ledger.', 
                            metric: '▲ Restricted Operations Access', 
                            icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' 
                        },
                        { 
                            tag: 'THE PLATFORM', 
                            title: 'Aggregated Data', 
                            desc: 'As managers log data in the field, your central dashboard automatically calculates the live cost per bird, deducts feed inventory, and alerts you of disease outbreaks.', 
                            metric: '▲ Real-Time Syncing', 
                            icon: 'M18 20V10 M12 20V4 M6 20v-6' 
                        },
                    ].map((mod, i) => (
                        <div key={i} className="bg-white hover:shadow-xl p-8 flex flex-col gap-5 transition-all duration-300 border border-[#101B14]/10 rounded-2xl">
                            {/* 🟢 Dark Icon Box for Light Background Cards (Rule A) */}
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-xl bg-[#101B14] text-[#D9A63E] flex items-center justify-center shrink-0 shadow-md">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6"><path d={mod.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <span className="font-['IBM_Plex_Mono',monospace] text-[0.7rem] tracking-[0.05em] text-[#101B14] bg-[#D9A63E] px-2.5 py-1 rounded-[2px] font-semibold">
                                    {mod.tag}
                                </span>
                            </div>
                            <h3 className="font-['Fraunces',serif] font-bold text-[1.4rem] text-[#101B14]">{mod.title}</h3>
                            <p className="text-[#4b564d] text-[0.95rem] leading-[1.6]">{mod.desc}</p>
                            <div className="mt-auto pt-4 border-t border-[#101B14]/10 font-['IBM_Plex_Mono',monospace] text-[0.78rem] text-[#3F6B47] font-bold uppercase tracking-wider">
                                {mod.metric}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== CORE CAPABILITIES ===== */}
            <section className="bg-[#101B14] text-[#F2EFE3] py-20 sm:py-28 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3F6B47] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none"></div>

                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 relative z-10">
                    <div className="max-w-[640px] mb-12 sm:mb-16">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#D9A63E] mb-3 block">
                            Core Capabilities
                        </span>
                        <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                            Stop guessing. Start tracking.
                        </h2>
                        <p className="mt-3.5 text-[#8FA091] text-[1rem] leading-[1.6]">
                            Everything you need to run a profitable poultry operation, stripped of unnecessary complexity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#F2EFE3]/10 border border-[#F2EFE3]/10">
                        {[
                            { num: '01', title: 'Live Bird Tracking', desc: 'Know exactly how many birds are alive across all your facilities today. The system automatically adjusts population counts when managers log daily mortalities.' },
                            { num: '02', title: 'Automated Cost Calculation', desc: 'Every time a manager logs feed usage, Farma calculates the exact financial cost of that feed and updates your live Profit & Loss margin for that specific flock.' },
                            { num: '03', title: 'Centralized Inventory', desc: 'Track every bag of feed and bottle of vaccine in your warehouse. See exactly what resources have been consumed and what needs to be restocked.' },
                            { num: '04', title: 'Health & System Alerts', desc: 'Get instant notifications on your master dashboard if any facility reports a sudden drop in feed consumption or an unexplained mortality spike.' }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#101B14] p-8 sm:p-10 flex gap-5 items-start hover:bg-[#16241a] transition-colors">
                                <span className="font-['IBM_Plex_Mono',monospace] text-[0.8rem] text-[#D9A63E] border border-[#D9A63E]/40 rounded-[2px] px-2.5 py-1.5 shrink-0 mt-0.5">
                                    {item.num}
                                </span>
                                <div>
                                    <h3 className="font-['Fraunces',serif] font-bold text-[1.2rem] mb-2">{item.title}</h3>
                                    <p className="text-[#8FA091] text-[0.95rem] leading-[1.6]">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PRICING ===== */}
            <section id="pricing" className="bg-[#ECE6D6] py-20">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
                    <div className="text-center max-w-[640px] mx-auto mb-14">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-bold text-[#3F6B47] mb-3 block">Pricing</span>
                        <h2 className="font-['Fraunces',serif] font-bold text-[clamp(2rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em] text-[#101B14]">
                            Software that scales with your flock
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-[#101B14]/10 rounded-2xl p-8 flex flex-col hover:shadow-lg transition-shadow">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase font-bold tracking-[0.08em]">Homestead</span>
                            <h3 className="font-['Fraunces',serif] text-3xl font-bold mt-2 mb-1 text-[#101B14]">Starter</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] text-[#101B14]/60 mb-6">Single farm operations</p>
                            <ul className="flex flex-col gap-3 mb-8">
                                {['Basic daily logging', 'Up to 2 manager seats', 'Live Profit tracking'].map(f => (
                                    <li key={f} className="text-[0.9rem] text-[#101B14]/80 flex gap-3 items-center"><span className="text-[#3F6B47] font-bold">✓</span>{f}</li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => { closeAllMenus(); onProprietorClick(); }} 
                                className="mt-auto block w-full text-center px-6 py-3.5 rounded-xl font-bold text-[0.92rem] border-2 border-[#101B14] text-[#101B14] hover:bg-[#101B14] hover:text-white transition-colors cursor-pointer"
                            >
                                Start for Free
                            </button>
                        </div>

                        <div className="bg-white border-2 border-[#3F6B47] rounded-2xl p-8 flex flex-col relative shadow-xl transform md:-translate-y-4">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#3F6B47] text-white font-['IBM_Plex_Mono',monospace] text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">Most Popular</div>
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase font-bold tracking-[0.08em] mt-2">Enterprise</span>
                            <h3 className="font-['Fraunces',serif] text-3xl font-bold mt-2 mb-1 text-[#101B14]">Precision</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] text-[#101B14]/60 mb-6">Multi-farm agribusiness</p>
                            <ul className="flex flex-col gap-3 mb-8">
                                {['Unlimited farm facilities', 'Automated Health Alerts', 'Centralized Inventory', 'Role-based dashboards'].map(f => (
                                    <li key={f} className="text-[0.9rem] text-[#101B14]/80 flex gap-3 items-center"><span className="text-[#3F6B47] font-bold">✓</span>{f}</li>
                                ))}
                            </ul>
                            <a 
                                href="https://wa.me/2349137772112?text=Hello%20Farma%20Team!%20I%20am%20interested%20in%20the%20Precision%20Plan%20for%20my%20farm." 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-auto block text-center px-6 py-3.5 rounded-xl font-bold text-[0.92rem] bg-[#3F6B47] text-[#F2EFE3] hover:bg-[#2A5C38] transition-colors shadow-lg shadow-[#3F6B47]/20"
                            >
                                Chat on WhatsApp
                            </a>
                        </div>

                        <div className="bg-white border border-[#101B14]/10 rounded-2xl p-8 flex flex-col hover:shadow-lg transition-shadow">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase font-bold tracking-[0.08em]">Custom</span>
                            <h3 className="font-['Fraunces',serif] text-3xl font-bold mt-2 mb-1 text-[#101B14]">Corporate</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] text-[#101B14]/60 mb-6">State-wide cooperatives</p>
                            <ul className="flex flex-col gap-3 mb-8">
                                {['Everything in Precision', 'Custom software integrations', 'Dedicated support manager'].map(f => (
                                    <li key={f} className="text-[0.9rem] text-[#101B14]/80 flex gap-3 items-center"><span className="text-[#3F6B47] font-bold">✓</span>{f}</li>
                                ))}
                            </ul>
                            <a 
                                href="mailto:support@farma.com.ng?subject=Inquiry:%20Farma%20Corporate%20Plan" 
                                className="mt-auto block text-center px-6 py-3.5 rounded-xl font-bold text-[0.92rem] border-2 border-[#101B14]/20 text-[#101B14] hover:border-[#101B14] transition-colors"
                            >
                                Email our Team
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== PRAGMATIC TESTIMONIALS ===== */}
            <section id="testimonials" className="py-20 max-w-[1180px] mx-auto px-4 sm:px-8 border-t border-[#101B14]/10">
                <div className="max-w-[640px] mb-12">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-bold text-[#3F6B47] mb-3 block">From the Field</span>
                    <h2 className="font-['Fraunces',serif] font-bold text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em] text-[#101B14]">
                        Agribusinesses running on Farma
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { q: "We used to wait until the end of the month to know if a flock was profitable. Farma shows us our costs live, every single day.", ini: "S.M.", name: "Organisation Owner", role: "Agro-Allied Enterprise" },
                        { q: "Logging daily feed and mortalities is so much easier now. I just put the numbers in my phone and the owner sees it instantly without me having to call.", ini: "D.V.", name: "Facility Manager", role: "Section Alpha, Oyo State" },
                        { q: "Connecting our different farm locations into one system stopped the endless phone calls and missing inventory reports.", ini: "P.A.", name: "Operations Director", role: "Multi-State Poultry Network" }
                    ].map((t, i) => (
                        <div key={i} className="bg-white shadow-sm border border-[#101B14]/10 rounded-2xl p-8 flex flex-col gap-4 relative">
                            <span className="absolute top-4 right-6 font-['Fraunces',serif] text-6xl text-[#D9A63E]/20 leading-none">“</span>
                            <p className="text-[1rem] leading-[1.6] text-[#101B14]/80 relative z-10 italic">"{t.q}"</p>
                            <div className="flex items-center gap-4 mt-auto pt-6 border-t border-[#101B14]/5">
                                <div className="w-10 h-10 rounded-xl bg-[#101B14] text-[#D9A63E] flex items-center justify-center font-['IBM_Plex_Mono',monospace] font-bold text-sm shrink-0 shadow-md">
                                    {t.ini}
                                </div>
                                <div>
                                    <div className="text-[0.9rem] font-bold text-[#101B14]">{t.name}</div>
                                    <div className="text-[0.75rem] text-[#101B14]/60 font-['IBM_Plex_Mono',monospace] uppercase tracking-wider mt-0.5">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== CTA BAND ===== */}
            <section id="demo" className="bg-[#3A5B6B] text-[#F2EFE3] py-20 text-center px-4 sm:px-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#101B14]/20"></div>
                <div className="relative z-10">
                    <h2 className="font-['Fraunces',serif] font-bold text-[clamp(2rem,3vw,2.5rem)] mb-4">
                        Ready to organize your farm?
                    </h2>
                    <p className="text-[#F2EFE3]/80 mb-8 max-w-[500px] mx-auto text-[1.05rem] leading-relaxed">
                        Talk to our team about onboarding your managers, flocks, and financial ledgers onto the Farma platform.
                    </p>
                    <a 
                        href="https://wa.me/2349137772112?text=Hello%20Farma%20Team!%20I%20would%20like%20to%20request%20a%20demo%20of%20the%20platform." 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-block px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider bg-[#D9A63E] text-[#101B14] hover:bg-[#c49332] hover:-translate-y-1 transition-all duration-300 shadow-xl shadow-[#101B14]/30"
                    >
                        Request a Demonstration
                    </a>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-[#101B14] text-[#F2EFE3] pt-16 pb-8 px-4 sm:px-8 border-t-4 border-[#D9A63E]">
                <div className="max-w-[1180px] mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-[#F2EFE3]/10">
                        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                            <a href="#home" onClick={closeAllMenus} className="font-['Fraunces',serif] font-bold text-2xl flex items-center gap-3 mb-4">
                                {/* 🟢 FIXED LOGO: Gold Box, Dark F for high contrast on Dark Footer */}
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#D9A63E] text-[#101B14]">
                                    <span className="font-bold text-lg leading-none">F</span>
                                </div>
                                Farma
                            </a>
                            <p className="text-[#8FA091] text-[0.9rem] leading-[1.6] max-w-[260px]">
                                The operating system for modern poultry organisations. Manage multiple farms, track live inventory, and monitor profits in real time.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#D9A63E] mb-5">Platform</h4>
                            <div className="flex flex-col gap-3 text-[0.9rem] text-[#8FA091]">
                                <a href="#architecture" className="hover:text-[#F2EFE3] transition-colors">How it Works</a>
                                <a href="#pricing" className="hover:text-[#F2EFE3] transition-colors">Pricing Plans</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#D9A63E] mb-5">Company</h4>
                            <div className="flex flex-col gap-3 text-[0.9rem] text-[#8FA091]">
                                <a href="/about" className="hover:text-[#F2EFE3] transition-colors">About Us</a>
                                <a href="/contact" className="hover:text-[#F2EFE3] transition-colors">Contact Support</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#D9A63E] mb-5">Legal</h4>
                            <div className="flex flex-col gap-3 text-[0.9rem] text-[#8FA091]">
                                <a href="/privacy" className="hover:text-[#F2EFE3] transition-colors">Privacy Policy</a>
                                <a href="/terms" className="hover:text-[#F2EFE3] transition-colors">Terms of Service</a>
                            </div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#D9A63E] mb-5">System Access</h4>
                            <div className="flex flex-col gap-3 text-[0.9rem] text-[#8FA091]">
                                <button onClick={() => { closeAllMenus(); onProprietorClick(); }} className="text-left hover:text-[#F2EFE3] transition-colors cursor-pointer">Organisation Owner</button>
                                <button onClick={() => { closeAllMenus(); onManagerClick(); }} className="text-left hover:text-[#F2EFE3] transition-colors cursor-pointer">Facility Manager</button>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 flex justify-between items-center flex-wrap gap-4 text-[0.8rem] text-[#8FA091] font-['IBM_Plex_Mono',monospace]">
                        <p>© {new Date().getFullYear()} Farma Technologies. All rights reserved.</p>
                        <div className="flex items-center gap-2 text-[#4E7F55] bg-[#4E7F55]/10 px-3 py-1.5 rounded-full border border-[#4E7F55]/20 font-bold uppercase tracking-wider text-[10px]">
                            <span className="w-2 h-2 rounded-full bg-[#4E7F55] animate-pulse"></span>
                            Systems Operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};