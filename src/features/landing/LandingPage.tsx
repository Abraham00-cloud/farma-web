import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  Activity,
  TrendingUp,
  CheckCircle2,
  Sliders,
  Wheat,
  BarChart3,
  BookOpen,
  Headphones,
  Calendar,
  Menu,
  X,
  Users,
  Building2,
  ClipboardList,
  AlertTriangle,
  Package,
  Calculator
} from 'lucide-react';

interface LandingPageProps {
  onProprietorClick?: () => void;
  onManagerClick?: () => void;
}

interface ModalPayload {
  title: string;
  badge?: string;
  tag?: string;
  date?: string;
  details?: string;
  fullStory?: string;
  excerpt?: string;
  description?: string;
  highlights?: string[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onProprietorClick = () => {},
  onManagerClick = () => {}
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState('Broiler Poultry');
  const [selectedScale, setSelectedScale] = useState('Single Farm Facility');
  const [selectedModule, setSelectedModule] = useState('Multi-Farm & Flock Tracking');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<ModalPayload | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);

  // Batch Estimator Mode: 'duration' (Age in Weeks) | 'fcr' (Target FCR)
  const [estimatorMode, setEstimatorMode] = useState<'duration' | 'fcr'>('duration');

  // Duration-based commercial broiler growth benchmarks (25kg bags)
  const durationBenchmarks: Record<
    number,
    { label: string; avgWeightKg: number; feedPerBirdKg: number; impliedFCR: number }
  > = {
    5: { label: '5 Weeks (35 Days)', avgWeightKg: 1.85, feedPerBirdKg: 2.7, impliedFCR: 1.46 },
    6: { label: '6 Weeks (42 Days)', avgWeightKg: 2.3, feedPerBirdKg: 3.65, impliedFCR: 1.59 },
    7: { label: '7 Weeks (49 Days)', avgWeightKg: 2.85, feedPerBirdKg: 4.9, impliedFCR: 1.72 },
    8: { label: '8 Weeks (56 Days)', avgWeightKg: 3.4, feedPerBirdKg: 6.3, impliedFCR: 1.85 }
  };

  // Interactive Batch Margin & FCR Estimator State
  const [simFlockSize, setSimFlockSize] = useState(5000);
  const [simWeeks, setSimWeeks] = useState<number>(6);
  const [simTargetWeight, setSimTargetWeight] = useState(2.2);
  const [simTargetFCR, setSimTargetFCR] = useState(1.52);
  const [simFeedCostPerBag, setSimFeedCostPerBag] = useState(21500);

  const openModal = (type: string, payload: ModalPayload | null = null) => {
    setActiveModal(type);
    setModalPayload(payload);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalPayload(null);
  };

  // Calculations for Batch Estimator (25kg per bag standard)
  const activeBenchmark = durationBenchmarks[simWeeks] || durationBenchmarks[6];
  const effectiveWeightKg =
    estimatorMode === 'duration' ? activeBenchmark.avgWeightKg : simTargetWeight;
  const effectiveFCR =
    estimatorMode === 'duration' ? activeBenchmark.impliedFCR : simTargetFCR;
  const totalFeedKg =
    estimatorMode === 'duration'
      ? Math.round(simFlockSize * activeBenchmark.feedPerBirdKg)
      : Math.round(simFlockSize * simTargetWeight * simTargetFCR);

  const totalBagsNeeded = Math.ceil(totalFeedKg / 25);
  const estimatedFeedSpend = totalBagsNeeded * simFeedCostPerBag;
  const costPerBirdFeedOnly = Math.round(estimatedFeedSpend / (simFlockSize || 1));

  // Outcome-Focused Solutions (The "Why")
  const coreSolutions = [
    {
      id: 'multi-farm',
      title: 'Multi-Farm & Flock Oversight',
      description:
        'Eliminate blind spots across branches. Track live population counts, daily weight gains, and pen status across every farm location from one central view.',
      image:
        'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=900&q=80',
      icon: Activity,
      highlights: [
        'Centralised organisation view across single or multi-site farms',
        'Automatic population adjustment when managers log daily mortalities',
        'Pen-by-pen batch tracking from day-old placement to market harvest'
      ]
    },
    {
      id: 'biosecurity',
      title: 'Biosecurity & Mortality Control',
      description:
        'Catch health issues before they wipe out a batch. Standardise daily pen inspections, vaccination schedules, and immediate alerts when mortality spikes.',
      image:
        'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=900&q=80',
      icon: ShieldCheck,
      highlights: [
        'Structured biosecurity state monitoring across active facilities',
        'Scheduled vaccination and medication checklists for facility managers',
        'Threshold alerts for sudden feed drop-offs or abnormal mortality logs'
      ]
    },
    {
      id: 'fcr-nutrition',
      title: 'Feed Efficiency & Margin Protection',
      description:
        'Stop losing profit to unrecorded feed waste. Track bag-by-bag feed consumption against bird age and FCR so you know your exact cost per bird daily.',
      image:
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80',
      icon: Wheat,
      highlights: [
        'Automated FCR calculation derived directly from daily manager feed logs',
        'Centralised warehouse stock tracking for starter, grower, and finisher feed',
        'Batch-level feed efficiency and cost comparisons across different facilities'
      ]
    }
  ];

