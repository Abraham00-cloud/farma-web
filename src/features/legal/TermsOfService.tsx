import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TermsOfService = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#ECE6D6] text-[#161F17] font-['IBM_Plex_Sans',sans-serif] selection:bg-[#3F6B47] selection:text-white py-12 px-4 sm:px-8">
            <div className="max-w-[800px] mx-auto bg-[#F5F1E6] p-8 sm:p-12 rounded-xl border border-[#101B14]/10 shadow-sm">
                
                <button onClick={() => navigate('/')} className="text-[#3F6B47] font-semibold text-sm hover:underline mb-8 inline-flex items-center gap-2">
                    ← Back to Home
                </button>

                <h1 className="font-['Fraunces',serif] text-3xl sm:text-4xl font-semibold mb-2">Terms of Service</h1>
                <p className="text-[#8FA091] font-['IBM_Plex_Mono',monospace] text-sm mb-10">Last Updated: August 2026</p>

                <div className="space-y-8 text-[#2c342d] text-[0.95rem] leading-[1.7]">
                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">1. Acceptance of Terms</h2>
                        <p>By registering an enterprise organization or logging into the Farma platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Farma platform.</p>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">2. Account Provisioning & Security</h2>
                        <p>Proprietors are responsible for maintaining the confidentiality of their credentials and for the actions of any Site Managers they provision. You agree to notify us immediately of any unauthorized access to your enterprise workspace.</p>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">3. Data Ownership & Intellectual Property</h2>
                        <p><strong>Your Data:</strong> You retain all rights and ownership to the biological telemetry, financial ledgers, and operational data you input into Farma.</p>
                        <p className="mt-2"><strong>Our Platform:</strong> Farma retains all intellectual property rights to the software, algorithms, biosecurity state machines, and UI/UX designs that constitute the platform.</p>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">4. Acceptable Use</h2>
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Attempt to reverse engineer, decompile, or hack the Farma backend API.</li>
                            <li>Use the platform for any illegal agricultural practices or unregistered businesses.</li>
                            <li>Upload malicious code or attempt to bypass our multi-tenant JWT security architecture.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">5. Limitation of Liability</h2>
                        <p className="uppercase text-xs font-bold tracking-wide text-[#101B14] mb-2">Please read carefully:</p>
                        <p>Farma is an information management tool. We do not provide veterinary, financial, or legal advice. We are not liable for livestock mortality, crop failure, disease outbreaks, or financial losses resulting from the use or inability to use our platform, or from decisions made based on our analytics.</p>
                    </section>

                    <section>
                        <h2 className="font-['Fraunces',serif] text-xl font-semibold mb-3 text-[#101B14]">6. Contact Information</h2>
                        <p>Questions regarding these Terms of Service should be directed to:</p>
                        <p className="mt-2 font-['IBM_Plex_Mono',monospace] text-[#3F6B47] font-semibold">support@farma.com.ng</p>
                    </section>
                </div>
            </div>
        </div>
    );
};