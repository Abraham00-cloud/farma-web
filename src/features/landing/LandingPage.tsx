import React, { useState } from 'react';

interface LandingPageProps {
    onProprietorClick: () => void;
    onManagerClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onProprietorClick, onManagerClick }) => {
    const [portalOpen, setPortalOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const tickerData = [
        { tag: 'TAG-2201', label: 'Temp 38.6°C', state: 'ok' },
        { tag: 'TAG-1187', label: 'Vaccinated ✓', state: 'ok' },
        { tag: 'TAG-0942', label: 'Feed level 82%', state: 'ok' },
        { tag: 'ZONE-B', label: '0 active quarantine flags', state: 'ok' },
        { tag: 'TAG-3355', label: 'Weight +1.2kg WoW', state: 'ok' },
        { tag: 'PEN-04', label: 'Temp watch — trending up', state: 'warn' },
        { tag: 'TAG-0761', label: 'Health check due in 2d', state: 'warn' },
        { tag: 'HERD', label: 'P&L margin 34.2%', state: 'ok' },
    ];

    return (
        <div className="font-['IBM_Plex_Sans',sans-serif] bg-[#ECE6D6] text-[#161F17] antialiased scroll-smooth selection:bg-[#3F6B47] selection:text-white min-h-screen">
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
                <div className="max-w-[1180px] mx-auto px-5 sm:px-8 flex items-center justify-between h-[72px]">
                    <a href="#home" className="font-['Fraunces',serif] font-semibold text-[1.4rem] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#D9A63E]"></span>
                        Farma
                    </a>

                    <nav className="hidden md:flex gap-9">
                        {['Home', 'Features', 'Pricing', 'Resources', 'Contact'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-[0.92rem] opacity-80 hover:opacity-100 transition-opacity relative group py-1">
                                {item}
                                <span className="absolute left-0 right-0 -bottom-1 h-[1px] bg-[#D9A63E] scale-x-0 origin-left transition-transform duration-250 group-hover:scale-x-100"></span>
                            </a>
                        ))}
                    </nav>

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
                        <div className={`absolute top-[calc(100%+10px)] right-0 bg-[#1B2A20] border border-[#F2EFE3]/10 rounded-md w-[280px] p-2 shadow-2xl transition-all duration-200 origin-top-right ${portalOpen ? 'opacity-100 visible translate-y-0 scale-100' : 'opacity-0 invisible -translate-y-2 scale-95'}`}>
                            <button onClick={() => { setPortalOpen(false); onProprietorClick(); }} className="w-full text-left flex flex-col gap-0.5 p-3 rounded hover:bg-[#233327] transition-colors cursor-pointer">
                                <span className="text-[0.88rem] font-semibold text-[#F2EFE3]">Proprietor / Admin Portal</span>
                                <span className="text-[0.74rem] text-[#D9A63E] font-['IBM_Plex_Mono',monospace]">Register Organisation · Full Executive P&amp;L</span>
                            </button>
                            <div className="h-[1px] bg-[#F2EFE3]/10 my-1 mx-1"></div>
                            <button onClick={() => { setPortalOpen(false); onManagerClick(); }} className="w-full text-left flex flex-col gap-0.5 p-3 rounded hover:bg-[#233327] transition-colors cursor-pointer">
                                <span className="text-[0.88rem] font-semibold text-[#F2EFE3]">Site Manager Portal</span>
                                <span className="text-[0.74rem] text-[#8FA091] font-['IBM_Plex_Mono',monospace]">Assigned Farm Login · Field Telemetry</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Hamburger */}
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex md:hidden flex-col gap-1.5 p-2">
                        <span className="w-6 h-[2px] bg-[#F2EFE3]"></span>
                        <span className="w-6 h-[2px] bg-[#F2EFE3]"></span>
                        <span className="w-6 h-[2px] bg-[#F2EFE3]"></span>
                    </button>
                </div>
            </header>

            {/* ===== HERO ===== */}
            <section id="home" className="relative bg-[#101B14] text-[#F2EFE3] overflow-hidden pt-[88px]">
                <div className="absolute inset-0 opacity-90" style={{
                    background: `repeating-linear-gradient(180deg, transparent 0 64px, rgba(63,107,71,0.16) 64px 66px), linear-gradient(180deg, transparent 55%, #101B14 100%)`
                }}></div>
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `radial-gradient(circle at 18% 30%, rgba(217,166,62,0.08), transparent 40%), radial-gradient(circle at 82% 15%, rgba(58,91,107,0.14), transparent 45%)`
                }}></div>

                <div className="relative z-10 text-center pb-[60px] max-w-[1180px] mx-auto px-5 sm:px-8">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#D9A63E] mb-5 block">
                        Farm Management, Instrumented
                    </span>
                    <h1 className="font-['Fraunces',serif] font-medium text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1.06] tracking-[-0.01em] max-w-[820px] mx-auto mb-6">
                        Data-Driven Precision for <em className="italic text-[#D9A63E] font-medium not-italic">Modern Agribusiness</em>
                    </h1>
                    <p className="max-w-[560px] mx-auto mb-10 text-[1.08rem] leading-[1.6] text-[#8FA091]">
                        Farma turns every pen, paddock, and payroll line into a live number you can act on — built for teams who run farms like operations, not guesswork.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3.5 mb-16">
                        <a href="#features" className="bg-[#3F6B47] hover:bg-[#4E7F55] text-[#F2EFE3] px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] border border-[#3F6B47] transition-all hover:-translate-y-[1px]">
                            Explore the Platform
                        </a>
                        <button onClick={onProprietorClick} className="px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] bg-[#D9A63E] text-[#101B14] hover:bg-[#e9b752] transition-colors cursor-pointer">
                            Proprietor &amp; Admin Portal
                        </button>
                    </div>
                </div>

                {/* Ticker Band */}
                <div className="relative z-10 border-t border-[#F2EFE3]/10 bg-[#1B2A20] overflow-hidden py-3.5">
                    <div className="flex w-max animate-ticker">
                        {[...tickerData, ...tickerData].map((t, i) => (
                            <div key={i} className="flex items-center gap-2.5 font-['IBM_Plex_Mono',monospace] text-[0.78rem] text-[#8FA091] px-6 border-r border-[#F2EFE3]/10 whitespace-nowrap">
                                <span className={`w-1.5 h-1.5 rounded-full ${t.state === 'ok' ? 'bg-[#4E7F55]' : 'bg-[#D9A63E]'}`}></span>
                                <b className="text-[#F2EFE3] font-semibold">{t.tag}</b>
                                <span>{t.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TRUST BADGES ===== */}
            <div className="bg-[#F5F1E6] border-b border-[#101B14]/10 py-7">
                <div className="max-w-[1180px] mx-auto px-5 sm:px-8 flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
                    {[
                        { icon: 'M12 2L3 6V12C3 16.5 6.6 20.7 12 22C17.4 20.7 21 16.5 21 12V6L12 2Z', label: 'Powered by AWS' },
                        { icon: 'M8 11V7a4 4 0 0 1 8 0v4', box: 'M5 11h14v9a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 20v-9z', label: 'End-to-End Encrypted' },
                        { icon: 'M3 12h4l2-7 4 14 2-7h6', label: '99.9% Uptime SLA' },
                        { icon: 'M9 12l2 2 4-4', circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', label: 'Trusted by 40+ Partner Farms' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 font-['IBM_Plex_Mono',monospace] text-[0.8rem] text-[#101B14]/70">
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
            <section id="features" className="py-24 max-w-[1180px] mx-auto px-5 sm:px-8">
                <div className="max-w-[640px] mb-14">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#3F6B47] mb-3.5 block">
                        Core Modules
                    </span>
                    <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                        Three systems, one herd of truth
                    </h2>
                    <p className="mt-4 text-[#4b564d] text-[1.02rem] leading-[1.6]">
                        Everything else in Farma — reports, alerts, dashboards — is built on top of these three engines.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-[#101B14]/10 border border-[#101B14]/10">
                    {[
                        { tag: 'TAG-001', title: 'Operational Telemetry', desc: 'Track day-to-day farm activity, animal health metrics, and feeding schedules in real time, pen by pen.', metric: '▲ 2,340 readings logged today', icon: 'M2 12h4l2.5-7L13 19l2.5-7H22' },
                        { tag: 'TAG-002', title: 'Biosecurity & Herd Health', desc: 'Monitor quarantine zones, vaccination logs, and outbreak risk before disease has a chance to spread.', metric: '▲ 0 active alerts across 6 zones', icon: 'M12 2L4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3z' },
                        { tag: 'TAG-003', title: 'Real-Time Financial P&L', desc: 'Automated profit and loss, tied directly to livestock lifecycles — from feed cost to sale price.', metric: '▲ Margins recalculated hourly', icon: 'M4 20V10M11 20V4M18 20v-7' },
                    ].map((mod, i) => (
                        <div key={i} className="bg-[#F5F1E6] hover:bg-white p-9 flex flex-col gap-5 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="w-11 h-11 rounded-full bg-[#101B14] text-[#D9A63E] flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d={mod.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.05em] text-[#101B14] bg-[#D9A63E] px-2.5 py-1 rounded-[2px] font-semibold">
                                    {mod.tag}
                                </span>
                            </div>
                            <h3 className="font-['Fraunces',serif] font-semibold text-[1.28rem]">{mod.title}</h3>
                            <p className="text-[#4b564d] text-[0.95rem] leading-[1.6]">{mod.desc}</p>
                            <div className="mt-auto pt-3.5 border-t border-[#101B14]/10 font-['IBM_Plex_Mono',monospace] text-[0.78rem] text-[#3F6B47] font-semibold">
                                {mod.metric}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== WHY CHOOSE FARMA ===== */}
            <section className="bg-[#101B14] text-[#F2EFE3] py-24">
                <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
                    <div className="max-w-[640px] mb-14">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#D9A63E] mb-3.5 block">
                            Why Farma
                        </span>
                        <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                            Built for how farms actually run
                        </h2>
                        <p className="mt-4 text-[#8FA091] text-[1.02rem] leading-[1.6]">
                            Not a generic dashboard skinned for agriculture — infrastructure decisions made around the shape of a real herd.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#F2EFE3]/10">
                        {[
                            { num: '01', title: 'Multi-Tenant Architecture', desc: 'Secure isolation for multiple independent farms running on a single backend, with no data bleed between operations.' },
                            { num: '02', title: 'Rule-Based Automation', desc: 'Instant alerts for critical events — low feed thresholds, missed vaccination windows, temperature spikes.' },
                            { num: '03', title: 'Role-Based Access', desc: 'Farmhands, vets, and accountants each get exactly the permissions their job requires — nothing more.' },
                            { num: '04', title: 'Scalable Infrastructure', desc: 'Built on enterprise-grade cloud technology that grows in step with your herd, not ahead of your budget.' }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#101B14] p-8 md:pr-4 flex gap-5 items-start">
                                <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#D9A63E] border border-[#D9A63E]/40 rounded-[2px] px-2 py-1 shrink-0 mt-1">
                                    {item.num}
                                </span>
                                <div>
                                    <h3 className="font-['Fraunces',serif] font-semibold text-[1.12rem] mb-2">{item.title}</h3>
                                    <p className="text-[#8FA091] text-[0.92rem] leading-[1.6]">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== PRICING ===== */}
            <section id="pricing" className="bg-[#ECE6D6] border-y border-[#101B14]/10 py-16">
                <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
                    <div className="max-w-[640px] mb-14">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#3F6B47] mb-3.5 block">Pricing</span>
                        <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                            Plans that scale with your herd size
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#F5F1E6] border border-[#101B14]/10 rounded-md p-8">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase tracking-[0.08em]">Homestead</span>
                            <h3 className="font-['Fraunces',serif] text-2xl font-semibold mt-2.5 mb-1">Starter</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.95rem] text-[#4b564d] mb-4">For farms under 200 head</p>
                            <ul className="flex flex-col gap-2 mb-6">
                                {['Operational telemetry', 'Up to 3 staff seats', 'Email support'].map(f => (
                                    <li key={f} className="text-[0.88rem] text-[#3a443c] flex gap-2"><span className="text-[#3F6B47]">—</span>{f}</li>
                                ))}
                            </ul>
                            <a href="#contact" className="block text-center px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] border border-[#3F6B47] text-[#101B14] hover:bg-[#3F6B47]/5 transition-colors">Talk to Sales</a>
                        </div>
                        <div className="bg-[#F5F1E6] border-2 border-[#3F6B47] rounded-md p-8 relative">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase tracking-[0.08em]">Most Popular</span>
                            <h3 className="font-['Fraunces',serif] text-2xl font-semibold mt-2.5 mb-1">Operation</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.95rem] text-[#4b564d] mb-4">For farms under 2,000 head</p>
                            <ul className="flex flex-col gap-2 mb-6">
                                {['Everything in Starter', 'Biosecurity & herd health module', 'Real-time P&L reporting', 'Unlimited staff seats'].map(f => (
                                    <li key={f} className="text-[0.88rem] text-[#3a443c] flex gap-2"><span className="text-[#3F6B47]">—</span>{f}</li>
                                ))}
                            </ul>
                            <a href="#contact" className="block text-center px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] bg-[#3F6B47] text-[#F2EFE3] hover:bg-[#4E7F55] transition-colors">Talk to Sales</a>
                        </div>
                        <div className="bg-[#F5F1E6] border border-[#101B14]/10 rounded-md p-8">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] text-[#3F6B47] uppercase tracking-[0.08em]">Enterprise</span>
                            <h3 className="font-['Fraunces',serif] text-2xl font-semibold mt-2.5 mb-1">Estate</h3>
                            <p className="font-['IBM_Plex_Mono',monospace] text-[0.95rem] text-[#4b564d] mb-4">Multi-farm & cooperative</p>
                            <ul className="flex flex-col gap-2 mb-6">
                                {['Everything in Operation', 'Multi-tenant management', 'Dedicated success manager'].map(f => (
                                    <li key={f} className="text-[0.88rem] text-[#3a443c] flex gap-2"><span className="text-[#3F6B47]">—</span>{f}</li>
                                ))}
                            </ul>
                            <a href="#contact" className="block text-center px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] border border-[#3F6B47] text-[#101B14] hover:bg-[#3F6B47]/5 transition-colors">Talk to Sales</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <section id="resources" className="py-24 max-w-[1180px] mx-auto px-5 sm:px-8">
                <div className="max-w-[640px] mb-14">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-medium text-[#3F6B47] mb-3.5 block">From the Field</span>
                    <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.12] tracking-[-0.01em]">
                        Farm managers running on Farma
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { q: "We used to lose a week every quarter reconciling feed costs against sales by hand. Now the P&L module just tells us the margin every morning.", ini: "A.O.", name: "Adaeze Okonkwo", role: "Farm Manager, Delta Ranch" },
                        { q: "The biosecurity alerts caught a temperature anomaly in Pen 4 before any of us noticed a symptom. That's the whole pitch, honestly.", ini: "T.B.", name: "Dr. Tunde Bello", role: "Staff Veterinarian, Bello Livestock" },
                        { q: "Role-based access meant I could finally let my accountant in without giving her the keys to everything else on the farm.", ini: "K.N.", name: "Kemi Nwachukwu", role: "Owner, Nwachukwu Poultry" }
                    ].map((t, i) => (
                        <div key={i} className="bg-[#F5F1E6] border border-[#101B14]/10 rounded-md p-7 flex flex-col gap-4">
                            <span className="font-['Fraunces',serif] text-[2.4rem] text-[#D9A63E] leading-[0.6] italic">“</span>
                            <p className="text-[0.96rem] leading-[1.6] text-[#2c342d]">{t.q}</p>
                            <div className="flex items-center gap-3 mt-auto pt-4">
                                <div className="w-[38px] h-[38px] rounded-full bg-[#101B14] text-[#D9A63E] flex items-center justify-center font-['IBM_Plex_Mono',monospace] font-semibold text-[0.85rem]">
                                    {t.ini}
                                </div>
                                <div>
                                    <div className="text-[0.86rem] font-semibold">{t.name}</div>
                                    <div className="text-[0.76rem] text-[#6b756c] font-['IBM_Plex_Mono',monospace]">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== CTA BAND ===== */}
            <section id="contact" className="bg-[#3A5B6B] text-[#F2EFE3] py-[70px] text-center px-5">
                <h2 className="font-['Fraunces',serif] font-medium text-[clamp(1.7rem,3vw,2.3rem)] mb-3.5">
                    Ready to instrument your farm?
                </h2>
                <p className="text-[#F2EFE3]/75 mb-7 max-w-[480px] mx-auto">
                    Talk to our team about onboarding your herd, staff, and books onto Farma.
                </p>
                <a href="mailto:hello@farma.com" className="inline-block px-6 py-3.5 rounded-[3px] font-semibold text-[0.94rem] bg-[#D9A63E] border border-[#D9A63E] text-[#101B14] hover:bg-[#e9b752] transition-colors">
                    Request a Demo
                </a>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-[#101B14] text-[#F2EFE3] pt-[70px] pb-7 px-5 sm:px-8">
                <div className="max-w-[1180px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8 pb-12 border-b border-[#F2EFE3]/10">
                        <div>
                            <a href="#home" className="font-['Fraunces',serif] font-semibold text-[1.2rem] flex items-center gap-2 mb-3.5">
                                <span className="w-2 h-2 rounded-full bg-[#D9A63E]"></span>
                                Farma
                            </a>
                            <p className="text-[#8FA091] text-[0.88rem] leading-[1.6] max-w-[260px]">
                                Data-driven precision for modern agribusiness. Built for farm admins, staff, and vets who need one shared source of truth.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#D9A63E] mb-4">Product</h4>
                            <div className="flex flex-col gap-2.5 text-[0.88rem] text-[#8FA091]">
                                <a href="#features" className="hover:text-[#F2EFE3] transition-colors">Features</a>
                                <a href="#pricing" className="hover:text-[#F2EFE3] transition-colors">Pricing</a>
                                <a href="#" className="hover:text-[#F2EFE3] transition-colors">API Documentation</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#D9A63E] mb-4">Company</h4>
                            <div className="flex flex-col gap-2.5 text-[0.88rem] text-[#8FA091]">
                                <a href="#" className="hover:text-[#F2EFE3] transition-colors">About</a>
                                <a href="#contact" className="hover:text-[#F2EFE3] transition-colors">Contact</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#D9A63E] mb-4">Legal</h4>
                            <div className="flex flex-col gap-2.5 text-[0.88rem] text-[#8FA091]">
                                <a href="#" className="hover:text-[#F2EFE3] transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-[#F2EFE3] transition-colors">Terms of Service</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] uppercase tracking-[0.08em] text-[#D9A63E] mb-4">Farm Portal</h4>
                            <div className="flex flex-col gap-2.5 text-[0.88rem] text-[#8FA091]">
                                <button onClick={onProprietorClick} className="text-left hover:text-[#F2EFE3] transition-colors cursor-pointer">Proprietor Login</button>
                                <button onClick={onManagerClick} className="text-left hover:text-[#F2EFE3] transition-colors cursor-pointer">Site Manager Login</button>
                            </div>
                        </div>
                    </div>
                    <div className="pt-6 flex justify-between items-center flex-wrap gap-3 text-[0.78rem] text-[#8FA091] font-['IBM_Plex_Mono',monospace]">
                        <p>© 2026 Farma Technologies. All rights reserved.</p>
                        <div className="flex items-center gap-2 text-[#4E7F55]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4E7F55]"></span>
                            All systems operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};