  // Product & Role-Focused Modules (The "How")
  const platformModules = [
    {
      title: 'Organisation Owner Portal',
      description:
        'Full multi-farm oversight, global inventory control, and real-time Profit & Loss visibility per batch.',
      image:
        'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80',
      badge: 'Proprietor Role',
      details:
        'Designed for farm owners and directors. Add multiple farm facilities, assign managers, audit global feed stock, and inspect live batch margins without waiting for end-of-month spreadsheets.'
    },
    {
      title: 'Facility Manager Workspace',
      description:
        'Focused daily operational logging for feed usage, mortalities, and health checks with restricted financial access.',
      image:
        'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80',
      badge: 'Manager Role',
      details:
        'Built for speed in the pens. Facility managers log daily feed bags dispensed, water intake, mortality counts, and health notes directly from their phone or laptop—isolated strictly to their assigned facility.'
    },
    {
      title: 'AgriLedger Financial Engine',
      description:
        'Automated cost-per-bird computation and batch Profit & Loss tracking tied directly to daily input logs.',
      image:
        'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80',
      badge: 'Financial Ledger',
      details:
        'Every time a manager records feed bags or vaccines consumed, AgriLedger deducts inventory value and updates the live production cost per bird and net margin for that flock.'
    },
    {
      title: 'Centralised Stock & Warehouse',
      description:
        'Track feed bags, vaccines, and medication balances across central stores and individual farm locations.',
      image:
        'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=800&q=80',
      badge: 'Inventory Control',
      details:
        'Eliminate missing bags and unrecorded transfers. Monitor stock restocks, facility allocations, and consumption variances with complete audit trails.'
    }
  ];

  const operationalWorkflows = [
    {
      tag: 'Multi-Farm Network',
      title: 'Unified Multi-Branch Oversight',
      summary: 'Connect separate farm locations into a single master organisation ledger.',
      image:
        'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
      fullStory:
        'Organisations operating multiple poultry or livestock sites across different agricultural corridors eliminate fragmented WhatsApp and paper reporting by routing all daily pen logs into one structured owner dashboard.'
    },
    {
      tag: 'Role Separation',
      title: 'Strict Operational vs. Financial Access',
      summary: 'Managers record pen activity while owners retain exclusive ledger visibility.',
      image:
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
      fullStory:
        'Role-Based Access Control ensures facility managers have everything they need to log daily feed, weight samples, and mortalities without exposing sensitive supplier pricing or organisation profit margins.'
    },
    {
      tag: 'Cost Accountability',
      title: 'Daily Cost-Per-Bird Tracking',
      summary: 'Know your exact production cost per flock before harvest day arrives.',
      image:
        'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
      fullStory:
        'By linking warehouse feed prices directly to daily manager consumption logs, Farma calculates running cost-per-bird figures continuously throughout the production cycle.'
    }
  ];

  const operationalServices = [
    { icon: Building2, label: 'Multi-Farm Setup' },
    { icon: Users, label: 'Role-Based Access' },
    { icon: ClipboardList, label: 'Daily Pen Logging' },
    { icon: Wheat, label: 'FCR & Feed Tracking' },
    { icon: Package, label: 'Stock & Warehouse' }
  ];

