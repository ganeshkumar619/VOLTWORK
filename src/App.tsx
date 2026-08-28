import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth.tsx';
import { I18nProvider, useI18n } from './lib/i18n.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ElectricBg } from './components/ElectricBg.tsx';
import { ShieldCheck, Shield, User, Wrench, AlertCircle } from 'lucide-react';
import { RoleSelectModal } from './components/RoleSelectModal.tsx';
import { ToastProvider } from './components/ToastNotification.tsx';
import { AdminChangePasswordModal } from './components/AdminChangePasswordModal.tsx';

// Public Auth Pages
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { AdminLoginPage } from './pages/auth/AdminLoginPage.tsx';
import { CustomerLoginPage } from './pages/auth/CustomerLoginPage.tsx';
import { WorkerLoginPage } from './pages/auth/WorkerLoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { JobsManagement } from './pages/admin/JobsManagement.tsx';
import { JobDetailAdmin } from './pages/admin/JobDetailAdmin.tsx';
import { WorkerManagement } from './pages/admin/WorkerManagement.tsx';
import { CustomerManagement } from './pages/admin/CustomerManagement.tsx';
import { SalaryManagement } from './pages/admin/SalaryManagement.tsx';
import { AttendanceManagement } from './pages/admin/AttendanceManagement.tsx';
import { PaymentsManagement } from './pages/admin/PaymentsManagement.tsx';
import { AnalyticsPage } from './pages/admin/AnalyticsPage.tsx';
import { CategoriesPage } from './pages/admin/CategoriesPage.tsx';
import { SMSLogsPage } from './pages/admin/SMSLogsPage.tsx';
import { AuditLogsPage } from './pages/admin/AuditLogsPage.tsx';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard.tsx';
import { NewRequestPage } from './pages/customer/NewRequestPage.tsx';
import { JobDetailCustomer } from './pages/customer/JobDetailCustomer.tsx';
import { CustomerHistoryPage } from './pages/customer/CustomerHistoryPage.tsx';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage.tsx';

// Worker Pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard.tsx';
import { JobDetailWorker } from './pages/worker/JobDetailWorker.tsx';
import { WorkerAttendancePage } from './pages/worker/WorkerAttendancePage.tsx';
import { WorkerSalaryPage } from './pages/worker/WorkerSalaryPage.tsx';
import { WorkerProfilePage } from './pages/worker/WorkerProfilePage.tsx';

