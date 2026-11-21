import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  ShieldAlert,
  Server,
  Calculator,
  Sparkles,
  Building2,
  Mail
} from 'lucide-react';

export const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  const corePrinciples = [
    {
      number: '01',
      title: 'Connected Data Architecture',
      description:
        'We design multi-tenant databases grounded in real livestock production. When a facility manager logs feed bags dispensed in a pen, the system immediately updates live flock costs and owner margins.',
      icon: Database
    },
    {
      number: '02',
      title: 'Proactive Biosecurity Workflows',
      description:
        'Our backend does not passively archive logs—it actively monitors them. Abnormal mortality curves, feed intake drops, and health flags trigger immediate alerts for executive review.',
      icon: ShieldAlert
    },
    {
      number: '03',
      title: 'Enterprise-Grade Isolation',
      description:
        'Built on resilient cloud infrastructure with strict organisation-level data isolation, role-scoped permissions, and high-availability APIs engineered for daily field reliability.',
      icon: Server
    },
    {
      number: '04',
      title: 'Dynamic Cost Accounting',
      description:
        'Resource consumption is computed continuously. As feed and medication costs fluctuate across restocks, weighted cost tracking keeps your batch Profit & Loss accurate.',
      icon: Calculator
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#1A241B] font-sans antialiased flex flex-col justify-between relative overflow-hidden selection:bg-[#84A93C] selection:text-white">
      {/* Top Forest Green Banner */}
      <div className="absolute top-0 inset-x-0 h-80 bg-[#13311C] pointer-events-none" />

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

      {/* Main Content Card */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white p-7 sm:p-12 lg:p-14 rounded-3xl border border-gray-100 shadow-xl shadow-black/10">
          {/* Sub-Navigation Anchor Strip */}
          <nav className="flex flex-wrap items-center gap-6 border-b border-gray-100 pb-4 mb-12 text-xs font-bold uppercase tracking-wider text-[#5C6B5E]">
            <a
              href="#story"
              className="text-[#13311C] border-b-2 border-[#84A93C] pb-4 -mb-[17px] transition-colors"
            >
              Our Story
            </a>
            <a href="#technology" className="hover:text-[#13311C] transition-colors">
              The Technology
            </a>
            <a href="#leadership" className="hover:text-[#13311C] transition-colors">
              Leadership
            </a>
          </nav>

          {/* ==================== SECTION 1: OUR STORY ==================== */}
          <section id="story" className="mb-16 scroll-mt-24">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4E4] text-[#3A6324] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              01. Genesis &amp; Vision
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] text-[#18261B] mt-4 mb-6 tracking-tight max-w-3xl">
              Eliminating agricultural guesswork through precision technology.
            </h1>

            <div className="text-[#39483B] text-base leading-relaxed space-y-4 max-w-3xl">
              <p>
                Farma was built around a clear operational reality: commercial livestock farms are
                high-velocity businesses, yet daily pen activity is often disconnected from the
                owner&apos;s financial ledger. When feed consumption, mortalities, and stock
                movements live in scattered notebooks or chat threads, agribusinesses absorb
                avoidable margin leaks.
              </p>
              <p>
                Sustainable profitability requires real-time operational instrumentation. By
                treating every farm branch, pen, flock batch, and feed restock as a structured data
                point, Farma converts daily field activity into immediate visibility for farm
                proprietors.
              </p>
            </div>
          </section>

          {/* ==================== SECTION 2: CORE SYSTEMS ==================== */}
          <section
            id="technology"
            className="bg-[#13311C] text-white p-7 sm:p-11 lg:p-12 rounded-3xl mb-16 shadow-lg scroll-mt-24 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="mb-10 border-b border-white/10 pb-7">
                <span className="text-[11px] tracking-widest uppercase font-bold text-[#A8C868] block">
                  02. Core Systems
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
                  Our Technical Foundation
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {corePrinciples.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.number}
                      className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[#84A93C]/20 text-[#9CC14E] flex items-center justify-center">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-extrabold text-white/40">{item.number}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="text-white/75 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ==================== SECTION 3: EXECUTIVE LEADERSHIP ==================== */}
          <section id="leadership" className="pt-2 scroll-mt-24">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4E4] text-[#3A6324] text-[11px] font-bold uppercase tracking-wider mb-6">
              <Building2 className="w-3.5 h-3.5" />
              03. Executive Leadership
            </span>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
              {/* Portrait Container */}
              <div className="w-full md:w-64 h-80 shrink-0 overflow-hidden rounded-2xl border border-gray-200/80 shadow-md group relative bg-[#13311C]">
                <img
                  src="/1000000659.jpg"
                  alt="Abraham Alagbe .A"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Bio & Credentials */}
              <div className="space-y-5 flex-1">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#18261B] tracking-tight">
                    Abraham Alagbe .A
                  </h2>
                  <p className="text-xs font-bold text-[#3A6324] mt-1.5 uppercase tracking-wider">
                    Founder &amp; Chief Systems Architect
                  </p>
                </div>

                <div className="text-[#39483B] text-sm sm:text-base leading-relaxed space-y-4">
                  <p>
                    Abraham is a backend software engineer and Computer Science graduate of SQI
                    College of ICT, specialising in secure, high-scale enterprise systems. Merging a
                    disciplined engineering background with practical agricultural workflows, he
                    architected Farma to eliminate the operational fragmentation that erodes farm
                    margins.
                  </p>
                  <p>
                    Guided by the principle that software should bring clarity and accountability to
                    daily field execution, Abraham builds systems that give farm proprietors
                    real-time certainty over flock performance and capital efficiency.
                  </p>
                </div>

                {/* Credentials Pills */}
                <div className="pt-2 flex flex-wrap gap-2.5 text-xs font-bold">
                  <span className="bg-[#13311C] text-[#A8C868] px-3.5 py-2 rounded-lg">
                    Backend Systems Architecture
                  </span>
                  <span className="bg-[#EEF4E4] text-[#13311C] px-3.5 py-2 rounded-lg">
                    SQI College of ICT
                  </span>
                  <span className="bg-[#F7F8F5] text-[#39483B] border border-gray-200 px-3.5 py-2 rounded-lg">
                    AgTech &amp; Financial Ledgers
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-10 bg-[#13311C] rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold">
              Want to learn more about our platform?
            </h3>
            <p className="text-xs sm:text-sm text-white/75 mt-1">
              Reach out to our engineering and onboarding team or launch your organisation workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="mailto:support@farma.com.ng?subject=Inquiry:%20Farma%20Platform"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs px-5 py-3.5 rounded-xl border border-white/15 transition-colors"
            >
              <Mail className="w-4 h-4 text-[#A8C868]" />
              <span>Email Our Team</span>
            </a>
            <button
              type="button"
              onClick={() => navigate('/auth/proprietor')}
              className="inline-flex items-center gap-2 bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] font-bold text-xs px-5 py-3.5 rounded-xl transition-colors cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
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
        <a href="/terms" className="hover:text-[#18261B] transition-colors font-medium">
          Terms of Service
        </a>
      </footer>
    </div>
  );
};

export default AboutUs;