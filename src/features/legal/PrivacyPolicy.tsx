import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy = () => {
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
                        <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-extrabold mb-3 text-[#101B14] tracking-tight">Privacy Policy</h1>
                        <p className="text-[#3F6B47] font-['IBM_Plex_Mono',monospace] text-xs font-bold uppercase tracking-widest">
                            Effective Date: August 2026
                        </p>
                    </div>

                    <div className="space-y-10 text-[#101B14]/80 text-[0.95rem] leading-[1.8] font-medium">
                        
                        <section>
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-4 text-[#101B14]">1. Information We Collect</h2>
                            <p className="mb-3">When you use Farma to manage your agricultural business, we collect the necessary information to make the software work for you. This includes:</p>
                            <ul className="list-none space-y-3 mt-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-[#D9A63E] font-bold mt-1">✓</span>
                                    <div>
                                        <strong className="text-[#101B14]">Account Details:</strong> Names, email addresses, and business registration details provided when you set up your farm organisation or add facility managers.
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#D9A63E] font-bold mt-1">✓</span>
                                    <div>
                                        <strong className="text-[#101B14]">Farm Operations Data:</strong> Bird population counts, daily feed usage, mortality logs, warehouse inventory, and health reports submitted by your staff.
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#D9A63E] font-bold mt-1">✓</span>
                                    <div>
                                        <strong className="text-[#101B14]">Financial Records:</strong> Income from sales, expenses for feed and medication, and your calculated profit margins.
                                    </div>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-4 text-[#101B14]">2. How We Use Your Data</h2>
                            <p className="mb-3">We only use your data to power your farm's dashboard. Specifically, your data is used to:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-2 marker:text-[#3F6B47]">
                                <li>Automatically calculate your farm's live profit and costs per bird.</li>
                                <li>Send you instant alerts if there is a sudden disease outbreak, mortality spike, or feed shortage.</li>
                                <li>Ensure your Facility Managers only see the pens they are assigned to, while keeping your financial ledgers locked and visible only to you (the Owner).</li>
                            </ul>
                        </section>

                        <section className="bg-[#101B14]/5 p-6 rounded-2xl border border-[#101B14]/10">
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-3 text-[#101B14]">3. Your Data Belongs to You</h2>
                            <p>
                                Your farm's data is strictly separated from every other organisation using Farma. 
                                <strong> We will never sell, rent, or trade your agricultural data, business secrets, or financial records </strong> 
                                to competitors, third-party advertisers, or market analysts. What happens on your farm, stays on your farm.
                            </p>
                        </section>

                        <section>
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-4 text-[#101B14]">4. Keeping Your Data Safe</h2>
                            <p>
                                We treat your farm's data with the same security as a financial institution. Your information is stored on highly secure, enterprise-grade cloud servers (AWS). We use modern encryption to ensure your passwords and records are unreadable to anyone outside your authenticated organisation. While no system is 100% immune to threats, we follow strict industry standards to keep your business safe.
                            </p>
                        </section>

                        <section className="border-t border-[#101B14]/10 pt-8">
                            <h2 className="font-['Fraunces',serif] text-xl font-bold mb-3 text-[#101B14]">5. Contact Us</h2>
                            <p className="mb-4">
                                If you have questions about how we handle your farm's privacy, or if you need to exercise your rights under the Nigeria Data Protection Regulation (NDPR), our team is ready to help.
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