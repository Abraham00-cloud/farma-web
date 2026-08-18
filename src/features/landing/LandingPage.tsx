import React, { useState } from 'react';

interface LandingPageProps {
    onProprietorClick: () => void;
    onManagerClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onProprietorClick, onManagerClick }) => {
    const [portalOpen, setPortalOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const tickerData = [
        { tag: 'BATCH-A1', label: 'Live FCR 1.48 (Optimal)', state: 'ok' },
        { tag: 'PEN-B2', label: 'Heat Stress Alert: 34.5°C', state: 'warn' },
        { tag: 'LEDGER', label: 'Feed WAC updated', state: 'ok' },
        { tag: 'ZONE-C', label: 'Biosecurity status: NORMAL', state: 'ok' },
        { tag: 'BATCH-D4', label: 'Biomass growth +1.2kg', state: 'ok' },
        { tag: 'PEN-A1', label: 'Mortality spike > 1.5%', state: 'warn' },
        { tag: 'SYSTEM', label: 'JWT scopes verified', state: 'ok' },
        { tag: 'GLOBAL', label: 'Net P&L Margin 34.1%', state: 'ok' },
    ];

    const navLinks = [
        { label: 'Home', path: '#home' },
        { label: 'About', path: '/about' },
        { label: 'Architecture', path: '#architecture' },
        { label: 'Pricing', path: '#pricing' },
        { label: 'Testimonials', path: '#testimonials' },
        { label: 'Contact', path: '/contact' }
    ];

    const closeAllMenus = () => {
        setPortalOpen(false);
        setMobileMenuOpen(false);
    };

    return (
        <div className="font-['IBM_Plex_Sans',sans-serif] bg-[#ECE6D6] text-[#161F17] antialiased scroll-smooth selection:bg-[#3F6B47] selection:text-white min-h-screen overflow-x-hidden">
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
            <header className="sticky top-0 z-50 bg-[#101B14]/90 backdrop-blur-md border-b border-[#F2EFE3]/10 text-[#F2EFE3]">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 flex items-center justify-between h-[72px]">
                    <a href="#home" onClick={closeAllMenus} className="font-['Fraunces',serif] font-semibold text-[1.4rem] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D9A63E]"></span>
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
                            Farm Portal
                            <svg className={`w-3 h-3 transition-transform duration-200 ${portalOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 8" fill="none">
                                <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                        </button>

                        {/* Dropdown Options */}
                        <div className={`absolute top-[calc(100%+10px)] right-0 bg-[#1B2A20] border border-[#F2EFE3]/10 rounded-md w-[280px] p-2 shadow-2xl transition-all duration-200 origin-top-right z-50 ${portalOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible -translate-y-2 scale-95'}`}>
                            <button onClick={() => { closeAllMenus(); onProprietorClick(); }} className="w-full text-left flex flex-col gap-0.5 p-3 rounded hover:bg-[#233327] transition-colors cursor-pointer">
                                <span className="text-[0.88rem] font-semibold text-[#F2EFE3]">Proprietor / Admin Portal</span>
                                <span className="text-[0.74rem] text-[#D9A63E] font-['IBM_Plex_Mono',monospace]">Global Dashboard &amp; P&amp;L Ledger</span>
                            </button>
                            <div className="h-[1px] bg-[#F2EFE3]/10 my-1 mx-1"></div>
                            <button onClick={() => { closeAllMenus(); onManagerClick(); }} className="w-full text-left flex flex-col gap-0.5 p-3 rounded hover:bg-[#233327] transition-colors cursor-pointer">
                                <span className="text-[0.88rem] font-semibold text-[#F2EFE3]">Site Manager Portal</span>
                                <span className="text-[0.74rem] text-[#8FA091] font-['IBM_Plex_Mono',monospace]">Telemetry &amp; Biosecurity Hub</span>
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
                            Access Portals
                        </span>
                        <button
                            onClick={() => { closeAllMenus(); onProprietorClick(); }}
                            className="w-full text-left p-3 rounded bg-[#101B14] border border-[#F2EFE3]/10 text-[#F2EFE3] flex flex-col gap-0.5 active:bg-[#233327]"
                        >
                            <span className="text-[0.9rem] font-semibold">Proprietor / Admin Portal</span>
                            <span className="text-[0.74rem] text-[#D9A63E] font-['IBM_Plex_Mono',monospace]">Global Dashboards &amp; Finances</span>
                        </button>
                        <button
                            onClick={() => { closeAllMenus(); onManagerClick(); }}
                            className="w-full text-left p-3 rounded bg-[#101B14] border border-[#F2EFE3]/10 text-[#F2EFE3] flex flex-col gap-0.5 active:bg-[#233327]"
                        >
                            <span className="text-[0.9rem] font-semibold">Site Manager Portal</span>
                            <span className="text-[0.74rem] text-[#8FA091] font-['IBM_Plex_Mono',monospace]">Telemetry &amp; Active Batches</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Backdrop for closing dropdowns when clicking outside */}
            {(portalOpen || mobileMenuOpen) && (
                <div onClick={closeAllMenus} className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"></div>
            )}

            {/* ===== HERO ===== */}
            <section id="home" className="relative bg-[#101B14] text-[#F2EFE3] overflow-hidden pt-12 sm:pt-20">
                <div className="absolute inset-0 opacity-90" style={{
                    background: `repeating-linear-gradient(180deg, transparent 0 64px, rgba(63,107,71,0.16) 64px 66px), linear-gradient(180deg, transparent 55%, #101B14 100%)`
                }}></div>
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `radial-gradient(circle at 18% 30%, rgba(217,166,62,0.08), transparent 40%), radial-gradient(circle at 82% 15%, rgba(58,91,107,0.14), transparent 45%)`
                }}></div>

                <div className="relative z-10 text-center pb-12 sm:pb-16 max-w-[1180px] mx-auto px-4 sm:px-8">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.7rem] sm:text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#D9A63E] mb-4 sm:mb-5 block">
                        Enterprise Farm Management Information System
                    </span>
                    <h1 className="font-['Fraunces',serif] font-medium text-[clamp(2.1rem,5.4vw,4.4rem)] leading-[1.1] tracking-[-0.01em] max-w-[820px] mx-auto mb-5 sm:mb-6">
                        Data-Driven Precision for <em className="italic text-[#D9A63E] font-medium not-italic">Modern Agribusiness</em>
                    </h1>
                    <p className="max-w-[650px] mx-auto mb-8 sm:mb-10 text-[0.98rem] sm:text-[1.08rem] leading-[1.6] text-[#8FA091]">
                        Unify biological field telemetry, biosecurity state machines, and Weighted Average Cost (WAC) financial ledgers into a single, real-time cloud backend.
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3.5 max-w-md sm:max-w-none mx-auto mb-12 sm:mb-16">
                        <a href="#architecture" className="w-full sm:w-auto text-center bg-[#3F6B47] hover:bg-[#4E7F55] text-[#F2EFE3] px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] border border-[#3F6B47] transition-all hover:-translate-y-[1px]">
                            Explore the Platform
                        </a>
                        <button onClick={onProprietorClick} className="w-full sm:w-auto text-center px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] bg-[#D9A63E] text-[#101B14] hover:bg-[#e9b752] transition-colors cursor-pointer">
                            Launch Proprietor Workspace
                        </button>
                    </div>
                </div>

                {/* Ticker Band */}
                <div className="relative z-10 border-t border-[#F2EFE3]/10 bg-[#1B2A20] overflow-hidden py-3.5">
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

            {/* ===== TRUST BADGES ===== */}
            <div className="bg-[#F5F1E6] border-b border-[#101B14]/10 py-6 sm:py-7">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 flex flex-wrap justify-center items-center gap-x-6 sm:gap-x-8 gap-y-3.5">
                    {[
                        { icon: 'M12 2L3 6V12C3 16.5 6.6 20.7 12 22C17.4 20.7 21 16.5 21 12V6L12 2Z', label: 'Powered by AWS Cloud' },
                        { icon: 'M8 11V7a4 4 0 0 1 8 0v4', box: 'M5 11h14v9a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 20v-9z', label: 'Stateless JWT Security' },
                        { icon: 'M3 12h4l2-7 4 14 2-7h6', label: '< 45ms Query Latency' },
                        { icon: 'M9 12l2 2 4-4', circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', label: 'PostgreSQL Relational Core' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 font-['IBM_Plex_Mono',monospace] text-[0.76rem] sm:text-[0.8rem] text-[#101B14]/70">
                            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#3F6B47] shrink-0">
                                {item.box && <path d={item.box} stroke="currentColor" strokeWidth="1.6" />}
                                {item.circle && <path d={item.circle} stroke="currentColor" strokeWidth="1.6" />}
                                <path d={item.icon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== CORE MODULES ===== */}
            <section id="architecture" className="py-16 sm:py-24 max-w-[1180px] mx-auto px-4 sm:px-8">
                <div className="max-w-[640px] mb-10 sm:mb-14">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#3F6B47] mb-3 block">
                        Platform Architecture
                    </span>
                    <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                        Three engines, one source of truth.
                    </h2>
                    <p className="mt-3.5 text-[#4b564d] text-[0.98rem] sm:text-[1.02rem] leading-[1.6]">
                        Eliminate siloed records. Farma seamlessly bridges the gap between the barn and the boardroom.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0.5 bg-transparent md:bg-[#101B14]/10 md:border md:border-[#101B14]/10">
                    {[
                        { tag: 'ENGINE-01', title: 'Growth & Telemetry', desc: 'Track daily feed intake, water volume, and automatically compute live Feed Conversion Ratios (FCR) mid-cycle to visualize flock biomass trajectories.', metric: '▲ Analytics calculated hourly', icon: 'M2 12h4l2.5-7L13 19l2.5-7H22' },
                        { tag: 'ENGINE-02', title: 'Biosecurity State Machine', desc: 'Deterministic hazard defense. Get instant alerts and enforce manager workflows if mortality exceeds 1.5% or temperatures breach safe thresholds.', metric: '▲ Automated audit trailing', icon: 'M12 2L4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3z' },
                        { tag: 'ENGINE-03', title: 'Transactional Ledger', desc: 'Stop guessing margins. Operational resource consumption is dynamically linked to inventory using Weighted Average Cost (WAC) for real-time P&L.', metric: '▲ Atomic transactional bounds', icon: 'M4 20V10M11 20V4M18 20v-7' },
                    ].map((mod, i) => (
                        <div key={i} className="bg-[#F5F1E6] hover:bg-white p-6 sm:p-9 flex flex-col gap-4 sm:gap-5 transition-colors border md:border-none border-[#101B14]/10 rounded-md md:rounded-none">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#101B14] text-[#D9A63E] flex items-center justify-center shrink-0">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d={mod.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <span className="font-['IBM_Plex_Mono',monospace] text-[0.7rem] tracking-[0.05em] text-[#101B14] bg-[#D9A63E] px-2.5 py-1 rounded-[2px] font-semibold">
                                    {mod.tag}
                                </span>
                            </div>
                            <h3 className="font-['Fraunces',serif] font-semibold text-[1.2rem] sm:text-[1.28rem]">{mod.title}</h3>
                            <p className="text-[#4b564d] text-[0.92rem] sm:text-[0.95rem] leading-[1.6]">{mod.desc}</p>
                            <div className="mt-auto pt-3 border-t border-[#101B14]/10 font-['IBM_Plex_Mono',monospace] text-[0.76rem] sm:text-[0.78rem] text-[#3F6B47] font-semibold">
                                {mod.metric}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== WHY CHOOSE FARMA ===== */}
            <section className="bg-[#101B14] text-[#F2EFE3] py-16 sm:py-24">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
                    <div className="max-w-[640px] mb-10 sm:mb-14">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#D9A63E] mb-3 block">
                            Enterprise Features
                        </span>
                        <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                            Built for scale, secured by design.
                        </h2>
                        <p className="mt-3.5 text-[#8FA091] text-[0.98rem] sm:text-[1.02rem] leading-[1.6]">
                            Not a generic dashboard skinned for agriculture — infrastructure decisions made around the strict realities of livestock management.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#F2EFE3]/10 border border-[#F2EFE3]/10">
                        {[
                            { num: '01', title: 'Strict Multi-Tenancy', desc: 'Secure data isolation across independent farm organizations using Spring Security stateless JWTs and logical database partitioning.' },
                            { num: '02', title: 'Role-Scoped Dashboards', desc: 'Proprietors analyze global financial cash flows, while Site Managers monitor local biological trajectories and THI heat gauges.' },
                            { num: '03', title: 'WAC Inventory Smoothing', desc: 'Feed and medication costs automatically adjust to market volatility using dynamic Weighted Average Cost algorithms upon every purchase.' },
                            { num: '04', title: 'Proactive Auditing', desc: 'Move from passive record-keeping to proactive workflows. Biological threats must be acknowledged and resolved via mandatory action logs.' }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#101B14] p-6 sm:p-8 flex gap-4 sm:gap-5 items-start">
                                <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#D9A63E] border border-[#D9A63E]/40 rounded-[2px] px-2 py-1 shrink-0 mt-0.5">
                                    {item.num}
                                </span>
                                <div>
                                    <h3 className="font-['Fraunces',serif] font-semibold text-[1.08rem] sm:text-[1.12rem] mb-1.5">{item.title}</h3>
                                    <p className="text-[#8FA091] text-[0.88rem] sm:text-[0.92rem] leading-[1.6]">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PRICING ===== */}
            <section id="pricing" className="bg-[#ECE6D6] border-y border-[#101B14]/10 py-16">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8">
                    <div className="max-w-[640px] mb-10 sm:mb-14">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#3F6B47] mb-3 block">Pricing</span>
                        <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                            Software that scales with your flock
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#F5F1E6] border border-[#101B14]/10 rounded-md p-6 sm:p-8 flex flex-col">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase tracking-[0.08em]">Homestead</span>
                            <h3 className="font-['Fraunces',serif] text-2xl font-semibold mt-2 mb-1">Starter</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] text-[#4b564d] mb-4">Single farm operations</p>
                            <ul className="flex flex-col gap-2 mb-6">
                                {['Basic field telemetry', 'Up to 2 manager seats', 'Live FCR tracking'].map(f => (
                                    <li key={f} className="text-[0.88rem] text-[#3a443c] flex gap-2"><span className="text-[#3F6B47]">—</span>{f}</li>
                                ))}
                            </ul>
                            <button 
                                onClick={() => { closeAllMenus(); onProprietorClick(); }} 
                                className="mt-auto block w-full text-center px-6 py-3 rounded-[3px] font-semibold text-[0.92rem] border border-[#3F6B47] text-[#101B14] hover:bg-[#3F6B47]/5 transition-colors cursor-pointer"
                            >
                                Start for Free
                            </button>
                        </div>

                        <div className="bg-[#F5F1E6] border-2 border-[#3F6B47] rounded-md p-6 sm:p-8 flex flex-col relative shadow-md">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase tracking-[0.08em]">Enterprise</span>
                            <h3 className="font-['Fraunces',serif] text-2xl font-semibold mt-2 mb-1">Precision</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] text-[#4b564d] mb-4">Multi-farm agribusiness</p>
                            <ul className="flex flex-col gap-2 mb-6">
                                {['Everything in Starter', 'Biosecurity State Machine', 'WAC Financial Ledger', 'Role-scoped dashboards'].map(f => (
                                    <li key={f} className="text-[0.88rem] text-[#3a443c] flex gap-2"><span className="text-[#3F6B47]">—</span>{f}</li>
                                ))}
                            </ul>
                            <a 
                                href="https://wa.me/2349137772112?text=Hello%20Farma%20Team!%20I%20am%20interested%20in%20the%20Precision%20Plan%20for%20my%20farm." 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="mt-auto block text-center px-6 py-3 rounded-[3px] font-semibold text-[0.92rem] bg-[#3F6B47] text-[#F2EFE3] hover:bg-[#4E7F55] transition-colors"
                            >
                                Chat on WhatsApp
                            </a>
                        </div>

                        <div className="bg-[#F5F1E6] border border-[#101B14]/10 rounded-md p-6 sm:p-8 flex flex-col">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase tracking-[0.08em]">Custom</span>
                            <h3 className="font-['Fraunces',serif] text-2xl font-semibold mt-2 mb-1">Corporate</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] text-[#4b564d] mb-4">State-wide cooperatives</p>
                            <ul className="flex flex-col gap-2 mb-6">
                                {['Everything in Precision', 'API webhook integrations', 'Dedicated cloud instance'].map(f => (
                                    <li key={f} className="text-[0.88rem] text-[#3a443c] flex gap-2"><span className="text-[#3F6B47]">—</span>{f}</li>
                                ))}
                            </ul>
                            <a 
                                href="mailto:support@farma.com.ng?subject=Inquiry:%20Farma%20Corporate%20Plan" 
                                className="mt-auto block text-center px-6 py-3 rounded-[3px] font-semibold text-[0.92rem] border border-[#3F6B47] text-[#101B14] hover:bg-[#3F6B47]/5 transition-colors"
                            >
                                Email our Team
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section id="testimonials" className="py-16 sm:py-24 max-w-[1180px] mx-auto px-4 sm:px-8">
                <div className="max-w-[640px] mb-10 sm:mb-14">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#3F6B47] mb-3 block">From the Field</span>
                    <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                        Agribusinesses running on Farma
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { q: "We used to calculate FCR manually at the end of the batch when it was too late to fix anything. Farma tracking it live changed our entire operation.", ini: "S.M.", name: "Site Manager", role: "Section Alpha, Oyo State" },
                        { q: "The biosecurity state machine forced our farmhands to actually log their interventions during the last heatwave. Passive record-keeping is dead.", ini: "D.V.", name: "Dr. Veterinarian", role: "Livestock Health Consultant" },
                        { q: "Linking the physical feed inventory to the financial ledger using WAC completely ended our end-of-month accounting nightmares.", ini: "P.A.", name: "Proprietor", role: "Agro-Allied Enterprise" }
                    ].map((t, i) => (
                        <div key={i} className="bg-[#F5F1E6] border border-[#101B14]/10 rounded-md p-6 sm:p-7 flex flex-col gap-4">
                            <span className="font-['Fraunces',serif] text-[2.4rem] text-[#D9A63E] leading-[0.6] italic">“</span>
                            <p className="text-[0.94rem] sm:text-[0.96rem] leading-[1.6] text-[#2c342d]">{t.q}</p>
                            <div className="flex items-center gap-3 mt-auto pt-4">
                                <div className="w-[38px] h-[38px] rounded-full bg-[#101B14] text-[#D9A63E] flex items-center justify-center font-['IBM_Plex_Mono',monospace] font-semibold text-[0.85rem] shrink-0">
                                    {t.ini}
                                </div>
                                <div>
                                    <div className="text-[0.86rem] font-semibold">{t.name}</div>
                                    <div className="text-[0.74rem] sm:text-[0.76rem] text-[#6b756c] font-['IBM_Plex_Mono',monospace]">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== CTA BAND ===== */}
            <section id="demo" className="bg-[#3A5B6B] text-[#F2EFE3] py-12 sm:py-[70px] text-center px-4 sm:px-5">
                <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.6rem,3vw,2.3rem)] mb-3">
                    Ready to instrument your farm?
                </h2>
                <p className="text-[#F2EFE3]/75 mb-6 sm:mb-7 max-w-[480px] mx-auto text-[0.95rem] sm:text-[1rem]">
                    Talk to our engineering team about onboarding your herd, staff, and financial ledgers onto the Farma cloud architecture.
                </p>
                <a 
                    href="https://wa.me/2349137772112?text=Hello%20Farma%20Team!%20I%20would%20like%20to%20request%20a%20demo%20of%20the%20platform." 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] bg-[#D9A63E] border border-[#D9A63E] text-[#101B14] hover:bg-[#e9b752] transition-colors"
                >
                    Request a Demonstration
                </a>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-[#101B14] text-[#F2EFE3] pt-12 sm:pt-[70px] pb-7 px-4 sm:px-8">
                <div className="max-w-[1180px] mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8 pb-12 border-b border-[#F2EFE3]/10">
                        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                            <a href="#home" onClick={closeAllMenus} className="font-['Fraunces',serif] font-semibold text-[1.2rem] flex items-center gap-2 mb-3.5">
                                <span className="w-2 h-2 rounded-full bg-[#D9A63E]"></span>
                                Farma
                            </a>
                            <p className="text-[#8FA091] text-[0.85rem] sm:text-[0.88rem] leading-[1.6] max-w-[260px]">
                                Data-driven precision for modern agribusiness. Engineered to bridge the gap between biological telemetry and financial ledgers.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#D9A63E] mb-4">Architecture</h4>
                            <div className="flex flex-col gap-2.5 text-[0.85rem] sm:text-[0.88rem] text-[#8FA091]">
                                <a href="#architecture" className="hover:text-[#F2EFE3] transition-colors">Core Modules</a>
                                <a href="#pricing" className="hover:text-[#F2EFE3] transition-colors">Pricing Plans</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#D9A63E] mb-4">Company</h4>
                            <div className="flex flex-col gap-2.5 text-[0.85rem] sm:text-[0.88rem] text-[#8FA091]">
                                <a href="/about" className="hover:text-[#F2EFE3] transition-colors">About Us</a>
                                <a href="/contact" className="hover:text-[#F2EFE3] transition-colors">Contact Support</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#D9A63E] mb-4">Legal</h4>
                            <div className="flex flex-col gap-2.5 text-[0.85rem] sm:text-[0.88rem] text-[#8FA091]">
                                <a href="/privacy" className="hover:text-[#F2EFE3] transition-colors">Privacy Policy</a>
                                <a href="/terms" className="hover:text-[#F2EFE3] transition-colors">Terms of Service</a>
                            </div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#D9A63E] mb-4">System Access</h4>
                            <div className="flex flex-col gap-2.5 text-[0.85rem] sm:text-[0.88rem] text-[#8FA091]">
                                <button onClick={() => { closeAllMenus(); onProprietorClick(); }} className="text-left hover:text-[#F2EFE3] transition-colors cursor-pointer">Proprietor Login</button>
                                <button onClick={() => { closeAllMenus(); onManagerClick(); }} className="text-left hover:text-[#F2EFE3] transition-colors cursor-pointer">Site Manager Login</button>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 flex justify-between items-center flex-wrap gap-3 text-[0.76rem] sm:text-[0.78rem] text-[#8FA091] font-['IBM_Plex_Mono',monospace]">
                        <p>© 2026 Farma Technologies. All rights reserved.</p>
                        <div className="flex items-center gap-2 text-[#4E7F55]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4E7F55]"></span>
                            AWS Cloud Systems Operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};