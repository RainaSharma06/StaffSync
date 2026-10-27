import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  RotateCw,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

const Navbar = ({ onOpenAuth, activeTab, setActiveTab }) => {
  const { user, logout, switchDemoRole, isAuthenticated } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'HR':
        return <span className="badge badge-role-hr">HR Administrator</span>;
      case 'Manager':
        return <span className="badge badge-role-manager">Team Manager</span>;
      case 'Employee':
      default:
        return <span className="badge badge-role-employee">Employee Portal</span>;
    }
  };

  return (
    <>
      {/* Top Demo Switcher Strip */}
      <div className="demo-bar border-bottom border-dark d-flex flex-wrap align-items-center justify-content-between px-3 py-1">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-warning text-dark px-2 py-0 fw-bold" style={{ fontSize: '0.65rem' }}>
            DEMO RBAC
          </span>
          <span className="text-light opacity-75 small">
            Quick Persona Switcher (instantly test Role-Based Views & Permissions):
          </span>
        </div>
        <div className="d-flex align-items-center gap-1 my-1">
          <button
            type="button"
            className={`btn btn-sm py-0 px-2 fw-semibold ${
              user?.role === 'HR' ? 'btn-light text-primary' : 'btn-outline-light'
            }`}
            style={{ fontSize: '0.75rem' }}
            onClick={() => switchDemoRole('HR')}
          >
            👑 HR Admin (Victoria)
          </button>
          <button
            type="button"
            className={`btn btn-sm py-0 px-2 fw-semibold ${
              user?.role === 'Manager' ? 'btn-light text-info' : 'btn-outline-light'
            }`}
            style={{ fontSize: '0.75rem' }}
            onClick={() => switchDemoRole('Manager')}
          >
            👔 Manager (Marcus)
          </button>
          <button
            type="button"
            className={`btn btn-sm py-0 px-2 fw-semibold ${
              user?.role === 'Employee' ? 'btn-light text-success' : 'btn-outline-light'
            }`}
            style={{ fontSize: '0.75rem' }}
            onClick={() => switchDemoRole('Employee')}
          >
            💻 Employee (Alex)
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top py-2" style={{ background: '#0f172a' }}>
        <div className="container-fluid px-3 px-lg-4">
          {/* Brand */}
          <div className="d-flex align-items-center gap-2 text-decoration-none py-1">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm"
              style={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="h5 fw-bold text-white mb-0 brand-font">StaffSync</span>
                <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 px-1 py-0 small" style={{ fontSize: '0.65rem' }}>
                  v1.0
                </span>
              </div>
              <small className="text-secondary d-none d-sm-block" style={{ fontSize: '0.72rem' }}>
                Modern Enterprise HRMS
              </small>
            </div>
          </div>

          {/* Right User Actions */}
          <div className="d-flex align-items-center gap-3 ms-auto">
            {isAuthenticated && user ? (
              <div className="d-flex align-items-center gap-2">
                <div className="text-end d-none d-md-block">
                  <div className="fw-semibold text-white small lh-1">{user.name}</div>
                  <div className="text-secondary small mt-1" style={{ fontSize: '0.72rem' }}>
                    {user.designation} • {user.department}
                  </div>
                </div>

                <div className="ms-1">{getRoleBadge(user.role)}</div>

                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 ms-2 rounded-2"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut size={15} />
                  <span className="d-none d-sm-inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3 rounded-2 fw-semibold"
                style={{ background: 'var(--primary-gradient)', border: 'none' }}
                onClick={onOpenAuth}
              >
                <LogIn size={16} /> Sign In / Register
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
