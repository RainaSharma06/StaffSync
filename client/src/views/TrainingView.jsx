import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ToastAlert from '../components/ToastAlert';
import {
  GraduationCap,
  Plus,
  CheckCircle2,
  Circle,
  Users,
  Building,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';

const TrainingView = () => {
  const { user } = useAuth();
  const isManagerOrHR = user?.role === 'Manager' || user?.role === 'HR';

  const [trainings, setTrainings] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Assign Form State
  const [newTraining, setNewTraining] = useState({
    title: '',
    description: '',
    department: 'Engineering',
    assignedTo: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/training');
      if (res.success) {
        setTrainings(res.trainings || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error fetching training modules' });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!isManagerOrHR) return;
    try {
      const res = await axiosClient.get('/employees');
      if (res.success) {
        setEmployeesList(res.employees || []);
      }
    } catch (err) {
      console.warn('Could not fetch employees for assignment:', err.message);
    }
  };

  useEffect(() => {
    fetchTrainings();
    fetchEmployees();
  }, [user]);

  const handleToggleComplete = async (trainingId) => {
    try {
      const res = await axiosClient.patch(`/training/${trainingId}/toggle`, {
        userId: user._id,
      });
      if (res.success) {
        setAlert({ type: 'success', message: 'Training completion status updated!' });
        fetchTrainings();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error updating status' });
    }
  };

  const handleAssignTraining = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await axiosClient.post('/training', newTraining);
      if (res.success) {
        setAlert({ type: 'success', message: 'Training module created and assigned to staff successfully!' });
        setShowAssignModal(false);
        setNewTraining({
          title: '',
          description: '',
          department: 'Engineering',
          assignedTo: [],
        });
        fetchTrainings();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error creating module' });
    } finally {
      setSubmitting(false);
    }
  };

  const isUserCompleted = (training) => {
    const prog = training.progress?.find((p) => String(p.userId?._id || p.userId) === String(user?._id));
    return prog?.completed || false;
  };

  const getCompletionPercentage = (training) => {
    if (!training.progress || training.progress.length === 0) return 0;
    const completedCount = training.progress.filter((p) => p.completed).length;
    return Math.round((completedCount / training.progress.length) * 100);
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <GraduationCap className="text-primary" size={28} /> Training & Upskilling
          </h3>
          <p className="text-muted small mb-0">
            Professional skill certification tracks, compliance modules, and team progress oversight.
          </p>
        </div>

        {isManagerOrHR && (
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-3 shadow-sm"
            style={{ background: 'var(--primary-gradient)', border: 'none' }}
            onClick={() => setShowAssignModal(true)}
          >
            <Plus size={18} /> Assign New Training Module
          </button>
        )}
      </div>

      <ToastAlert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Modules List */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          Loading curriculum...
        </div>
      ) : trainings.length === 0 ? (
        <div className="card card-premium p-5 text-center text-muted">
          <BookOpen size={48} className="mx-auto mb-3 opacity-50 text-primary" />
          <h5 className="fw-bold text-dark">No Training Modules Assigned Yet</h5>
          <p className="small mb-0">Check back later or contact your team manager for upskilling opportunities.</p>
        </div>
      ) : (
        <div className="row g-4">
          {trainings.map((prog) => {
            const completed = isUserCompleted(prog);
            const percent = getCompletionPercentage(prog);

            return (
              <div key={prog._id} className="col-lg-6">
                <div className="card card-premium h-100 p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                        {prog.department === 'All' ? 'Company-wide' : `${prog.department} Dept`}
                      </span>
                      {completed ? (
                        <span className="badge-pill-soft badge-soft-success d-flex align-items-center gap-1">
                          <Award size={14} /> Completed by You
                        </span>
                      ) : (
                        <span className="badge-pill-soft badge-soft-warning">In Progress</span>
                      )}
                    </div>

                    <h5 className="fw-bold text-dark mb-2">{prog.title}</h5>
                    <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                      {prog.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Cohort Completion Rate</span>
                        <span className="fw-bold text-dark">{percent}%</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{ width: `${percent}%` }}
                          aria-valuenow={percent}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>

                    {/* Assigned Personnel Info */}
                    <div className="d-flex align-items-center gap-2 small text-muted mb-3">
                      <Users size={16} />
                      <span>{prog.assignedTo?.length || 0} participants enrolled</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                    <button
                      type="button"
                      className={`btn btn-sm d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 ${
                        completed ? 'btn-outline-secondary' : 'btn-success'
                      }`}
                      onClick={() => handleToggleComplete(prog._id)}
                    >
                      {completed ? (
                        <>
                          <CheckCircle2 size={16} className="text-success" /> Mark as Incomplete
                        </>
                      ) : (
                        <>
                          <Circle size={16} /> Mark as Finished
                        </>
                      )}
                    </button>

                    {completed && (
                      <span className="small text-success fw-medium">
                        ✓ Milestone recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Training Modal (Manager / HR Only) */}
      {showAssignModal && isManagerOrHR && (
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
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Create & Assign Training Track</h5>
                    <small className="text-muted">Empower direct reports with skill development modules</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAssignModal(false)}
                ></button>
              </div>

              <form onSubmit={handleAssignTraining}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Course / Curriculum Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="form-control"
                      placeholder="e.g. Distributed Cloud Architecture & Security"
                      value={newTraining.title}
                      onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Course Description & Objectives *</label>
                    <textarea
                      name="description"
                      rows="3"
                      required
                      className="form-control"
                      placeholder="Outline the core topics, materials, and learning goals for the enrolled staff..."
                      value={newTraining.description}
                      onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Target Department *</label>
                      <select
                        name="department"
                        className="form-select"
                        value={newTraining.department}
                        onChange={(e) => setNewTraining({ ...newTraining, department: e.target.value })}
                      >
                        <option value="All">All Departments (Enterprise-wide)</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Sales & Marketing">Sales & Marketing</option>
                        <option value="Finance & Legal">Finance & Legal</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Enrolled Cohort</label>
                      <select
                        multiple
                        className="form-select"
                        style={{ height: 110 }}
                        value={newTraining.assignedTo}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                          setNewTraining({ ...newTraining, assignedTo: selected });
                        }}
                      >
                        {employeesList.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.department} • {emp.designation})
                          </option>
                        ))}
                      </select>
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Hold Ctrl/Cmd to select multiple specific employees (leave unselected to assign all in dept).
                      </small>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4 bg-light-subtle">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-semibold"
                    style={{ background: 'var(--primary-gradient)', border: 'none' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Publishing...' : 'Assign Training Track'}
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

export default TrainingView;
