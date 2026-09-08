import React from 'react';
import { useNavigate } from 'react-router-dom';

export const AboutUs = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#ECE6D6] font-['IBM_Plex_Sans',sans-serif] text-[#161F17] antialiased selection:bg-[#3F6B47] selection:text-white relative overflow-hidden">
            
            {/* Aesthetic Ambient Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#3F6B47] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#D9A63E] rounded-full mix-blend-multiply filter blur-[150px] opacity-15 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

            <div className="relative z-10 max-w-[1000px] mx-auto py-12 px-6 sm:px-8 lg:py-20">
                
                {/* Branding & Back Button */}
                <div className="flex items-center justify-between mb-12">
                    <button 
                        onClick={() => navigate('/')} 
                        className="inline-flex items-center gap-2 text-[#101B14]/60 hover:text-[#101B14] font-bold text-sm transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </button>

                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#101B14] text-[#D9A63E] shadow-sm">
                        <span className="font-['Fraunces',serif] font-bold text-xl leading-none mt-0.5">F</span>
                    </div>
                </div>

                <div className="bg-[#FBF9F5] p-8 sm:p-12 md:p-16 rounded-[2rem] border border-[#101B14]/10 shadow-xl shadow-[#101B14]/5">
                    
                    {/* ===== SUB-NAV ANCHORS ===== */}
                    <div className="flex flex-wrap border-b border-[#101B14]/10 pb-4 mb-12 gap-6 text-[11px] font-['IBM_Plex_Mono',monospace] font-bold uppercase tracking-widest text-[#101B14]/50">
                        <a href="#story" className="text-[#101B14] border-b-2 border-[#D9A63E] pb-4 -mb-[18px]">Our Story</a>
                        <a href="#technology" className="hover:text-[#101B14] transition-colors">The Technology</a>
                        <a href="#leadership" className="hover:text-[#101B14] transition-colors">Leadership</a>
                    </div>

                    {/* ===== SECTION 1: OUR STORY ===== */}
                    <section id="story" className="mb-20 scroll-mt-24">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[10px] tracking-widest uppercase font-bold text-[#D9A63E] mb-4 block">
                            01. Genesis & Vision
                        </span>
                        <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.15] text-[#101B14] mb-8 tracking-tight">
                            Eliminating agricultural guesswork through precision technology.
                        </h1>
                        <div className="text-[#101B14]/80 text-[1.05rem] leading-[1.8] space-y-5 max-w-3xl font-medium">
                            <p>
                                Farma was conceived out of a fundamental observation: commercial livestock operations are highly sensitive businesses, yet they are often managed with fragmented, passive tools. When what happens in the pens is disconnected from the owner's financial ledger, agricultural enterprises absorb massive, unnecessary risks.
                            </p>
                            <p>
                                We believe that sustainable profitability requires real-time instrumentation. By treating every containment pen, flock, and feed line as a live data point, Farma turns volatile agricultural variables into clear, actionable insights for business owners.
                            </p>
                        </div>
                    </section>

                    {/* ===== SECTION 2: ENGINEERING PRINCIPLES ===== */}
                    <section id="technology" className="bg-[#101B14] text-[#F2EFE3] p-8 sm:p-12 md:p-16 rounded-[2rem] mb-20 shadow-2xl scroll-mt-24 relative overflow-hidden">
                        
                        {/* Internal Dark Card Orb */}
                        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-[#3F6B47] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="mb-12 border-b border-white/10 pb-8">
                                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] tracking-widest uppercase font-bold text-[#D9A63E] mb-4 block">
                                    02. Core Systems
                                </span>
                                <h2 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Our Technical Foundation</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12">
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#3F6B47]/20 flex items-center justify-center text-[#3F6B47] mb-4 font-bold">1</div>
                                    <h3 className="font-['Fraunces',serif] text-xl font-bold text-[#D9A63E]">Connected Data Architecture</h3>
                                    <p className="text-[#8FA091] text-[0.95rem] leading-[1.7]">
                                        We design databases that grasp the reality of agricultural production. Our systems automatically connect a manager logging a bag of feed directly to the owner's profit margins.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#3F6B47]/20 flex items-center justify-center text-[#3F6B47] mb-4 font-bold">2</div>
                                    <h3 className="font-['Fraunces',serif] text-xl font-bold text-[#D9A63E]">Proactive Safety Workflows</h3>
                                    <p className="text-[#8FA091] text-[0.95rem] leading-[1.7]">
                                        Our backend doesn't just store data; it reacts. Biological indicators like heat indexes and mortality curves automatically trigger mandatory alerts for the executive team.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#3F6B47]/20 flex items-center justify-center text-[#3F6B47] mb-4 font-bold">3</div>
                                    <h3 className="font-['Fraunces',serif] text-xl font-bold text-[#D9A63E]">Enterprise-Grade Reliability</h3>
                                    <p className="text-[#8FA091] text-[0.95rem] leading-[1.7]">
                                        Built on a robust, high-performance infrastructure, the platform delivers strong data isolation between farms, bank-level security verification, and ultra-fast loading speeds.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#3F6B47]/20 flex items-center justify-center text-[#3F6B47] mb-4 font-bold">4</div>
                                    <h3 className="font-['Fraunces',serif] text-xl font-bold text-[#D9A63E]">Live Cost Accounting</h3>
                                    <p className="text-[#8FA091] text-[0.95rem] leading-[1.7]">
                                        Resource utilization is calculated dynamically. As market prices for feed and vaccines fluctuate, the system averages your costs to ensure your P&L is always 100% accurate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ===== SECTION 3: LEADERSHIP / FOUNDER BRIEF ===== */}
                    <section id="leadership" className="pt-4 scroll-mt-24">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[10px] tracking-widest uppercase font-bold text-[#3F6B47] mb-6 block">
                            03. Executive Leadership
                        </span>
                        
                        <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
                            {/* Beautifully framed image container */}
                            <div className="w-full md:w-64 h-80 shrink-0 overflow-hidden rounded-[2rem] border border-[#101B14]/10 shadow-lg group relative">
                                {/* Placeholder Gradient if Image is missing */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#101B14] to-[#3F6B47]"></div>
                                <img 
                                    src="/1000000659.jpg" 
                                    alt="Abraham Alagbe .A" 
                                    className="relative z-10 w-full h-full object-cover object-center group-hover:scale-[1.05] transition-transform duration-700"
                                />
                            </div>

                            {/* Professional Write-up */}
                            <div className="space-y-6 flex-1">
                                <div className="border-b border-[#101B14]/10 pb-5">
                                    <h2 className="font-['Fraunces',serif] text-3xl font-extrabold text-[#101B14]">Abraham Alagbe .A</h2>
                                    <p className="text-xs font-['IBM_Plex_Mono',monospace] font-bold text-[#3F6B47] mt-2 uppercase tracking-widest">
                                        Founder & Chief Systems Architect
                                    </p>
                                </div>
                                
                                <div className="text-[#101B14]/80 text-[1.05rem] leading-[1.8] space-y-4 font-medium">
                                    <p>
                                        Abraham is a software engineer and scholar at SQI College of ICT, specializing in the architecture of secure, high-scale backend systems. Merging a deep technical foundation with a clear understanding of modern agriculture, he designed Farma to solve the fragmentation that compromises agribusiness profits.
                                    </p>
                                    <p>
                                        Driven by the philosophy that precision technology should eliminate operational risk, Abraham engineers tools that give farm administrators absolute certainty over their livestock metrics and capital margins.
                                    </p>
                                </div>

                                {/* Credentials Badge Grid */}
                                <div className="pt-4 flex flex-wrap gap-3 text-[10px] font-['IBM_Plex_Mono',monospace] font-bold uppercase tracking-wider">
                                    <span className="bg-[#101B14] text-[#D9A63E] px-4 py-2 rounded-lg shadow-md">Backend Architecture</span>
                                    <span className="bg-[#3F6B47]/10 text-[#2A5C38] border border-[#3F6B47]/20 px-4 py-2 rounded-lg">SQI College of ICT</span>
                                    <span className="bg-[#ECE6D6] text-[#101B14] border border-[#101B14]/10 px-4 py-2 rounded-lg">AgTech Systems</span>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* ===== BOTTOM INTERACTION CTA ===== */}
                <div className="mt-12 text-center">
                    <h3 className="font-['Fraunces',serif] text-2xl font-bold text-[#101B14] mb-6">Want to learn more about our infrastructure?</h3>
                    <a 
                        href="mailto:support@farma.com.ng?subject=Inquiry:%20Architectural%20Framework" 
                        className="inline-flex items-center gap-2 bg-[#101B14] text-[#FBF9F5] px-8 py-4 rounded-xl font-extrabold text-sm uppercase tracking-wider hover:bg-[#3F6B47] transition-all shadow-xl shadow-[#101B14]/20 transform hover:-translate-y-1 duration-300"
                    >
                        Connect with our Team
                    </a>
                </div>

            </div>
        </div>
    );
};