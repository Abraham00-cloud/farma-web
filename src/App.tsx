import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { LandingPage } from './features/landing/LandingPage';
import { AuthScreen } from './features/auth/AuthScreen';
import { ResetPasswordScreen } from './features/auth/ResetPasswordScreen';
import { Sidebar } from './components/layout/Sidebar';
import { HeaderBar } from './components/layout/HeaderBar';
import { authService } from './services/authService';
import type { AuthResponseDto } from './types/auth';

// Legal & Company Pages
import { PrivacyPolicy } from './features/legal/PrivacyPolicy';
import { TermsOfService } from './features/legal/TermsOfService';
import { AboutUs } from './features/company/AboutUs'; 
import { ContactUs } from './features/company/ContactUs';

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

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<ContactUs />} />
      
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
              <Sidebar
                userRole={authData.role}
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
              />

              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#ECE6D6]">
                <HeaderBar
                  authData={authData}
                  onMenuToggle={() => setIsSidebarOpen(true)}
                />

                <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-8">
                  <Routes>
                    {/* Dashboard Route */}
                    <Route
                      path="dashboard"
                      element={
                        <div className="max-w-7xl mx-auto w-full">
                          <ManagerDashboardView authData={authData} setActiveTab={() => { }} />
                        </div>
                      }
                    />

                    {isProprietor && authData.organisationId && (
                      <Route
                        path="managers/*"
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
                          path="farms/*"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <FarmManagementView organisationId={authData.organisationId} proprietorId={authData.userId ?? 6} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="sections/*"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <GlobalSectionsView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="batches/*"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <BatchManagementView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="daily-logs/*"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <DailyLogsHubView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="inventory/*"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <InventoryManagementView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="financials/*"
                          element={
                            <div className="max-w-7xl mx-auto">
                              <FinancialWorkspaceView organisationId={authData.organisationId} userRole={authData.role} currentUserId={authData.userId} />
                            </div>
                          }
                        />
                        <Route
                          path="analytics/*"
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