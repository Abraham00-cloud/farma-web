import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck, Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#1A241B] font-sans antialiased flex flex-col justify-between relative overflow-hidden selection:bg-[#84A93C] selection:text-white">
      {/* Top Forest Green Banner */}
      <div className="absolute top-0 inset-x-0 h-72 bg-[#13311C] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 rounded-full bg-[#84A93C] flex items-center justify-center shadow-md">
            <span className="font-bold text-lg text-[#13311C] leading-none">F</span>
          </div>
          <div className="text-left leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-white block">Farma</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#A8C868] block">
              Farm Management OS
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/85 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#A8C868]" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Policy Document Container */}
      <main className="relative z-10 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white p-7 sm:p-12 rounded-3xl border border-gray-100 shadow-xl shadow-black/10">
          {/* Document Header */}
          <div className="mb-10 border-b border-gray-100 pb-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4E4] text-[#3A6324] text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              Data Protection &amp; NDPR Compliance
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 text-[#18261B] tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs font-semibold text-[#5C6B5E] mt-2">
              Effective Date: August 2026 &bull; Farma Technologies (farma.com.ng)
            </p>
          </div>

          <div className="space-y-9 text-[#39483B] text-sm sm:text-[15px] leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-extrabold mb-3 text-[#18261B]">
                1. Information We Collect
              </h2>
              <p>
                When you use Farma to manage your agricultural enterprise, we collect only the
                operational and account information required to power your workspace:
              </p>
              <ul className="space-y-3 mt-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#4C7A2B] shrink-0 mt-1" />
                  <div>
                    <strong className="text-[#18261B]">Account Details:</strong> Names, email
                    addresses, and business registration details provided when you register your
                    organisation or provision facility managers.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#4C7A2B] shrink-0 mt-1" />
                  <div>
                    <strong className="text-[#18261B]">Farm Operations Data:</strong> Livestock
                    population counts, daily feed usage, mortality logs, warehouse inventory, and
                    biosecurity reports submitted by your staff.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#4C7A2B] shrink-0 mt-1" />
                  <div>
                    <strong className="text-[#18261B]">Financial Records:</strong> Harvest sales,
                    feed and medication expenses, cost-per-bird computations, and batch profit
                    margins.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-extrabold mb-3 text-[#18261B]">
                2. How We Use Your Data
              </h2>
              <p>Your data is used strictly to operate and secure your farm workspace:</p>
              <ul className="list-disc pl-5 mt-3 space-y-2 marker:text-[#4C7A2B]">
                <li>
                  Automatically compute live Feed Conversion Ratios (FCR), cost per bird, and
                  batch profitability.
                </li>
                <li>
                  Trigger timely alerts when abnormal mortality spikes, health observations, or
                  feed stock shortages occur.
                </li>
                <li>
                  Enforce strict Role-Based Access Control so Facility Managers access only their
                  assigned facilities while financial ledgers remain restricted to the Organisation
                  Owner.
                </li>
              </ul>
            </section>

            <section className="bg-[#F7F8F5] p-6 rounded-2xl border border-gray-200/80">
              <div className="flex items-center gap-2.5 mb-2">
                <Lock className="w-4 h-4 text-[#3A6324]" />
                <h2 className="text-lg font-extrabold text-[#18261B]">
                  3. Your Data Belongs to You
                </h2>
              </div>
              <p className="text-[#39483B]">
                Your organisation&apos;s records are logically isolated from every other tenant on
                Farma.{' '}
                <strong className="text-[#18261B]">
                  We never sell, rent, or trade your agricultural data, supplier pricing, or
                  financial records
                </strong>{' '}
                to competitors, third-party advertisers, or external brokers.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-extrabold mb-3 text-[#18261B]">
                4. Data Security &amp; Infrastructure
              </h2>
              <p>
                We safeguard your records using enterprise-grade cloud infrastructure (AWS),
                encrypted transport (HTTPS/TLS), hashed credentials, and scoped JWT authentication.
                While no online system is 100% immune to risk, we follow rigorous industry standards
                to protect your business operations.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-7">
              <h2 className="text-lg sm:text-xl font-extrabold mb-2.5 text-[#18261B]">
                5. Contact Us
              </h2>
              <p className="mb-4">
                If you have questions about how we handle your privacy, or wish to exercise your
                data rights under the Nigeria Data Protection Regulation (NDPR), reach out to our
                team:
              </p>
              <a
                href="mailto:support@farma.com.ng"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#EEF4E4] hover:bg-[#E2EDD1] text-[#13311C] font-bold text-xs transition-colors"
              >
                <Mail className="w-4 h-4 text-[#3A6324]" />
                <span>support@farma.com.ng</span>
              </a>
            </section>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-[#5C6B5E]">
        <span>© {new Date().getFullYear()} Farma Technologies (farma.com.ng)</span>
        <span className="mx-2">&bull;</span>
        <a href="/terms" className="hover:text-[#18261B] transition-colors font-medium">
          Terms of Service
        </a>
        <span className="mx-2">&bull;</span>
        <a href="/" className="hover:text-[#18261B] transition-colors font-medium">
          Home
        </a>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;