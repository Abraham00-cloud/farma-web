import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#ECE6D6] text-[#161F17] font-['IBM_Plex_Sans',sans-serif] selection:bg-[#3F6B47] selection:text-white py-12 px-4 sm:px-8">
            <div className="max-w-[800px] mx-auto bg-[#F5F1E6] p-8 sm:p-12 rounded-xl border border-[#101B14]/10 shadow-sm">
                
                <button onClick={() => navigate('/')} className="text-[#3F6B47] font-semibold text-sm hover:underline mb-8 inline-flex items-center gap-2">
                    ← Back to Home
                </button>

                <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-semibold mb-2">Privacy Policy</h1>
                <p className="text-[#8FA091] font-['IBM_Plex_Mono',monospace] text-sm mb-10">Last Updated: August 2026</p>

                <div className="space-y-8 text-[#2c342d] text-[0.95rem] leading-[1.7]">
                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">1. Information We Collect</h2>
                        <p>Farma ("we", "our", or "us") collects information to provide our enterprise farm management system. This includes:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Account Information:</strong> Names, email addresses, and enterprise registration details provided during Proprietor and Manager onboarding.</li>
                            <li><strong>Farm & Telemetry Data:</strong> Livestock batch data, mortality rates, feed consumption, environmental metrics, and biosecurity logs.</li>
                            <li><strong>Financial Data:</strong> Operational ledger entries and Weighted Average Cost (WAC) calculations.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">2. How We Use Your Data</h2>
                        <p>Your data is strictly used to operate your customized Farma workspace. We use this data to:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Provide real-time analytics, FCR tracking, and financial P&L reporting.</li>
                            <li>Trigger biosecurity and environmental safety alerts.</li>
                            <li>Maintain strict Role-Based Access Control (RBAC) boundaries between Proprietors and Managers.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">3. Data Sovereignty & Multi-Tenancy</h2>
                        <p>Farma employs strict logical database partitioning. Your enterprise data is cryptographically isolated from all other organizations using our platform. We do not sell, rent, or trade your agricultural or financial data to any third parties, competitors, or market analysts.</p>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">4. Infrastructure & Security</h2>
                        <p>Our infrastructure is hosted securely on Amazon Web Services (AWS). We utilize stateless JWT (JSON Web Tokens) for authentication and TLS encryption for all data in transit. While we implement enterprise-grade security, no system is entirely impenetrable, and we cannot guarantee absolute security.</p>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">5. Contact Us</h2>
                        <p>For inquiries regarding data privacy or to exercise your rights under applicable data protection regulations (including the NDPR), please contact us at:</p>
                        <p className="mt-2 font-['IBM_Plex_Mono',monospace] text-[#3F6B47] font-semibold">support@farma.com.ng</p>
                    </section>
                </div>
            </div>
        </div>
    );
};