const AppContent: React.FC = () => {
  const { user, login, mustChangePassword } = useAuth();
  const { t } = useI18n();

  // Navigation State parsed from initial URL
  const getInitialViewFromPath = (): string => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!path) return 'landing';
    if (path === 'admin/login') return 'admin_login';
    if (path === 'customer/login') return 'customer_login';
    if (path === 'worker/login') return 'worker_login';
    if (path === 'login') return 'login';
    if (path === 'register' || path === 'customer/register') return 'register';
    if (path === 'admin' || path.startsWith('admin/')) return 'admin';
    if (path === 'customer' || path.startsWith('customer/')) return 'customer';
    if (path === 'worker' || path.startsWith('worker/')) return 'worker';
    return 'landing';
  };

  const [currentView, setCurrentView] = useState<string>(getInitialViewFromPath());
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  // Sync browser path with state
  const navigateTo = (view: string, tab?: string, pushState = true) => {
    setCurrentView(view);
    if (tab) setActiveTab(tab);
    setSelectedJobId(null);

    if (pushState && typeof window !== 'undefined') {
      let targetPath = '/';
      if (view === 'landing') targetPath = '/';
      else if (view === 'admin_login') targetPath = '/admin/login';
      else if (view === 'customer_login') targetPath = '/customer/login';
      else if (view === 'worker_login') targetPath = '/worker/login';
      else if (view === 'login') targetPath = '/login';
      else if (view === 'register') targetPath = '/customer/register';
      else if (view === 'admin') targetPath = `/admin/${tab || 'dashboard'}`;
      else if (view === 'customer') targetPath = `/customer/${tab || 'dashboard'}`;
      else if (view === 'worker') targetPath = `/worker/${tab || 'dashboard'}`;

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view, tab }, '', targetPath);
      }
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const view = getInitialViewFromPath();
      setCurrentView(view);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-route and protect views based on role upon authentication
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        if (currentView !== 'admin') {
          navigateTo('admin', 'overview');
        }
      } else if (user.role === 'customer') {
        if (currentView !== 'customer') {
          navigateTo('customer', 'my_jobs');
        }
      } else if (user.role === 'worker') {
        if (currentView !== 'worker') {
          navigateTo('worker', 'dashboard');
        }
      }
    } else {
      // Unauthenticated: if user is on authenticated route, redirect to role login
      if (currentView === 'admin') {
        navigateTo('admin_login', undefined, false);
      } else if (currentView === 'customer') {
        navigateTo('customer_login', undefined, false);
      } else if (currentView === 'worker') {
        navigateTo('worker_login', undefined, false);
      }
    }
  }, [user]);

  // Handle role-specific login completion with automatic redirect
  const handleLoginSuccess = (role: string) => {
    if (role === 'admin') {
      navigateTo('admin', 'overview');
    } else if (role === 'customer') {
      navigateTo('customer', 'my_jobs');
    } else if (role === 'worker') {
      navigateTo('worker', 'dashboard');
    }
  };

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const handleBackFromJob = () => {
    setSelectedJobId(null);
  };

  const handleTabSelection = (tab: string) => {
    setSelectedJobId(null);
    if (!user) {
      if (tab === 'login' || tab === 'roles' || tab === 'access') {
        setRoleModalOpen(true);
      } else if (tab === 'register') {
        navigateTo('register');
      } else if (tab === 'landing' || tab === 'home' || tab === '/') {
        navigateTo('landing');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (tab === 'platform' || tab === 'features') {
        if (currentView !== 'landing') {
          navigateTo('landing');
          setTimeout(() => {
            document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (tab === 'workflow') {
        if (currentView !== 'landing') {
          navigateTo('landing');
          setTimeout(() => {
            document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (tab === 'coverage' || tab === 'pricing') {
        if (currentView !== 'landing') {
          navigateTo('landing');
          setTimeout(() => {
            document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      setActiveTab(tab);
    }
  };

  // Handler for navigation strings from subcomponents
  const handleNavigate = (page: string) => {
    if (page === 'admin/login' || page === 'admin_login') navigateTo('admin_login');
    else if (page === 'customer/login' || page === 'customer_login') navigateTo('customer_login');
    else if (page === 'worker/login' || page === 'worker_login') navigateTo('worker_login');
    else if (page === 'login' || page === 'roles' || page === 'access') setRoleModalOpen(true);
    else if (page === 'register' || page === 'customer/register') navigateTo('register');
    else if (page === 'landing' || page === '/' || page === 'home') navigateTo('landing');
    else if (page === 'platform' || page === 'features') {
      navigateTo('landing');
      setTimeout(() => {
        document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (page === 'workflow') {
      navigateTo('landing');
      setTimeout(() => {
        document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (page === 'coverage') {
      navigateTo('landing');
      setTimeout(() => {
        document.getElementById('coverage')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else navigateTo(page);
  };

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-100 font-sans flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Immersive Cosmic Matrix Ambient Background */}
      <ElectricBg />

      {/* Global Role Selection Modal */}
      <RoleSelectModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        onSelectRole={(role) => {
          setRoleModalOpen(false);
          if (role === 'admin') navigateTo('admin_login');
          else if (role === 'customer') navigateTo('customer_login');
          else if (role === 'worker') navigateTo('worker_login');
        }}
      />

      {/* Mandatory Admin Password Change Modal */}
      <AdminChangePasswordModal
        isOpen={Boolean(user?.role === 'admin' && mustChangePassword)}
        isMandatory={true}
      />

      {/* Main Top Navigation Bar */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={handleTabSelection}
        onOpenMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onSelectJob={handleSelectJob}
      />

      {/* Main Page Layout */}
      <main className="relative z-10 flex-1 flex flex-col">
        {!user ? (
          // Public Authentication Views
          <div className="flex-1">
            {currentView === 'landing' && (
              <LandingPage
                onNavigate={handleNavigate}
              />
            )}

            {/* SEPARATE LOGIN PAGE 1: ADMIN */}
            {currentView === 'admin_login' && (
              <AdminLoginPage
                onNavigate={handleNavigate}
                onLoginSuccess={handleLoginSuccess}
              />
            )}

            {/* SEPARATE LOGIN PAGE 2: CUSTOMER */}
            {currentView === 'customer_login' && (
              <CustomerLoginPage
                onNavigate={handleNavigate}
                onLoginSuccess={handleLoginSuccess}
              />
            )}

            {/* SEPARATE LOGIN PAGE 3: WORKER */}
            {currentView === 'worker_login' && (
              <WorkerLoginPage
                onNavigate={handleNavigate}
                onLoginSuccess={handleLoginSuccess}
              />
            )}

            {/* GENERIC / FALLBACK LOGIN (Role Switcher) */}
            {currentView === 'login' && (
              <LoginPage
                onNavigate={handleNavigate}
                onLoginSuccess={handleLoginSuccess}
              />
            )}

            {/* REGISTRATION PAGE */}
            {currentView === 'register' && (
              <RegisterPage
                onNavigate={handleNavigate}
                onRegisterSuccess={() => {
                  navigateTo('customer', 'my_jobs');
                }}
              />
            )}
          </div>
        ) : (
          // Authenticated Portal Layout (Admin / Customer / Worker)
          <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
            {/* Sidebar */}
            <div className="md:w-64 shrink-0">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setSelectedJobId(null);
                  setActiveTab(tab);
                }}
                isOpenMobile={mobileMenuOpen}
                onCloseMobile={() => setMobileMenuOpen(false)}
              />
            </div>

            {/* Portal Content Workspace */}
            <div className="flex-1 min-w-0">
              {/* ADMIN ROLE PORTAL */}
              {user.role === 'admin' && (
                <div>
                  {selectedJobId ? (
                    <JobDetailAdmin jobId={selectedJobId} onBack={handleBackFromJob} />
                  ) : (
                    <>
                      {(activeTab === 'overview' || activeTab === 'dashboard') && (
                        <AdminDashboard
                          onSelectJob={handleSelectJob}
                          onNavigate={(tab) => setActiveTab(tab)}
                        />
                      )}
                      {activeTab === 'jobs' && <JobsManagement onSelectJob={handleSelectJob} />}
                      {activeTab === 'workers' && <WorkerManagement />}
                      {activeTab === 'customers' && <CustomerManagement />}
                      {activeTab === 'salaries' && <SalaryManagement />}
                      {activeTab === 'attendance' && <AttendanceManagement />}
                      {(activeTab === 'billing' || activeTab === 'payments') && <PaymentsManagement />}
                      {activeTab === 'analytics' && <AnalyticsPage />}
                      {activeTab === 'categories' && <CategoriesPage />}
                      {activeTab === 'sms_logs' && <SMSLogsPage />}
                      {activeTab === 'audit_logs' && <AuditLogsPage />}
                    </>
                  )}
                </div>
              )}

              {/* CUSTOMER ROLE PORTAL */}
              {user.role === 'customer' && (
                <div>
                  {selectedJobId ? (
                    <JobDetailCustomer jobId={selectedJobId} onBack={handleBackFromJob} />
                  ) : (
                    <>
                      {(activeTab === 'my_jobs' || activeTab === 'dashboard') && (
                        <CustomerDashboard
                          onSelectJob={handleSelectJob}
                          onNavigate={(tab) => setActiveTab(tab)}
                        />
                      )}
                      {activeTab === 'new_request' && (
                        <NewRequestPage
                          onSuccess={(newId) => setSelectedJobId(newId)}
                          onCancel={() => setActiveTab('my_jobs')}
                        />
                      )}
                      {activeTab === 'history' && (
                        <CustomerHistoryPage onSelectJob={handleSelectJob} />
                      )}
                      {activeTab === 'profile' && <CustomerProfilePage />}
                      {activeTab === 'categories' && <CategoriesPage />}
                    </>
                  )}
                </div>
              )}

              {/* WORKER ROLE PORTAL */}
              {user.role === 'worker' && (
                <div>
                  {selectedJobId ? (
                    <JobDetailWorker jobId={selectedJobId} onBack={handleBackFromJob} />
                  ) : (
                    <>
                      {(activeTab === 'dashboard' || activeTab === 'jobs') && (
                        <WorkerDashboard
                          onSelectJob={handleSelectJob}
                          onNavigate={(tab) => setActiveTab(tab)}
                        />
                      )}
                      {activeTab === 'attendance' && <WorkerAttendancePage />}
                      {activeTab === 'salary' && <WorkerSalaryPage />}
                      {activeTab === 'profile' && <WorkerProfilePage />}
                      {activeTab === 'categories' && <CategoriesPage />}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Immersive UI Telemetry Footer */}
      <footer className="h-12 border-t border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 text-[10px] text-slate-500 font-medium z-20">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            DATABASE CONNECTED
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            NODE V2.4 SECURE
          </span>
          <span className="hidden md:inline text-slate-600 font-mono">
            BUILD // 2026.08.PROD
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-mono tracking-wider">VOLTWORK OS 3.7</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold uppercase tracking-widest text-[9px]">ENTERPRISE EDITION</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
