import React from 'react';
import { useNavigate } from 'react-router-dom';

export const AboutUs = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#ECE6D6] text-[#161F17] font-['IBM_Plex_Sans',sans-serif] selection:bg-[#3F6B47] selection:text-white py-12 px-4 sm:px-8">
            <div className="max-w-[1000px] mx-auto bg-[#F5F1E6] p-6 sm:p-12 md:p-16 rounded-xl border border-[#101B14]/10 shadow-sm">
                
                <button onClick={() => navigate('/')} className="text-[#3F6B47] font-semibold text-sm hover:underline mb-10 inline-flex items-center gap-2 cursor-pointer">
                    ← Back to Home
                </button>

                {/* ===== SUB-NAV ANCHORS ===== */}
                <div className="flex border-b border-[#101B14]/10 pb-4 mb-12 gap-6 text-xs font-mono font-bold uppercase tracking-wider text-[#8FA091]">
                    <a href="#story" className="text-[#101B14] border-b-2 border-[#D9A63E] pb-4 -mb-[18px]">Our Story</a>
                    <a href="#engineering" className="hover:text-[#101B14] transition-colors">Engineering</a>
                    <a href="#leadership" className="hover:text-[#101B14] transition-colors">Leadership</a>
                </div>

                {/* ===== SECTION 1: OUR STORY ===== */}
                <section id="story" className="mb-16 scroll-mt-24">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-bold text-[#D9A63E] mb-3 block">
                        01. Genesis &amp; Vision
                    </span>
                    <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.1] text-[#101B14] mb-6">
                        Eliminating agricultural guesswork through architectural rigor.
                    </h1>
                    <div className="text-[#4b564d] text-[1.02rem] leading-[1.7] space-y-4 max-w-3xl">
                        <p>
                            Farma was conceived out of a fundamental observation of modern agribusiness: commercial livestock operations are highly sensitive, deterministic systems being managed with passive, fragmented tools. When biological field deviations are siloed away from corporate financial reporting, agricultural enterprises absorb massive, unhedged risks.
                        </p>
                        <p>
                            We believe that sustainable productivity requires real-time instrumentation. By treating every containment pen, flock batch, and feed line as a live data point, Farma turns volatile agricultural variables into clear, mathematical formulas for profit stabilization.
                        </p>
                    </div>
                </section>

                {/* ===== SECTION 2: ENGINEERING PRINCIPLES ===== */}
                <section id="engineering" className="bg-[#101B14] text-[#F2EFE3] p-8 sm:p-12 rounded-xl mb-16 shadow-lg scroll-mt-24">
                    <div className="mb-10">
                        <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-bold text-[#D9A63E] mb-3 block">
                            02. Core Systems
                        </span>
                        <h2 className="font-['Fraunces',serif] text-3xl font-semibold text-[#F2EFE3]">Our Technical Foundation</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <h3 className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] font-bold text-[#D9A63E]">Conceptual Depth Over Dogma</h3>
                            <p className="text-[#8FA091] text-[0.9rem] leading-[1.6]">
                                We design deep relational domain layouts that grasp the core physics of agricultural production. Our systems prioritize structural relationships over plain record logs.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] font-bold text-[#D9A63E]">Deterministic Safety Layers</h3>
                            <p className="text-[#8FA091] text-[0.9rem] leading-[1.6]">
                                Using backend state machines, biological indicators like heat indexes and mortality curves automatically trigger mandatory workflows for onsite field teams.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] font-bold text-[#D9A63E]">Java Enterprise Stability</h3>
                            <p className="text-[#8FA091] text-[0.9rem] leading-[1.6]">
                                Built on a high-throughput Java core, the platform delivers strong multi-tenant security guarantees, stateless JWT verification, and ultra-low database latency.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-['IBM_Plex_Mono',monospace] text-[0.9rem] font-bold text-[#D9A63E]">Atomic Cost Accounting</h3>
                            <p className="text-[#8FA091] text-[0.9rem] leading-[1.6]">
                                Resource utilization is calculated down to the minute via Weighted Average Cost algorithms, linking supply drops directly to active margins.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ===== SECTION 3: LEADERSHIP / FOUNDER BRIEF ===== */}
                <section id="leadership" className="border-t border-[#101B14]/10 pt-12 mb-12 scroll-mt-24">
                    <span className="font-['IBM_Plex_Mono',monospace] text-[0.72rem] tracking-[0.14em] uppercase font-bold text-[#3F6B47] mb-6 block">
                        03. Executive Leadership
                    </span>
                    
                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                        {/* Beautifully framed image container */}
                        <div className="w-full md:w-56 h-72 shrink-0 overflow-hidden rounded-xl border border-[#101B14]/15 shadow-md group transition-all duration-300 hover:shadow-xl hover:border-[#3F6B47]/40">
                            <img 
                                src="/1000000659.jpg" 
                                alt="Abraham Alagbe .A - Founder & Chief Systems Architect" 
                                className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                            />
                        </div>

                        {/* Professional Write-up */}
                        <div className="space-y-4">
                            <div>
                                <h2 className="font-['Fraunces',serif] text-2xl font-bold text-[#101B14]">Abraham Alagbe .A</h2>
                                <p className="text-xs font-mono font-bold text-[#3F6B47] mt-1 uppercase tracking-wider">
                                    Founder &amp; Chief Systems Architect
                                </p>
                            </div>
                            
                            <div className="text-[#2c342d] text-[0.95rem] leading-[1.7] space-y-3">
                                <p>
                                    Abraham Alagbe is a computer science scholar at the <strong>SQI College of ICT</strong>, specializing in high-scale Java enterprise backend architectures. Merging software engineering principles with a deep interest in modern agriculture, he designed Farma to solve the fragmentation plague that compromises corporate agribusiness margins.
                                </p>
                                <p>
                                    As a developer, Abraham focuses on structural database integrity, secure multithreading, and predictive data design. Driven by the philosophy that precision technology should remove operational risk, he engineers tools that give farm administrators absolute certainty over their livestock metrics and capital margins.
                                </p>
                            </div>

                            {/* Credentials Badge Grid */}
                            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono font-bold">
                                <span className="bg-[#101B14] text-[#F2EFE3] px-3 py-1 rounded-[2px] shadow-sm">Java Enterprise Developer</span>
                                <span className="bg-[#3F6B47]/10 text-[#3F6B47] border border-[#3F6B47]/20 px-3 py-1 rounded-[2px]">Computer Science · SQI</span>
                                <span className="bg-[#D9A63E]/10 text-[#101B14] border border-[#D9A63E]/20 px-3 py-1 rounded-[2px]">Precision AgTech Specialist</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== BOTTOM INTERACTION CTA ===== */}
                <div className="mt-16 pt-12 border-t border-[#101B14]/10 text-center bg-[#F5F1E6]">
                    <h3 className="font-['Fraunces',serif] text-xl font-semibold text-[#101B14] mb-4">Want to audit our tech stack?</h3>
                    <a 
                        href="mailto:support@farma.com.ng?subject=Inquiry:%20Architectural%20Framework" 
                        className="inline-flex items-center gap-2 bg-[#101B14] text-[#F2EFE3] px-8 py-3.5 rounded-[3px] font-semibold text-sm hover:bg-[#1B2A20] transition-colors shadow-sm transform hover:-translate-y-0.5 duration-200"
                    >
                        Connect with the Architect
                    </a>
                </div>

            </div>
        </div>
    );
};