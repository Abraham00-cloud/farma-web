import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { LandingPage } from './features/landing/LandingPage';
import { AuthScreen } from './features/auth/AuthScreen';
import { ResetPasswordScreen } from './features/auth/ResetPasswordScreen';
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

  const isProprietor = authData?.role?.toUpperCase() === 'PROPRIETOR' || authData?.role?.toUpperCase() === 'ADMIN';
  const portalNamespace = isProprietor ? 'proprietor' : 'manager';

  return (
    <Routes>
      {/* ================= PUBLIC & AUTH GATEWAY ROUTES ================= */}
      <Route path="/" element={<LandingPageWrapper />} />
      <Route
        path="/auth/proprietor"
        element={<AuthScreen onAuthSuccess={setAuthData} portalType="PROPRIETOR" />}
      />
      <Route
        path="/auth/manager"
        element={<AuthScreen onAuthSuccess={setAuthData} portalType="MANAGER" />}
      />
      <Route
        path="/auth/reset-password"
        element={<ResetPasswordScreen />}
      />

      {/* ================= PROTECTED PORTAL LAYOUT & NAMESPACED SUB-ROUTES ================= */}
      {authData ? (
        <Route
          path={`/${portalNamespace}/*`}
          element={
            <div className="flex h-screen bg-[#ECE6D6] text-[#161F17] font-sans overflow-hidden">
              <Sidebar userRole={authData.role} onLogout={handleLogout} />

              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#ECE6D6]">
                <HeaderBar authData={authData} />

                <main className="p-6 sm:p-8 flex-1 space-y-8">
                  <Routes>
                    {/* Dashboard Route */}
                    <Route
                      path="dashboard"
                      element={
                        isProprietor ? (
                          <div className="space-y-6 max-w-7xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#101B14]/10 pb-5">
                              <div>
                                <h3 className="text-2xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                                  Proprietor Executive Dashboard
                                </h3>
                                <p className="text-xs text-[#101B14]/70 font-medium mt-1">
                                  Real-time operational overview, livestock population metrics, and facility telemetry.
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#3F6B47] animate-pulse" />
                                <span className="text-xs font-mono font-bold text-[#3F6B47] uppercase tracking-wider bg-[#3F6B47]/10 border border-[#3F6B47]/20 px-3 py-1 rounded-[3px]">
                                  System Normal
                                </span>
                              </div>
                            </div>

                            {/* KPI Metrics Grid with Mature Monochromatic SVG Icons */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                              {/* Card 1 */}
                              <div className="bg-[#F5F1E6] p-5 rounded-[4px] border border-[#101B14]/15 shadow-xs transition hover:border-[#3F6B47]/40">
                                <div className="flex items-center justify-between text-[#101B14]/60">
                                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#101B14]/70">Active Facilities</span>
                                  <svg className="w-5 h-5 text-[#3F6B47]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div className="mt-3 flex items-baseline justify-between">
                                  <span className="text-3xl font-extrabold text-[#101B14] font-mono">1</span>
                                  <span className="text-[11px] font-bold text-[#3F6B47] bg-[#3F6B47]/10 px-2 py-0.5 rounded-[2px]">100% Operational</span>
                                </div>
                              </div>

                              {/* Card 2 */}
                              <div className="bg-[#F5F1E6] p-5 rounded-[4px] border border-[#101B14]/15 shadow-xs transition hover:border-[#3A5B6B]/40">
                                <div className="flex items-center justify-between text-[#101B14]/60">
                                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#101B14]/70">Containment Pens</span>
                                  <svg className="w-5 h-5 text-[#3A5B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                  </svg>
                                </div>
                                <div className="mt-3 flex items-baseline justify-between">
                                  <span className="text-3xl font-extrabold text-[#101B14] font-mono">1</span>
                                  <span className="text-[11px] font-bold text-[#3A5B6B] bg-[#3A5B6B]/10 px-2 py-0.5 rounded-[2px]">1 Active Pen</span>
                                </div>
                              </div>

                              {/* Card 3 */}
                              <div className="bg-[#F5F1E6] p-5 rounded-[4px] border border-[#101B14]/15 shadow-xs transition hover:border-[#D9A63E]/40">
                                <div className="flex items-center justify-between text-[#101B14]/60">
                                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#101B14]/70">Live Population</span>
                                  <svg className="w-5 h-5 text-[#D9A63E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                                <div className="mt-3 flex items-baseline justify-between">
                                  <span className="text-3xl font-extrabold text-[#101B14] font-mono">2,500</span>
                                  <span className="text-[11px] font-bold text-[#3F6B47] bg-[#3F6B47]/10 px-2 py-0.5 rounded-[2px]">0.0% Mortality</span>
                                </div>
                              </div>

                              {/* Card 4 */}
                              <div className="bg-[#F5F1E6] p-5 rounded-[4px] border border-[#101B14]/15 shadow-xs transition hover:border-[#101B14]/40">
                                <div className="flex items-center justify-between text-[#101B14]/60">
                                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#101B14]/70">Assigned Personnel</span>
                                  <svg className="w-5 h-5 text-[#101B14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                  </svg>
                                </div>
                                <div className="mt-3 flex items-baseline justify-between">
                                  <span className="text-3xl font-extrabold text-[#101B14] font-mono">1</span>
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
                        path="managers"
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
                          path="farms"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <FarmManagementView organisationId={authData.organisationId} proprietorId={authData.userId ?? 6} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="sections"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <GlobalSectionsView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="batches"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <BatchManagementView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="daily-logs"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <DailyLogsHubView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="inventory"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <InventoryManagementView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="financials"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <FinancialWorkspaceView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="analytics"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <AnalyticsCommandHubView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                      </>
                    )}

                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />
      ) : (
        <Route path="/proprietor/*" element={<Navigate to="/auth/proprietor" replace />} />
      )}

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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