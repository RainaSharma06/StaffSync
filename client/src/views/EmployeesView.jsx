import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ToastAlert from '../components/ToastAlert';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Briefcase,
  Building,
  Mail,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Key,
} from 'lucide-react';

const EmployeesView = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add Employee Form State
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee',
    department: 'Engineering',
    designation: '',
    managerId: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedDept !== 'All') params.department = selectedDept;
      if (selectedRole !== 'All') params.role = selectedRole;

      const res = await axiosClient.get('/employees', { params });
      if (res.success) {
        setEmployees(res.employees || []);
        if (res.managers) setManagers(res.managers);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load employees' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDept, selectedRole]);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleInputChange = (e) => {
    setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await axiosClient.post('/employees', newEmployee);
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Employee "${res.employee?.name}" registered successfully! Initial credentials set.`,
        });
        setShowAddModal(false);
        setNewEmployee({
          name: '',
          email: '',
          password: '',
          role: 'Employee',
          department: 'Engineering',
          designation: '',
          managerId: '',
        });
        fetchEmployees();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error registering employee' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'HR':
        return <span className="badge badge-role-hr">HR Admin</span>;
      case 'Manager':
        return <span className="badge badge-role-manager">Manager</span>;
      case 'Employee':
      default:
        return <span className="badge badge-role-employee">Employee</span>;
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      {/* Header & Controls */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Users className="text-primary" size={28} /> Employee Directory
          </h3>
          <p className="text-muted small mb-0">
            Search, filter, and manage staff members across all enterprise business units.
          </p>
        </div>

        {isHR ? (
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-3 shadow-sm"
            style={{ background: 'var(--primary-gradient)', border: 'none' }}
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={18} /> Add New Employee
          </button>
        ) : (
          <div className="badge bg-light text-muted border px-3 py-2">
            <Shield size={14} className="me-1" /> Directory View Mode
          </div>
        )}
      </div>

      <ToastAlert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Filter / Search Bar */}
      <div className="card card-premium mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            {/* Search Input */}
            <div className="col-lg-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search staff by name, email, or designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="col-sm-6 col-lg-3">
              <select
                className="form-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Finance & Legal">Finance & Legal</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="col-sm-6 col-lg-3">
              <select
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="HR">HR Admin</option>
                <option value="Manager">Team Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card card-premium overflow-hidden">
        <div className="table-responsive">
          <table className="table table-custom mb-0">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Reporting Manager</th>
                <th>Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                    Loading employee directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    <Users size={36} className="mb-2 opacity-50" />
                    <p className="mb-0">No employees match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                          style={{
                            width: 38,
                            height: 38,
                            background:
                              emp.role === 'HR'
                                ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                                : emp.role === 'Manager'
                                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                                : 'linear-gradient(135deg, #10b981, #047857)',
                            fontSize: '0.9rem',
                          }}
                        >
                          {emp.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{emp.name}</div>
                          <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(emp.role)}</td>
                    <td>
                      <span className="badge bg-light text-dark border px-2 py-1">
                        {emp.department}
                      </span>
                    </td>
                    <td className="text-secondary fw-medium">{emp.designation}</td>
                    <td>
                      {emp.managerId ? (
                        <div className="small">
                          <span className="fw-medium text-dark">{emp.managerId.name}</span>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {emp.managerId.designation || 'Manager'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted small italic">— Direct to Board</span>
                      )}
                    </td>
                    <td className="text-muted small">
                      {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer bg-transparent border-top py-3 px-4 d-flex align-items-center justify-content-between text-muted small">
          <span>Showing <strong>{employees.length}</strong> personnel</span>
          <span>StaffSync Enterprise HRMS</span>
        </div>
      </div>

      {/* Add Employee Modal (HR Only) */}
      {showAddModal && isHR && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-3 bg-primary text-white">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Register New Team Member</h5>
                    <small className="text-muted">HR Administrative Onboarding Control</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateEmployee}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Full Legal Name *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <UserIcon size={16} className="text-muted" />
                        </span>
                        <input
                          type="text"
                          name="name"
                          required
                          className="form-control border-start-0"
                          placeholder="e.g. Liam Gallagher"
                          value={newEmployee.name}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Work Email Address *</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Mail size={16} className="text-muted" />
                        </span>
                        <input
                          type="email"
                          name="email"
                          required
                          className="form-control border-start-0"
                          placeholder="liam@staffsync.com"
                          value={newEmployee.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Initial Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <Key size={16} className="text-muted" />
                        </span>
                        <input
                          type="password"
                          name="password"
                          className="form-control border-start-0"
                          placeholder="Default: StaffSync@2025"
                          value={newEmployee.password}
                          onChange={handleInputChange}
                        />
                      </div>
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Leave blank to assign default password 'StaffSync@2025'
                      </small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Enterprise Role *</label>
                      <select
                        name="role"
                        className="form-select"
                        value={newEmployee.role}
                        onChange={handleInputChange}
                      >
                        <option value="Employee">Employee (Self-Service)</option>
                        <option value="Manager">Manager (Team Oversight)</option>
                        <option value="HR">HR Administrator</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Department *</label>
                      <select
                        name="department"
                        className="form-select"
                        value={newEmployee.department}
                        onChange={handleInputChange}
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Sales & Marketing">Sales & Marketing</option>
                        <option value="Finance & Legal">Finance & Legal</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Designation / Title *</label>
                      <input
                        type="text"
                        name="designation"
                        required
                        className="form-control"
                        placeholder="e.g. Senior Backend Architect"
                        value={newEmployee.designation}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold">Reporting Manager</label>
                      <select
                        name="managerId"
                        className="form-select"
                        value={newEmployee.managerId}
                        onChange={handleInputChange}
                      >
                        <option value="">None (Reports directly to Executive Board)</option>
                        {managers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.designation} • {m.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4 bg-light-subtle">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-semibold"
                    style={{ background: 'var(--primary-gradient)', border: 'none' }}
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Registering...
                      </>
                    ) : (
                      'Save & Onboard Employee'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesView;
