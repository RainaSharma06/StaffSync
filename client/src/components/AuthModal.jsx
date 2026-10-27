import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, UserPlus, Key, Mail, Building, Briefcase, User as UserIcon } from 'lucide-react';

const AuthModal = ({ show, onHide }) => {
  const { login, register, switchDemoRole } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Engineering',
    designation: '',
    role: 'Employee',
  });

  if (!show) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
      onHide();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (role) => {
    setError('');
    setLoading(true);
    try {
      await switchDemoRole(role);
      onHide();
    } catch (err) {
      setError(err.message || 'Demo switch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <div
                  className="rounded-3 p-1 text-white d-flex align-items-center justify-content-center"
                  style={{ background: 'var(--primary-gradient)', width: 34, height: 34 }}
                >
                  <ShieldCheck size={20} />
                </div>
                <h5 className="modal-title fw-bold text-dark mb-0">StaffSync Portal</h5>
              </div>
              <p className="text-muted small mb-0">
                {isRegister ? 'Register your account to access StaffSync' : 'Sign in to access your HR & Workspace portal'}
              </p>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={onHide}></button>
          </div>

          {/* Quick Demo Personas */}
          <div className="px-4 pt-3 pb-2">
            <label className="form-label text-muted small fw-semibold text-uppercase letter-spacing-1 mb-2">
              ⚡ Instant 1-Click Demo Login:
            </label>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary flex-grow-1 d-flex flex-column align-items-center py-2"
                onClick={() => handleDemoSelect('HR')}
                disabled={loading}
              >
                <span className="fw-bold">HR Admin</span>
                <span style={{ fontSize: '0.7rem' }} className="text-muted">Victoria V.</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-info flex-grow-1 d-flex flex-column align-items-center py-2"
                onClick={() => handleDemoSelect('Manager')}
                disabled={loading}
              >
                <span className="fw-bold">Manager</span>
                <span style={{ fontSize: '0.7rem' }} className="text-muted">Marcus S.</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-success flex-grow-1 d-flex flex-column align-items-center py-2"
                onClick={() => handleDemoSelect('Employee')}
                disabled={loading}
              >
                <span className="fw-bold">Employee</span>
                <span style={{ fontSize: '0.7rem' }} className="text-muted">Alex R.</span>
              </button>
            </div>
          </div>

          <div className="px-4 py-2 text-center text-muted small position-relative">
            <span className="px-2 bg-white position-relative" style={{ zIndex: 1 }}>
              or enter credentials manually
            </span>
            <hr className="position-absolute w-100 top-50 start-0 m-0 text-muted opacity-25" />
          </div>

          {/* Form */}
          <div className="modal-body px-4 pt-2 pb-4">
            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <>
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Full Name</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <UserIcon size={16} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        name="name"
                        required
                        className="form-control border-start-0"
                        placeholder="e.g. Elena Rostova"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-medium">Department</label>
                      <select
                        name="department"
                        className="form-select"
                        value={formData.department}
                        onChange={handleChange}
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Sales & Marketing">Sales & Marketing</option>
                        <option value="Finance & Legal">Finance & Legal</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium">Designation</label>
                      <input
                        type="text"
                        name="designation"
                        required
                        className="form-control"
                        placeholder="e.g. Frontend Engineer"
                        value={formData.designation}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Role</label>
                    <select
                      name="role"
                      className="form-select"
                      value={formData.role}
                      onChange={handleChange}
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </>
              )}

              <div className="mb-3">
                <label className="form-label small fw-medium">Corporate Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Mail size={16} className="text-muted" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    required
                    className="form-control border-start-0"
                    placeholder="name@staffsync.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-medium">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <Key size={16} className="text-muted" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    required
                    className="form-control border-start-0"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                style={{ background: 'var(--primary-gradient)', border: 'none' }}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : isRegister ? (
                  <>
                    <UserPlus size={18} /> Register Account
                  </>
                ) : (
                  <>
                    <LogIn size={18} /> Sign In
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-3 pt-2 border-top border-light-subtle">
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none text-muted"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
              >
                {isRegister
                  ? 'Already have an enterprise account? Sign in here'
                  : "Don't have an account? Register new employee"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