  const knowledgeGuides = [
    {
      date: 'Operational Guide',
      title: 'Calculating Accurate Feed Conversion Ratios (FCR) Across Broiler Cycles',
      excerpt:
        'How consistent daily feed weighing and mortality deductions prevent distorted end-of-batch margin figures.',
      image:
        'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80'
    },
    {
      date: 'Biosecurity Protocol',
      title: 'Standardising Daily Pen Inspection & Mortality Threshold Alerts',
      excerpt:
        'Structuring morning and evening facility logs to catch feed drop-offs and respiratory symptoms early.',
      image:
        'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80'
    },
    {
      date: 'Farm Accounting',
      title: 'Separating Operational Logs from Financial Ledgers in Multi-Site Farms',
      excerpt:
        'Why clean role boundaries between pen supervisors and proprietors strengthen accountability and audit trails.',
      image:
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const fieldFeedback = [
    {
      quote:
        'We used to wait until the end of the cycle to reconcile feed receipts against sales. Farma updates our batch costs every time a manager logs daily feed usage.',
      name: 'S.M.',
      role: 'Organisation Owner • Agro-Allied Enterprise',
      initials: 'SM'
    },
    {
      quote:
        'Logging daily feed bags and mortalities takes two minutes on my phone. The owner sees the updated pen count immediately without endless phone calls.',
      name: 'D.V.',
      role: 'Facility Manager • Commercial Broiler Farm',
      initials: 'DV'
    },
    {
      quote:
        'Bringing our separate farm branches into one structured system stopped missing inventory reports and gave us clear visibility across every flock.',
      name: 'P.A.',
      role: 'Operations Director • Multi-Site Network',
      initials: 'PA'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#1A241B] font-sans antialiased selection:bg-[#84A93C] selection:text-white">
      {/* ==================== HERO & NAVIGATION ==================== */}
      <section className="relative bg-[#13311C] text-white">
        {/* Background Image with Left-Weighted Gradient Overlay */}
        <div className="absolute inset-0 overflow-hidden flex justify-end bg-[#102a17]">
          <img
            src="/images/hero_farmer.jpeg"
            alt="Livestock farmer overseeing herd operations"
            className="w-full md:w-4/5 h-full object-cover object-center opacity-100"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgb(16, 42, 23) 0%, rgba(19, 49, 28, 0.77) 44%, rgba(19, 49, 28, 0.35) 75%, rgba(19, 49, 28, 0.2) 100%)'
            }}
          />
        </div>

        {/* Navigation Header */}
        <header className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-4">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <a href="#" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-[#84A93C] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="font-bold text-xl text-[#13311C] leading-none">F</span>
              </div>
              <div className="leading-tight">
                <span className="text-xl font-extrabold tracking-tight text-white block">
                  Farma
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A8C868] block">
                  Farm Management OS
                </span>
              </div>
            </a>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-white/90">
              <a href="#" className="text-[#A8C868] font-semibold">
                Home
              </a>
              <a href="/about" className="hover:text-[#A8C868] transition-colors">
                About Us
              </a>
              <a href="#solutions" className="hover:text-[#A8C868] transition-colors">
                Solutions
              </a>
              <a href="#modules" className="hover:text-[#A8C868] transition-colors">
                Platform
              </a>
              <a href="#why-farma" className="hover:text-[#A8C868] transition-colors">
                Architecture
              </a>
              <a href="#guides" className="hover:text-[#A8C868] transition-colors">
                Guides
              </a>
              <a href="#contact" className="hover:text-[#A8C868] transition-colors">
                Contact
              </a>
            </nav>

