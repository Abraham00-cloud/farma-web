import { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { LandingPage } from './features/landing/LandingPage';
import { AuthScreen } from './features/auth/AuthScreen';
import { Sidebar } from './components/layout/Sidebar';
import { HeaderBar } from './components/layout/HeaderBar';
import { authService } from './services/authService';
import type { AuthResponseDto } from './types/auth';

// Views
import { ManagerManagementView } from './features/users/ManagerManagementView';
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

  const handleLogout = () => {
    authService.logout();
    setAuthData(null);
  };

  if (!authData) {
    return (
      <Routes>
        <Route
          path="/"
          element={<LandingPageWrapper />}
        />
        {/* Proprietor Portal: Passes PROPRIETOR flag to show registration tabs */}
        <Route
          path="/auth/proprietor"
          element={<AuthScreen onAuthSuccess={setAuthData} portalType="PROPRIETOR" />}
        />
        {/* Site Manager Portal: Passes MANAGER flag to hide registration and show only login */}
        <Route
          path="/auth/manager"
          element={<AuthScreen onAuthSuccess={setAuthData} portalType="MANAGER" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const isProprietor = authData.role?.toUpperCase() === 'PROPRIETOR' || authData.role?.toUpperCase() === 'ADMIN';

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      <Sidebar userRole={authData.role} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <HeaderBar authData={authData} />

        <main className="p-6 sm:p-8 flex-1 space-y-8">
          <Routes>
            {/* Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                isProprietor ? (
                  <div className="space-y-6 max-w-7xl mx-auto">
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
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Active Facilities</span>
                          <span className="text-lg">🚜</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-3xl font-extrabold text-slate-900 font-mono">1</span>
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">100% Operational</span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Containment Pens</span>
                          <span className="text-lg">🏠</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-3xl font-extrabold text-slate-900 font-mono">1</span>
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">1 Active Pen</span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Live Population</span>
                          <span className="text-lg">🐣</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-3xl font-extrabold text-slate-900 font-mono">2,500</span>
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">0.0% Mortality</span>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Assigned Personnel</span>
                          <span className="text-lg">👥</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                          <span className="text-3xl font-extrabold text-slate-900 font-mono">1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ManagerDashboardView authData={authData} setActiveTab={() => { }} />
                )
              }
            />

            {/* Sub-Module Routes */}
            {isProprietor && authData.organisationId && (
              <Route
                path="/managers"
                element={
                  <div className="max-w-7xl mx-auto">
                    <ManagerManagementView organisationId={authData.organisationId} proprietorId={authData.userId ?? 6} />
                  </div>
                }
              />
            )}

            {authData.organisationId && (
              <>
                <Route
                  path="/farms"
                  element={
                    <div className="max-w-7xl mx-auto">
                      <FarmManagementView organisationId={authData.organisationId} proprietorId={authData.userId ?? 6} userRole={authData.role} currentUserId={authData.userId} />
                    </div>
                  }
                />
                <Route
                  path="/sections"
                  element={
                    <div className="max-w-7xl mx-auto">
                      <GlobalSectionsView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                    </div>
                  }
                />
                <Route
                  path="/batches"
                  element={
                    <div className="max-w-7xl mx-auto">
                      <BatchManagementView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                    </div>
                  }
                />
                <Route
                  path="/daily-logs"
                  element={
                    <div className="max-w-7xl mx-auto">
                      <DailyLogsHubView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                    </div>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <div className="max-w-7xl mx-auto">
                      <InventoryManagementView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                    </div>
                  }
                />
                <Route
                  path="/financials"
                  element={
                    <div className="max-w-7xl mx-auto">
                      <FinancialWorkspaceView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                    </div>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <div className="max-w-7xl mx-auto">
                      <AnalyticsCommandHubView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                    </div>
                  }
                />
              </>
            )}

            {/* Default Redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LandingPageWrapper() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onProprietorClick={() => navigate('/auth/proprietor')}
      onManagerClick={() => navigate('/auth/manager')}
    />
  );
}

export default App;