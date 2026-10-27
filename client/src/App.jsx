import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import DashboardView from './views/DashboardView';
import EmployeesView from './views/EmployeesView';
import AttendanceView from './views/AttendanceView';
import LeaveView from './views/LeaveView';
import TrainingView from './views/TrainingView';
import AnnouncementsView from './views/AnnouncementsView';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  GraduationCap,
  Bell,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

const AppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'attendance', label: 'Attendance Punch', icon: Clock },
    { id: 'leaves', label: 'Leave Management', icon: CalendarDays },
    { id: 'training', label: 'Training & Upskilling', icon: GraduationCap },
    { id: 'announcements', label: 'Notice Board', icon: Bell },
  ];

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-grow text-primary mb-3" style={{ width: 48, height: 48 }} role="status"></div>
          <h5 className="fw-bold text-dark mb-1">Loading StaffSync Enterprise HRMS...</h5>
          <p className="text-muted small">Synchronizing workspace authentication and permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* Top Navbar & Demo Persona Switcher */}
      <Navbar
        onOpenAuth={() => setShowAuthModal(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Subnav Navigation Tabs (when authenticated) */}
      {isAuthenticated && (
        <div className="bg-white border-bottom shadow-xs py-1 sticky-top" style={{ top: 57, zIndex: 1020 }}>
          <div className="container-fluid px-3 px-lg-4">
            <div className="d-flex align-items-center gap-1 overflow-x-auto py-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-nowrap fw-semibold ${
                      isActive
                        ? 'btn-primary text-white shadow-sm'
                        : 'btn-light text-secondary border-0 hover-bg'
                    }`}
                    style={
                      isActive
                        ? { background: 'var(--primary-gradient)', border: 'none' }
                        : { backgroundColor: 'transparent' }
                    }
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-grow-1">
        {!isAuthenticated ? (
          /* Unauthenticated Landing / Welcome Gate */
          <div className="container py-5 my-auto">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center py-5">
                <div
                  className="mx-auto rounded-4 p-3 text-white mb-4 shadow-lg d-inline-flex align-items-center justify-content-center"
                  style={{
                    width: 72,
                    height: 72,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  }}
                >
                  <ShieldCheck size={42} />
                </div>
                <h1 className="display-5 fw-extrabold text-dark mb-3">
                  Welcome to StaffSync
                </h1>
                <p className="lead text-muted mb-4 px-md-5">
                  Modern Human Resource Management System with Role-Based Access Control, Real-Time Shift Tracking, Leave Workflow Approvals, and Curated Training Modules.
                </p>

                <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg px-4 py-3 fw-bold rounded-3 shadow d-flex align-items-center gap-2"
                    style={{ background: 'var(--primary-gradient)', border: 'none' }}
                    onClick={() => setShowAuthModal(true)}
                  >
                    <Sparkles size={20} /> Open Portal / Demo Login <ArrowRight size={20} />
                  </button>
                </div>

                {/* 3 Quick Role Feature Cards */}
                <div className="row g-3 text-start">
                  <div className="col-md-4">
                    <div className="card card-premium p-4 h-100">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge badge-role-hr">HR Administrator</span>
                      </div>
                      <h6 className="fw-bold text-dark">Administrative Control</h6>
                      <p className="text-muted small mb-0">
                        Oversee company employees, review all attendance logs, approve leaves, and broadcast company bulletins.
                      </p>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="card card-premium p-4 h-100">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge badge-role-manager">Team Manager</span>
                      </div>
                      <h6 className="fw-bold text-dark">Team-Level Oversight</h6>
                      <p className="text-muted small mb-0">
                        Review direct reports' leave requests with instant approvals, assign upskilling modules, and audit team attendance.
                      </p>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="card card-premium p-4 h-100">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge badge-role-employee">Employee Portal</span>
                      </div>
                      <h6 className="fw-bold text-dark">Self-Service Portal</h6>
                      <p className="text-muted small mb-0">
                        Punch in/out with live shift duration timer, track leave balances, complete training tracks, and check notice boards.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Render Active View */
          <>
            {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
            {activeTab === 'employees' && <EmployeesView />}
            {activeTab === 'attendance' && <AttendanceView />}
            {activeTab === 'leaves' && <LeaveView />}
            {activeTab === 'training' && <TrainingView />}
            {activeTab === 'announcements' && <AnnouncementsView />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-top py-3 mt-auto">
        <div className="container-fluid px-4 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 text-muted small">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold text-dark">StaffSync</span> • Modern Human Resource Management System
          </div>
          <div>MERN Stack Architecture • Production Ready</div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal show={showAuthModal} onHide={() => setShowAuthModal(false)} />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
