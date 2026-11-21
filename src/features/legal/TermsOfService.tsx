import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TermsOfService: React.FC = () => {
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

      {/* Terms Document Container */}
      <main className="relative z-10 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white p-7 sm:p-12 rounded-3xl border border-gray-100 shadow-xl shadow-black/10">
          {/* Document Header */}
          <div className="mb-10 border-b border-gray-100 pb-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4E4] text-[#3A6324] text-[11px] font-bold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Platform Usage Agreement
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 text-[#18261B] tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs font-semibold text-[#5C6B5E] mt-2">
              Effective Date: August 2026 &bull; Farma Technologies (farma.com.ng)
            </p>
          </div>

          <div className="space-y-9 text-[#39483B] text-sm sm:text-[15px] leading-relaxed">
            <section>
              <h2 className="text-lg sm:text-xl font-extrabold mb-3 text-[#18261B]">
                1. Acceptance of Terms
              </h2>
              <p>
                By registering a farm organisation or signing into the Farma platform, you agree to
                be bound by these Terms of Service. If you do not agree to these terms, you must not
                access or use the platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-extrabold mb-3 text-[#18261B]">
                2. Account Security &amp; Staff Access
              </h2>
              <p>
                As the Organisation Owner, you are responsible for safeguarding your master login
                credentials and managing access permissions for any Facility Managers you provision
                within your workspace. Notify us immediately if you suspect unauthorised access to
                your account.
              </p>
            </section>

            <section className="bg-[#F7F8F5] p-6 rounded-2xl border border-gray-200/80">
              <div className="flex items-center gap-2.5 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#3A6324]" />
                <h2 className="text-lg font-extrabold text-[#18261B]">
                  3. Ownership of Data &amp; Software
                </h2>
              </div>
              <ul className="space-y-3">
                <li>
                  <strong className="text-[#18261B] block">Your Farm&apos;s Data:</strong>
                  You retain 100% ownership of all daily pen logs, inventory records, financial
                  ledgers, and operational data submitted into Farma.
                </li>
                <li>
                  <strong className="text-[#18261B] block">Our Platform:</strong>
                  Farma Technologies retains full intellectual property rights to the software,
                  interface design, analytics engines, and underlying infrastructure.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg sm:text-xl font-extrabold mb-3 text-[#18261B]">
                4. Acceptable Use
              </h2>
              <p>To keep the platform reliable and secure for all agricultural organisations, you agree not to:</p>
              <ul className="list-disc pl-5 mt-3 space-y-2 marker:text-[#4C7A2B]">
                <li>Attempt to probe, bypass, or compromise Farma&apos;s security controls.</li>
                <li>Access or attempt to access records belonging to another organisation.</li>
                <li>Use the software to support unlawful agricultural or commercial activities.</li>
              </ul>
            </section>

            <section className="bg-amber-50/70 border border-amber-200/80 p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <h2 className="text-lg font-extrabold text-[#18261B]">
                  5. Limitation of Liability
                </h2>
              </div>
              <p className="text-[#39483B]">
                Farma is a farm management information system designed to organise operational and
                financial records.{' '}
                <strong className="text-[#18261B]">
                  We do not provide veterinary, agronomic, financial, or legal advice.
                </strong>{' '}
                While our calculations and alerts assist your decision-making, Farma Technologies is
                not liable for livestock mortality, disease outbreaks, feed performance variances, or
                financial losses arising from operational decisions made on your farm.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-7">
              <h2 className="text-lg sm:text-xl font-extrabold mb-2.5 text-[#18261B]">
                6. Contact Information
              </h2>
              <p className="mb-4">
                If you have questions regarding these Terms of Service or your obligations when
                using the platform, contact our team at:
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
        <a href="/privacy" className="hover:text-[#18261B] transition-colors font-medium">
          Privacy Policy
        </a>
        <span className="mx-2">&bull;</span>
        <a href="/" className="hover:text-[#18261B] transition-colors font-medium">
          Home
        </a>
      </footer>
    </div>
  );
};

export default TermsOfService;