            {/* Right Actions: System Login & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => openModal('simulator')}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-[#A8C868]" />
                Batch Estimator
              </button>

              {/* System Login Dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                  className="inline-flex items-center gap-2 bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  System Login
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      portalDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {portalDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white text-[#18261B] rounded-xl shadow-2xl border border-gray-100 p-2 z-50">
                    <button
                      onClick={() => {
                        setPortalDropdownOpen(false);
                        onProprietorClick();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-[#F3F6EE] transition-colors cursor-pointer"
                    >
                      <div className="text-sm font-bold text-[#13311C]">Organisation Owner</div>
                      <div className="text-[11px] text-[#5C6B5E]">
                        Master Dashboard &amp; Financial Ledger
                      </div>
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={() => {
                        setPortalDropdownOpen(false);
                        onManagerClick();
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-lg hover:bg-[#F3F6EE] transition-colors cursor-pointer"
                    >
                      <div className="text-sm font-bold text-[#13311C]">Facility Manager</div>
                      <div className="text-[11px] text-[#5C6B5E]">
                        Daily Pen Logs, Feed &amp; Mortalities
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 md:hidden transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 bg-[#183B22] border border-white/15 rounded-2xl p-4 space-y-3 shadow-2xl">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <a
                  href="#"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg bg-white/10 font-semibold text-[#A8C868]"
                >
                  Home
                </a>
                <a
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  About Us
                </a>
                <a
                  href="#solutions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Solutions
                </a>
                <a
                  href="#modules"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Platform
                </a>
                <a
                  href="#why-farma"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Architecture
                </a>
                <a
                  href="#guides"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Guides
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Contact
                </a>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onProprietorClick();
                  }}
                  className="w-full py-2.5 px-3 bg-[#84A93C] text-[#13311C] font-bold rounded-xl text-xs text-left flex items-center justify-between"
                >
                  <span>Login as Organisation Owner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onManagerClick();
                  }}
                  className="w-full py-2.5 px-3 bg-white/10 text-white font-semibold rounded-xl text-xs text-left flex items-center justify-between"
                >
                  <span>Login as Facility Manager</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Hero Headline & Primary CTAs */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-14 md:pb-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[#B8D87A] text-xs font-medium mb-5">
              <span>Multi-Tenant Farm Management Information System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold tracking-tight leading-[1.1] text-white">
              Healthy Livestock.
              <span className="block text-[#9CC14E] mt-1">Stronger Margins.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
              Connect your facility managers in the pens directly to your central financial ledger. Track daily feed consumption, mortalities, FCR, and batch profitability across every farm location.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onProprietorClick}
                className="inline-flex items-center gap-2.5 bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] font-bold px-6 py-3.5 rounded-lg shadow-lg shadow-black/20 transition-all cursor-pointer"
              >
                <span>Register Organisation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#solutions"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold px-6 py-3.5 rounded-lg border border-white/20 transition-colors"
              >
                <span>Explore Platform</span>
              </a>
            </div>
          </div>
        </div>

        {/* Floating Operational Configuration Bar */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mb-14">
          <div className="bg-white rounded-2xl shadow-xl shadow-black/10 border border-gray-100 p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Livestock Type */}
              <div className="md:col-span-3 flex items-start gap-3 md:border-r border-gray-200 md:pr-4">
                <div className="w-9 h-9 rounded-lg bg-[#EEF4E4] text-[#4C7A2B] flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <label className="block text-xs font-bold text-[#1A241B]">Livestock Operation</label>
                  <select
                    value={selectedSpecies}
                    onChange={(e) => setSelectedSpecies(e.target.value)}
                    className="w-full text-xs text-gray-500 bg-transparent font-medium focus:outline-none mt-0.5 cursor-pointer"
                  >
                    <option>Broiler Poultry</option>
                    <option>Layer Egg Production</option>
                    <option>Noiler &amp; Cockerel</option>
                    <option>Cattle &amp; Ruminants</option>
                    <option>Swine &amp; Piggery</option>
                  </select>
                </div>
              </div>

              {/* Farm Scale */}
              <div className="md:col-span-4 flex items-start gap-3 md:border-r border-gray-200 md:pr-4">
                <div className="w-9 h-9 rounded-lg bg-[#EEF4E4] text-[#4C7A2B] flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <label className="block text-xs font-bold text-[#1A241B]">Operation Scale</label>
                  <select
                    value={selectedScale}
                    onChange={(e) => setSelectedScale(e.target.value)}
                    className="w-full text-xs text-gray-500 bg-transparent font-medium focus:outline-none mt-0.5 cursor-pointer"
                  >
                    <option>Single Farm Facility</option>
                    <option>2 – 5 Farm Branches</option>
                    <option>6+ Enterprise Network</option>
                    <option>Outgrower / Cooperative Scheme</option>
                  </select>
                </div>
              </div>

              {/* Focus Module */}
              <div className="md:col-span-3 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EEF4E4] text-[#4C7A2B] flex items-center justify-center shrink-0 mt-0.5">
                  <Sliders className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <label className="block text-xs font-bold text-[#1A241B]">Primary Focus</label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="w-full text-xs text-gray-500 bg-transparent font-medium focus:outline-none mt-0.5 cursor-pointer"
                  >
                    <option>Multi-Farm &amp; Flock Tracking</option>
                    <option>Feed &amp; FCR Analytics</option>
                    <option>Biosecurity &amp; Health Logs</option>
                    <option>Batch Profit &amp; Loss Ledger</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <div className="md:col-span-2">
                <button
                  onClick={() => openModal('simulator')}
                  className="w-full bg-[#4C7A2B] hover:bg-[#3D6421] text-white font-bold text-sm py-3.5 px-5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Estimate Batch</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== OUR SOLUTIONS ==================== */}
      <section id="solutions" className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A8334]">
              Operational Outcomes
            </span>
            <h2 className="text-3xl font-extrabold text-[#18261B] tracking-tight mt-1">
              Our Solutions
            </h2>
          </div>
          <button
            onClick={() => openModal('all-solutions')}
            className="text-sm font-semibold text-[#4C7A2B] hover:text-[#13311C] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {coreSolutions.map((sol) => {
            const IconComponent = sol.icon;
            return (
              <div
                key={sol.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={sol.image}
                    alt={sol.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Overlapping Circular Badge */}
                <div className="px-6 -mt-7 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-[#3A6324] border-4 border-white text-white flex items-center justify-center shadow-md">
                    <IconComponent className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-6 pt-3 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[#18261B]">{sol.title}</h3>
                  <p className="mt-2.5 text-sm text-[#5C6B5E] leading-relaxed flex-1">
                    {sol.description}
                  </p>
                  <button
                    onClick={() => openModal('solution-detail', sol)}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#3A6324] hover:text-[#13311C] transition-colors cursor-pointer"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================== WHY CHOOSE FARMA ==================== */}
      <section id="why-farma" className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Features List */}
            <div className="lg:col-span-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A8334]">
                Multi-Tenant Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#18261B] tracking-tight mt-1">
                Why Choose Farma?
              </h2>
              <p className="mt-3 text-[#5C6B5E] text-base leading-relaxed max-w-lg">
                We connect daily pen-level operations directly to central financial oversight so farm owners can manage multiple facilities without losing visibility.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#EEF4E4] text-[#3A6324] flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#18261B]">
                      Daily Log-Driven Insights
                    </h4>
                    <p className="text-sm text-[#5C6B5E] mt-0.5">
                      Every feed bag dispensed and mortality logged by facility managers automatically updates batch FCR and cost-per-bird metrics.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#EEF4E4] text-[#3A6324] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#18261B]">
                      Strict Role-Based Isolation
                    </h4>
                    <p className="text-sm text-[#5C6B5E] mt-0.5">
                      Facility managers access only their assigned pens for daily logging, while organisation owners retain full financial ledger control.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#EEF4E4] text-[#3A6324] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#18261B]">
                      Early Mortality &amp; Health Alerts
                    </h4>
                    <p className="text-sm text-[#5C6B5E] mt-0.5">
                      Receive immediate dashboard notifications when any facility records a sudden drop in feed intake or abnormal mortality count.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#EEF4E4] text-[#3A6324] flex items-center justify-center shrink-0">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#18261B]">
                      Centralised Warehouse Accountability
                    </h4>
                    <p className="text-sm text-[#5C6B5E] mt-0.5">
                      Track feed and vaccine stock balances across your central store and individual farm branches in one unified audit log.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Circular Collage */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-[460px] h-[440px]">
                {/* Decorative Dot Matrix */}
                <div
                  className="absolute top-2 right-6 w-28 h-28 opacity-35 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#4C7A2B 2px, transparent 2px)',
                    backgroundSize: '12px 12px'
                  }}
                />

                {/* Main Large Circle */}
                <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden border-8 border-[#F7F8F5] shadow-2xl ml-auto relative z-10">
                  <img
                    src="https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=85"
                    alt="Poultry facility supervision"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bottom-Left Overlapping Circle */}
                <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden border-8 border-white shadow-xl absolute bottom-2 left-2 z-20">
                  <img
                    src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=700&q=85"
                    alt="Broiler flock management"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating System Pill */}
                <div className="absolute bottom-8 right-2 z-30 bg-[#13311C] text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10">
                  <div className="text-[11px] uppercase tracking-wider text-[#A8C868] font-bold">
                    Multi-Tenant Sync
                  </div>
                  <div className="text-sm font-extrabold mt-0.5">Owner &amp; Manager Roles</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dark Forest Green Architectural Highlights Strip */}
          <div className="mt-16 bg-[#13311C] rounded-2xl p-6 sm:p-8 text-white shadow-lg">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-[#9CC14E] flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold">Multi-Farm</div>
                  <div className="text-xs text-white/75">Centralised Branch Control</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-[#9CC14E] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold">RBAC Security</div>
                  <div className="text-xs text-white/75">Scoped Role Permissions</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-[#9CC14E] flex items-center justify-center shrink-0">
                  <Wheat className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold">FCR Tracking</div>
                  <div className="text-xs text-white/75">Feed-to-Weight Ratios</div>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white/10 text-[#9CC14E] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold">AgriLedger</div>
                  <div className="text-xs text-white/75">Batch P&amp;L Accounting</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PLATFORM MODULES ==================== */}
      <section id="modules" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A8334]">
              Software Suite
            </span>
            <h2 className="text-3xl font-extrabold text-[#18261B] tracking-tight mt-1">
              Platform Modules
            </h2>
          </div>
          <button
            onClick={() => openModal('simulator')}
            className="text-sm font-semibold text-[#4C7A2B] hover:text-[#13311C] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Open Batch Estimator</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformModules.map((mod) => (
            <div
              key={mod.title}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={mod.image}
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-[#13311C]/90 backdrop-blur-xs text-[#B8D87A] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                  {mod.badge}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-base font-bold text-[#18261B]">{mod.title}</h3>
                <p className="mt-2 text-xs text-[#5C6B5E] leading-relaxed flex-1">
                  {mod.description}
                </p>
                <button
                  onClick={() => openModal('module-detail', mod)}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#3A6324] hover:text-[#13311C] transition-colors cursor-pointer"
                >
                  <span>Inspect Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== OPERATIONAL WORKFLOWS ==================== */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A8334]">
                How It Operates
              </span>
              <h2 className="text-3xl font-extrabold text-[#18261B] tracking-tight mt-1">
                Operational Workflows
              </h2>
            </div>
            <button
              onClick={onProprietorClick}
              className="text-sm font-semibold text-[#4C7A2B] hover:text-[#13311C] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Launch Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {operationalWorkflows.map((story) => (
              <div
                key={story.title}
                className="bg-[#F7F8F5] rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <span className="inline-block w-fit text-[11px] font-bold text-[#3A6324] bg-[#E3EDD3] px-2.5 py-1 rounded-md">
                    {story.tag}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-[#18261B]">{story.title}</h3>
                  <p className="mt-1.5 text-sm text-[#5C6B5E] flex-1">{story.summary}</p>
                  <button
                    onClick={() => openModal('story-detail', story)}
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#3A6324] hover:text-[#13311C] transition-colors cursor-pointer"
                  >
                    <span>Read Workflow</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dark Forest Green Platform Capabilities Banner */}
          <div className="mt-14 bg-[#13311C] rounded-2xl p-8 sm:p-10 text-white">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h3 className="text-2xl font-extrabold">Built for Commercial Operations</h3>
              <p className="text-xs sm:text-sm text-white/75 mt-1">
                Every workflow is designed around real daily pen reporting and central accounting.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#84A93C]/20 text-[#9CC14E] flex items-center justify-center mx-auto mb-2.5">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold">Unlimited</div>
                <div className="text-xs text-white/75 mt-1">Farm Facilities per Org</div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#84A93C]/20 text-[#9CC14E] flex items-center justify-center mx-auto mb-2.5">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold">Daily Logs</div>
                <div className="text-xs text-white/75 mt-1">Feed, Weight &amp; Mortality</div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#84A93C]/20 text-[#9CC14E] flex items-center justify-center mx-auto mb-2.5">
                  <Package className="w-5 h-5" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold">Auto-Deduct</div>
                <div className="text-xs text-white/75 mt-1">Warehouse Stock Ledger</div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-[#84A93C]/20 text-[#9CC14E] flex items-center justify-center mx-auto mb-2.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xl sm:text-2xl font-extrabold">Role-Scoped</div>
                <div className="text-xs text-white/75 mt-1">Owner &amp; Manager Portals</div>
              </div>
            </div>
          </div>

          {/* Core Services Strip */}
          <div className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-[#18261B]">Core System Capabilities</h3>
              <button
                onClick={onProprietorClick}
                className="text-xs font-bold text-[#4C7A2B] hover:text-[#13311C] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {operationalServices.map((srv) => {
                const SrvIcon = srv.icon;
                return (
                  <div
                    key={srv.label}
                    onClick={() => openModal('demo')}
                    className="bg-[#F7F8F5] hover:bg-[#EEF4E4] border border-gray-200/70 rounded-2xl p-5 text-center transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white text-[#3A6324] shadow-xs flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                      <SrvIcon className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-[#18261B]">{srv.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== KNOWLEDGE HUB ==================== */}
      <section id="guides" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A8334]">
              Documentation &amp; Best Practices
            </span>
            <h2 className="text-3xl font-extrabold text-[#18261B] tracking-tight mt-1">
              Knowledge Hub
            </h2>
          </div>
          <button
            onClick={() => openModal('demo')}
            className="text-sm font-semibold text-[#4C7A2B] hover:text-[#13311C] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Request Onboarding Guide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {knowledgeGuides.map((post) => (
            <article
              key={post.title}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              <div className="h-44 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{post.date}</span>
                </div>
                <h3 className="mt-2 text-base font-bold text-[#18261B] leading-snug">
                  {post.title}
                </h3>
                <p className="mt-2 text-xs text-[#5C6B5E] leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <button
                  onClick={() => openModal('article-detail', post)}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#3A6324] hover:text-[#13311C] transition-colors cursor-pointer"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ==================== WHAT FARMERS SAY ==================== */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5A8334]">
                From The Field
              </span>
              <h2 className="text-3xl font-extrabold text-[#18261B] tracking-tight mt-1">
                What Farm Teams Say
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {fieldFeedback.map((t) => (
              <div
                key={t.name}
                className="bg-[#F7F8F5] rounded-2xl p-6 border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <p className="text-sm text-[#39483B] leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200/70 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#13311C] text-[#A8C868] flex items-center justify-center font-bold text-xs shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#18261B]">{t.name}</div>
                    <div className="text-xs text-[#5C6B5E]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== READY TO TAKE YOUR FARM TO THE NEXT LEVEL CTA ==================== */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#13311C] text-white p-8 sm:p-14 shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1600&q=80"
            alt="Farm operations landscape"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="relative z-10 max-w-xl">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Ready to Organise Your Farm Network?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-white/85">
              Onboard your facilities, assign pen managers, and track batch profitability in one multi-tenant workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onProprietorClick}
                className="inline-flex items-center gap-2 bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] font-bold px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                <span>Register Organisation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="https://wa.me/2349137772112?text=Hello%20Farma%20Team!%20I%20would%20like%20to%20request%20a%20demonstration%20of%20Farma."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
              >
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer id="contact" className="bg-[#102917] text-white pt-14 pb-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-10 border-b border-white/10">
            {/* Brand Column */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#84A93C] flex items-center justify-center">
                  <span className="font-bold text-lg text-[#102917]">F</span>
                </div>
                <div>
                  <span className="text-lg font-extrabold block leading-none">Farma</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#A8C868]">
                    Farm Management OS
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs text-white/75 leading-relaxed max-w-xs">
                Multi-tenant Farm Management Information System built for commercial poultry and livestock operations across Nigeria.
              </p>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-bold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-xs text-white/75">
                <li>
                  <a href="#" className="hover:text-[#A8C868] transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/about" className="hover:text-[#A8C868] transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#solutions" className="hover:text-[#A8C868] transition-colors">
                    Solutions
                  </a>
                </li>
                <li>
                  <a href="#modules" className="hover:text-[#A8C868] transition-colors">
                    Platform Modules
                  </a>
                </li>
                <li>
                  <a href="#why-farma" className="hover:text-[#A8C868] transition-colors">
                    Architecture
                  </a>
                </li>
                <li>
                  <a href="#guides" className="hover:text-[#A8C868] transition-colors">
                    Knowledge Hub
                  </a>
                </li>
              </ul>
            </div>

            {/* System Access */}
            <div className="lg:col-span-3">
              <h4 className="text-sm font-bold text-white mb-4">System Access</h4>
              <ul className="space-y-2.5 text-xs text-white/75">
                <li>
                  <button
                    onClick={onProprietorClick}
                    className="hover:text-[#A8C868] transition-colors cursor-pointer"
                  >
                    Organisation Owner Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={onManagerClick}
                    className="hover:text-[#A8C868] transition-colors cursor-pointer"
                  >
                    Facility Manager Portal
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openModal('simulator')}
                    className="hover:text-[#A8C868] transition-colors cursor-pointer"
                  >
                    Batch Feed &amp; Margin Estimator
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Us */}
            <div className="lg:col-span-3">
              <h4 className="text-sm font-bold text-white mb-4">Contact Us</h4>
              <ul className="space-y-3 text-xs text-white/75">
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#9CC14E] shrink-0" />
                  <a
                    href="https://wa.me/2349137772112"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    +234 913 777 2112
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#9CC14E] shrink-0" />
                  <a href="mailto:support@farma.com.ng" className="hover:text-white">
                    support@farma.com.ng
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#9CC14E] shrink-0 mt-0.5" />
                  <span>Nigeria &bull; Serving Commercial Farms Nationwide</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <div>© {new Date().getFullYear()} Farma Technologies (farma.com.ng). All rights reserved.</div>
            <div className="flex items-center gap-5">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ==================== INTERACTIVE MODALS ==================== */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Batch Feed & Margin Estimator */}
            {activeModal === 'simulator' && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#4C7A2B]">
                  Batch Planning Calculator
                </span>
                <h3 className="text-2xl font-extrabold text-[#18261B] mt-1">
                  Feed &amp; Cost-Per-Bird Estimator
                </h3>
                <p className="text-xs text-[#5C6B5E] mt-1">
                  Configured for <strong>{selectedSpecies}</strong> &bull;{' '}
                  <strong>{selectedScale}</strong> ({selectedModule}).
                </p>

                {/* Mode Switcher Tabs */}
                <div className="mt-5 grid grid-cols-2 p-1 bg-[#EEF2E9] rounded-xl border border-gray-200/80">
                  <button
                    type="button"
                    onClick={() => setEstimatorMode('duration')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      estimatorMode === 'duration'
                        ? 'bg-[#13311C] text-white shadow-xs'
                        : 'text-[#4A594C] hover:text-[#18261B]'
                    }`}
                  >
                    Estimate by Age / Duration
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstimatorMode('fcr')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      estimatorMode === 'fcr'
                        ? 'bg-[#13311C] text-white shadow-xs'
                        : 'text-[#4A594C] hover:text-[#18261B]'
                    }`}
                  >
                    Estimate by Target FCR
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span>Placed Flock Size (Birds)</span>
                      <div className="flex items-center gap-1.5 bg-[#F7F8F5] border border-gray-200 rounded-lg px-2.5 py-1">
                        <input
                          type="number"
                          min={1}
                          max={50000}
                          value={simFlockSize}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(50000, Number(e.target.value) || 1));
                            setSimFlockSize(val);
                          }}
                          className="w-20 text-right font-extrabold text-[#3A6324] bg-transparent focus:outline-none"
                        />
                        <span className="text-[#5C6B5E] font-semibold">birds</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50000}
                      step={1}
                      value={simFlockSize}
                      onChange={(e) => setSimFlockSize(Number(e.target.value))}
                      className="w-full accent-[#4C7A2B] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>1 bird</span>
                      <span>25,000</span>
                      <span>50,000 birds</span>
                    </div>
                  </div>

                  {estimatorMode === 'duration' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-[#18261B] block mb-2">
                          Rearing Duration (Age to Market)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[5, 6, 7, 8].map((wk) => (
                            <button
                              key={wk}
                              type="button"
                              onClick={() => setSimWeeks(wk)}
                              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                simWeeks === wk
                                  ? 'bg-[#3A6324] text-white border-[#3A6324]'
                                  : 'bg-[#F7F8F5] text-[#18261B] border-gray-200 hover:bg-[#EEF4E4]'
                              }`}
                            >
                              {wk} Weeks
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[#F7F8F5] p-3 rounded-xl border border-gray-200">
                          <label className="text-[11px] font-semibold text-gray-500 block">
                            25kg Feed Bag (₦)
                          </label>
                          <input
                            type="number"
                            step="500"
                            value={simFeedCostPerBag}
                            onChange={(e) => setSimFeedCostPerBag(Number(e.target.value))}
                            className="w-full font-bold text-sm mt-1 bg-transparent focus:outline-none"
                          />
                        </div>

                        <div className="bg-[#EEF4E4]/70 p-3 rounded-xl border border-[#84A93C]/30 flex flex-col justify-center">
                          <span className="text-[11px] font-semibold text-[#4A594C]">
                            Expected Weight &amp; FCR ({activeBenchmark.label})
                          </span>
                          <span className="font-extrabold text-sm text-[#13311C] mt-0.5">
                            ~{effectiveWeightKg} kg/bird &bull; {effectiveFCR} FCR
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#F7F8F5] p-3 rounded-xl border border-gray-200">
                        <label className="text-[11px] font-semibold text-gray-500 block">
                          Target Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={simTargetWeight}
                          onChange={(e) => setSimTargetWeight(Number(e.target.value))}
                          className="w-full font-bold text-sm mt-1 bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="bg-[#F7F8F5] p-3 rounded-xl border border-gray-200">
                        <label className="text-[11px] font-semibold text-gray-500 block">
                          Target FCR
                        </label>
                        <input
                          type="number"
                          step="0.02"
                          value={simTargetFCR}
                          onChange={(e) => setSimTargetFCR(Number(e.target.value))}
                          className="w-full font-bold text-sm mt-1 bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="bg-[#F7F8F5] p-3 rounded-xl border border-gray-200">
                        <label className="text-[11px] font-semibold text-gray-500 block">
                          25kg Feed Bag (₦)
                        </label>
                        <input
                          type="number"
                          step="500"
                          value={simFeedCostPerBag}
                          onChange={(e) => setSimFeedCostPerBag(Number(e.target.value))}
                          className="w-full font-bold text-sm mt-1 bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-[#13311C] text-white rounded-2xl p-5">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-[11px] text-white/70">Total Feed Needed</div>
                        <div className="text-lg font-extrabold text-[#9CC14E] mt-0.5">
                          {totalBagsNeeded.toLocaleString()} bags
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-white/70">Est. Feed Spend</div>
                        <div className="text-lg font-extrabold mt-0.5">
                          ₦
                          {estimatedFeedSpend >= 1000000
                            ? `${(estimatedFeedSpend / 1000000).toFixed(2)}M`
                            : estimatedFeedSpend.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-white/70">Feed Cost / Bird</div>
                        <div className="text-lg font-extrabold text-[#9CC14E] mt-0.5">
                          ₦{costPerBirdFeedOnly.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                      <span>
                        Resulting FCR:{' '}
                        <strong className="text-[#9CC14E]">{effectiveFCR.toFixed(2)}</strong>
                      </span>
                      <span>
                        Target Live Weight:{' '}
                        <strong className="text-white">{effectiveWeightKg.toFixed(2)} kg</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeModal();
                      onProprietorClick();
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#84A93C] text-[#13311C] hover:bg-[#95BD42] cursor-pointer"
                  >
                    Track Live in Farma
                  </button>
                </div>
              </div>
            )}

            {/* Solution / Module / Story Detail Modal */}
            {(activeModal === 'solution-detail' ||
              activeModal === 'module-detail' ||
              activeModal === 'story-detail' ||
              activeModal === 'article-detail') &&
              modalPayload && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4C7A2B]">
                    {modalPayload.badge || modalPayload.tag || modalPayload.date || 'Farma Platform'}
                  </span>
                  <h3 className="text-2xl font-extrabold text-[#18261B] mt-1">
                    {modalPayload.title}
                  </h3>
                  <p className="mt-3 text-sm text-[#4A594C] leading-relaxed">
                    {modalPayload.details ||
                      modalPayload.fullStory ||
                      modalPayload.excerpt ||
                      modalPayload.description}
                  </p>

                  {modalPayload.highlights && (
                    <ul className="mt-4 space-y-2">
                      {modalPayload.highlights.map((item: string) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-xs font-medium text-[#18261B]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#4C7A2B] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        closeModal();
                        onProprietorClick();
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#13311C] text-white hover:bg-[#1E4A2B] cursor-pointer"
                    >
                      Open Organisation Portal
                    </button>
                  </div>
                </div>
              )}

            {/* All Solutions Modal */}
            {activeModal === 'all-solutions' && (
              <div>
                <h3 className="text-2xl font-extrabold text-[#18261B]">
                  Farma Platform Capabilities
                </h3>
                <p className="text-xs text-[#5C6B5E] mt-1">
                  Core modules built into the Farma multi-tenant system.
                </p>
                <div className="mt-5 space-y-3">
                  {coreSolutions.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-[#F7F8F5] border border-gray-200/70"
                    >
                      <div className="font-bold text-sm text-[#18261B]">{s.title}</div>
                      <p className="text-xs text-[#5C6B5E] mt-1">{s.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#13311C] text-white cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Demo / Onboarding Modal */}
            {activeModal === 'demo' && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#4C7A2B]">
                  Get Started
                </span>
                <h3 className="text-2xl font-extrabold text-[#18261B] mt-1">
                  Onboard Your Farm Organisation
                </h3>
                <p className="text-xs text-[#5C6B5E] mt-1">
                  Create your master organisation account directly or reach out to our team on WhatsApp for multi-facility onboarding.
                </p>

                <div className="mt-5 space-y-3">
                  <button
                    onClick={() => {
                      closeModal();
                      onProprietorClick();
                    }}
                    className="w-full py-3.5 px-4 bg-[#13311C] hover:bg-[#1B4327] text-white font-bold rounded-xl text-sm flex items-center justify-between cursor-pointer"
                  >
                    <span>Continue to Organisation Owner Portal</span>
                    <ArrowRight className="w-4 h-4 text-[#A8C868]" />
                  </button>

                  <a
                    href="https://wa.me/2349137772112?text=Hello%20Farma%20Team!%20I%20would%20like%20assistance%20onboarding%20my%20farm."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-[#84A93C] hover:bg-[#95BD42] text-[#13311C] font-bold rounded-xl text-sm flex items-center justify-between"
                  >
                    <span>Chat with Support on WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;