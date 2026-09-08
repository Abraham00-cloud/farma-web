import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#ECE6D6] font-['IBM_Plex_Sans',sans-serif] text-[#161F17] antialiased selection:bg-[#3F6B47] selection:text-white relative overflow-hidden">
            
            {/* Aesthetic Ambient Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3F6B47] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D9A63E] rounded-full mix-blend-multiply filter blur-[150px] opacity-15 pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

            <div className="relative z-10 max-w-[800px] mx-auto py-12 px-6 sm:px-8 lg:py-20">
                
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

                {/* Policy Document Container */}
                <div className="bg-[#FBF9F5] p-8 sm:p-12 rounded-[2rem] border border-[#101B14]/10 shadow-xl shadow-[#101B14]/5">
                    
                    <div className="mb-10 border-b border-[#101B14]/10 pb-8">
                        <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-extrabold mb-3 text-[#101B14] tracking-tight">Terms of Service</h1>
                        <p className="text-[#3F6B47] font-['IBM_Plex_Mono',monospace] text-xs font-bold uppercase tracking-widest">
                            Effective Date: August 2026
                        </p>
                    </div>

                    <div className="space-y-10 text-[#101B14]/80 text-[0.95rem] leading-[1.8] font-medium">
                        
                        <section>
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-3 text-[#101B14]">1. Agreeing to the Rules</h2>
                            <p>By registering your farm organisation or logging into the Farma platform, you agree to be bound by these Terms of Service. If you do not agree to these rules, please do not use the Farma platform to manage your business.</p>
                        </section>

                        <section>
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-3 text-[#101B14]">2. Account Security & Your Staff</h2>
                            <p>As the Organisation Owner, you are responsible for keeping your master login details safe. You are also entirely responsible for the actions of any Facility Managers you invite and grant access to your workspace. Please notify us immediately if you suspect someone has gained unauthorized access to your account.</p>
                        </section>

                        <section className="bg-[#101B14]/5 p-6 rounded-2xl border border-[#101B14]/10">
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-3 text-[#101B14]">3. Who Owns What</h2>
                            <ul className="space-y-4">
                                <li>
                                    <strong className="text-[#101B14] block mb-1">Your Farm's Data:</strong> 
                                    You retain 100% ownership of the daily logs, financial records, inventory counts, and all other business data you input into Farma.
                                </li>
                                <li>
                                    <strong className="text-[#101B14] block mb-1">Our Platform:</strong> 
                                    Farma retains all ownership of the software, the design, the automated calculation tools, and the underlying technology that makes the platform work.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-4 text-[#101B14]">4. Rules for Using Farma</h2>
                            <p className="mb-3">To keep the platform safe and reliable for all farmers, you agree that you will not:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2 marker:text-[#3F6B47]">
                                <li>Try to hack, break, or bypass the security of the Farma platform.</li>
                                <li>Attempt to access the records or data of another farm organisation.</li>
                                <li>Use the software to manage unregistered businesses or support illegal agricultural practices.</li>
                            </ul>
                        </section>

                        <section className="border-l-4 border-[#E76F51] pl-6 py-2">
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-2 text-[#101B14]">5. Our Liability (Please Read)</h2>
                            <p>
                                Farma is an information management tool built to help you track your business. <strong>We do not provide veterinary, financial, or legal advice.</strong> 
                                <br/><br/>
                                We provide data and alerts to help you make decisions, but we are not liable for livestock mortality, disease outbreaks, crop failures, or financial losses resulting from your use of the platform, or from decisions you make based on our calculations.
                            </p>
                        </section>

                        <section className="border-t border-[#101B14]/10 pt-8">
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-3 text-[#101B14]">6. Contact Information</h2>
                            <p className="mb-4">
                                If you have any questions regarding these Terms of Service or your obligations while using the software, please reach out to our team at:
                            </p>
                            <a href="mailto:support@farma.com.ng" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#3F6B47]/10 text-[#2A5C38] font-bold text-sm hover:bg-[#3F6B47]/20 transition-colors">
                                ✉ support@farma.com.ng
                            </a>
                        </section>
                    </div>
                </div>
                
                <div className="text-center mt-8 text-xs text-[#101B14]/40 font-['IBM_Plex_Mono',monospace] font-semibold uppercase tracking-widest">
                    © {new Date().getFullYear()} Farma Technologies
                </div>
            </div>
        </div>
    );
};