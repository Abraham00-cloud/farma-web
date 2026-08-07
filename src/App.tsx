import { useState } from 'react';
import { AuthScreen } from './features/auth/AuthScreen';
import { Sidebar } from './components/layout/Sidebar';
import { HeaderBar } from './components/layout/HeaderBar';
import { ManagerManagementView } from './features/users/ManagerManagementView';
import { authService } from './services/authService';
import type { AuthResponseDto } from './types/auth';
import { FarmManagementView } from './features/farms/FarmManagementView';
import { GlobalSectionsView } from './features/sections/GlobalSectionsView';
import { BatchManagementView } from './features/batches/BatchManagementView';
import { DailyLogsHubView } from './features/dailyLogs/DailyLogsHubView';
import { InventoryManagementView } from './features/inventory/InventoryManagementView';
import { FinancialWorkspaceView } from './features/finance/FinancialWorkspaceView';
import { AnalyticsCommandHubView } from './features/analytics/AnalyticsCommandHubView';
import { ManagerDashboardView } from './features/dashboard/ManagerDashboardView';

export function App() {
  const [authData, setAuthData] = useState<AuthResponseDto | null>(() => {
    return authService.getCurrentAuth();
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const handleLogout = () => {
    authService.logout();
    setAuthData(null);
  };

  if (!authData) {
    return <AuthScreen onAuthSuccess={setAuthData} />;
  }

  const isProprietor = authData.role?.toUpperCase() === 'PROPRIETOR' || authData.role?.toUpperCase() === 'ADMIN';

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* Portal Navigation Sidebar */}
      <Sidebar
        userRole={authData.role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <HeaderBar authData={authData} />

        <main className="p-6 sm:p-8 flex-1 space-y-8">
          {activeTab === 'dashboard' && (
            isProprietor ? (
              <div className="space-y-6 max-w-7xl mx-auto">
                {/* Page Title & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                      Proprietor Executive Dashboard
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Real-time operational overview, livestock population metrics, and facility telemetry.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      System Normal
                    </span>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Metric Card 1 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        Active Facilities
                      </span>
                      <span className="text-lg">🚜</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-slate-900 font-mono">1</span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        100% Operational
                      </span>
                    </div>
                  </div>

                  {/* Metric Card 2 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        Containment Pens
                      </span>
                      <span className="text-lg">🏠</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-slate-900 font-mono">1</span>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        1 Active Pen
                      </span>
                    </div>
                  </div>

                  {/* Metric Card 3 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        Live Population
                      </span>
                      <span className="text-lg">🐣</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-slate-900 font-mono">2,500</span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        0.0% Mortality
                      </span>
                    </div>
                  </div>

                  {/* Metric Card 4 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                        Assigned Personnel
                      </span>
                      <span className="text-lg">👥</span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-slate-900 font-mono">1</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('managers')}
                        className="text-[11px] font-bold text-[#C2410C] hover:underline cursor-pointer"
                      >
                        Manage Personnel →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions & Status Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                  {/* Left 2-Column: Quick Action Modules */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-base font-bold text-slate-900">
                        Operational Shortcut Modules
                      </h4>
                      <span className="text-xs font-mono text-slate-400">Quick Navigation</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('managers')}
                        className="p-4 rounded-xl border border-slate-200 hover:border-[#C2410C]/40 hover:bg-orange-50/30 text-left transition group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-9 h-9 rounded-lg bg-orange-100 text-[#C2410C] flex items-center justify-center font-bold text-base">
                            👥
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-[#C2410C]">
                              Provision Personnel
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Register & assign site managers
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('farms')}
                        className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 text-left transition group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                            🚜
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-800">
                              Farm Facilities
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Geofencing & location management
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('sections')}
                        className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 text-left transition group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-base">
                            🏠
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-blue-800">
                              Containment Sections
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Pen capacities & biosecurity
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('batches')}
                        className="p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 text-left transition group cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-base">
                            🐣
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-purple-800">
                              Flock Batches
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Biological stock & placement
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('daily-logs')}
                        className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 text-left transition group cursor-pointer sm:col-span-2"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
                            📝
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-amber-800">
                              Daily Logs & Telemetry
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Rapid daily feed, medicine, weight & casualty auditing
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: System & Security Status */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h4 className="text-base font-bold text-slate-900">Session Security</h4>
                      <p className="text-xs text-slate-400 font-mono">JWT Bearer Token Validated</p>
                    </div>

                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Authenticated Email</span>
                        <span className="font-bold text-slate-900">{authData.email}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Role Clearance</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {authData.role}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Tenant Organisation ID</span>
                        <span className="font-bold text-slate-900">#{authData.organisationId}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <ManagerDashboardView authData={authData} setActiveTab={setActiveTab} />
            )
          )}

          {activeTab === 'managers' && isProprietor && authData.organisationId && (
            <div className="max-w-7xl mx-auto">
              <ManagerManagementView
                organisationId={authData.organisationId}
                proprietorId={authData.userId ?? 6}
              />
            </div>
          )}

          {activeTab === 'farms' && authData.organisationId && (
            <div className="max-w-7xl mx-auto">
              <FarmManagementView
                organisationId={authData.organisationId}
                proprietorId={authData.userId ?? 6}
                userRole={authData.role}
                currentUserId={authData.userId}
              />
            </div>
          )}

          {activeTab === 'sections' && authData.organisationId && (
            <div className="max-w-7xl mx-auto">
              <GlobalSectionsView
                organisationId={authData.organisationId}
                userRole={authData.role}
                currentUserId={authData.userId}
              />
            </div>
          )}

          {activeTab === 'batches' && authData.organisationId && (
            <div className="max-w-7xl mx-auto">
              <BatchManagementView
                organisationId={authData.organisationId}
                userRole={authData.role}
                currentUserId={authData.userId}
              />
            </div>
          )}

          {activeTab === 'daily-logs' && authData.organisationId && (
            <div className="max-w-7xl mx-auto">
              <DailyLogsHubView
                organisationId={authData.organisationId}
                userRole={authData.role}
                currentUserId={authData.userId}
              />
            </div>
          )}

          {activeTab === 'inventory' && authData.organisationId && (
            <div className="max-w-7xl mx-auto">
              <InventoryManagementView
                organisationId={authData.organisationId}
                userRole={authData.role}
                currentUserId={authData.userId}
              />
            </div>
          )}

          {activeTab === 'financials' && authData.organisationId && (
            <div className="max-w-7xl mx-auto">
              <FinancialWorkspaceView
                organisationId={authData.organisationId}
                userRole={authData.role}
                currentUserId={authData.userId}
              />
            </div>
          )}

          {activeTab === 'analytics' && authData.organisationId && (
            <div className="max-w-7xl mx-auto">
              <AnalyticsCommandHubView
                organisationId={authData.organisationId}
                userRole={authData.role}
                currentUserId={authData.userId}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;