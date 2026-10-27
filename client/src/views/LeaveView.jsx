import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ToastAlert from '../components/ToastAlert';
import {
  CalendarDays,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  FileText,
  User,
  MessageSquare,
} from 'lucide-react';

const LeaveView = () => {
  const { user } = useAuth();
  const isApprover = user?.role === 'Manager' || user?.role === 'HR';

  const [activeTab, setActiveTab] = useState(isApprover ? 'approvals' : 'apply'); // 'apply' | 'approvals' | 'history'
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState({
    Casual: { total: 12, used: 0, remaining: 12 },
    Sick: { total: 10, used: 0, remaining: 10 },
    Earned: { total: 15, used: 0, remaining: 15 },
  });

  const [formData, setFormData] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Action review modal
  const [reviewModal, setReviewModal] = useState({
    show: false,
    leaveId: null,
    status: '', // 'Approved' | 'Rejected'
    comments: '',
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/leaves');
      if (res.success) {
        setLeaves(res.leaves || []);
        if (res.balances) setBalances(res.balances);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error fetching leaves' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setAlert({ type: '', message: '' });

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setAlert({ type: 'error', message: 'Start date cannot be after end date' });
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await axiosClient.post('/leaves', formData);
      if (res.success) {
        setAlert({
          type: 'success',
          message: 'Leave application submitted successfully! Awaiting supervisor review.',
        });
        setFormData({
          leaveType: 'Casual',
          startDate: '',
          endDate: '',
          reason: '',
        });
        fetchLeaves();
        setActiveTab('history');
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error submitting leave' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleReviewLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.patch(`/leaves/${reviewModal.leaveId}`, {
        status: reviewModal.status,
        comments: reviewModal.comments,
      });
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Leave request has been ${reviewModal.status.toLowerCase()} successfully.`,
        });
        setReviewModal({ show: false, leaveId: null, status: '', comments: '' });
        fetchLeaves();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="badge-pill-soft badge-soft-success">Approved</span>;
      case 'Rejected':
        return <span className="badge-pill-soft badge-soft-danger">Rejected</span>;
      case 'Pending':
      default:
        return <span className="badge-pill-soft badge-soft-warning">Pending Review</span>;
    }
  };

  // Filter queues
  const pendingApprovals = leaves.filter((l) => l.status === 'Pending' && String(l.userId?._id) !== String(user?._id));
  const myLeavesList = leaves.filter((l) => String(l.userId?._id) === String(user?._id));

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      {/* Title & Navigation */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <CalendarDays className="text-primary" size={28} /> Leave Management
          </h3>
          <p className="text-muted small mb-0">
            Submit leave requests, check entitlement balances, and process workflow approvals.
          </p>
        </div>

        {/* View Switcher */}
        <ul className="nav nav-pills nav-pills-staffsync bg-white p-1 rounded-3 border shadow-sm">
          {isApprover && (
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link position-relative ${activeTab === 'approvals' ? 'active' : ''}`}
                onClick={() => setActiveTab('approvals')}
              >
                <CheckCircle size={16} /> Approval Queue
                {pendingApprovals.length > 0 && (
                  <span className="badge rounded-pill bg-danger ms-1" style={{ fontSize: '0.7rem' }}>
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            </li>
          )}
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === 'apply' ? 'active' : ''}`}
              onClick={() => setActiveTab('apply')}
            >
              <Send size={16} /> Apply for Leave
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FileText size={16} /> My Leave History
            </button>
          </li>
        </ul>
      </div>

      <ToastAlert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Balance Indicator Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card card-premium p-3 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted fw-bold small text-uppercase">Casual Leave (CL)</span>
              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                {balances.Casual?.remaining} Days Remaining
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold mb-0 text-dark">{balances.Casual?.remaining}</h3>
              <span className="text-muted small">/ {balances.Casual?.total} Entitlement</span>
            </div>
            <div className="progress mt-2" style={{ height: 6 }}>
              <div
                className="progress-bar bg-primary"
                style={{
                  width: `${((balances.Casual?.used || 0) / (balances.Casual?.total || 12)) * 100}%`,
                }}
              ></div>
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              Used: {balances.Casual?.used || 0} days
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card card-premium p-3 border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted fw-bold small text-uppercase">Sick Leave (SL)</span>
              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1">
                {balances.Sick?.remaining} Days Remaining
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold mb-0 text-dark">{balances.Sick?.remaining}</h3>
              <span className="text-muted small">/ {balances.Sick?.total} Entitlement</span>
            </div>
            <div className="progress mt-2" style={{ height: 6 }}>
              <div
                className="progress-bar bg-warning"
                style={{
                  width: `${((balances.Sick?.used || 0) / (balances.Sick?.total || 10)) * 100}%`,
                }}
              ></div>
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              Used: {balances.Sick?.used || 0} days
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card card-premium p-3 border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted fw-bold small text-uppercase">Earned / Annual Leave (EL)</span>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                {balances.Earned?.remaining} Days Remaining
              </span>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h3 className="fw-bold mb-0 text-dark">{balances.Earned?.remaining}</h3>
              <span className="text-muted small">/ {balances.Earned?.total} Entitlement</span>
            </div>
            <div className="progress mt-2" style={{ height: 6 }}>
              <div
                className="progress-bar bg-success"
                style={{
                  width: `${((balances.Earned?.used || 0) / (balances.Earned?.total || 15)) * 100}%`,
                }}
              ></div>
            </div>
            <div className="text-muted small mt-1" style={{ fontSize: '0.75rem' }}>
              Used: {balances.Earned?.used || 0} days
            </div>
          </div>
        </div>
      </div>

      {/* Tab: Approval Queue for Managers/HR */}
      {activeTab === 'approvals' && isApprover && (
        <div className="card card-premium overflow-hidden mb-4">
          <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Clock size={18} className="text-warning" />
              <h5 className="fw-bold text-dark mb-0">
                {user.role === 'HR' ? 'Company-wide Leave Approval Queue' : 'Team Leave Requests Awaiting Review'}
              </h5>
            </div>
            <span className="badge bg-warning bg-opacity-25 text-warning border px-3 py-1 fw-bold">
              {pendingApprovals.length} Pending
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <CheckCircle size={36} className="text-success mb-2 opacity-50" />
                      <p className="mb-0 fw-semibold text-dark">All clear! No pending leave requests.</p>
                      <small className="text-muted">New requests from your staff will appear here.</small>
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((req) => (
                    <tr key={req._id}>
                      <td>
                        <div className="fw-bold text-dark">{req.userId?.name}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {req.userId?.designation}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">
                          {req.userId?.department}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1">
                          {req.leaveType}
                        </span>
                      </td>
                      <td>
                        <div className="fw-medium text-dark">
                          {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 220 }} title={req.reason}>
                          {req.reason}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-success d-flex align-items-center gap-1 px-3"
                            onClick={() =>
                              setReviewModal({
                                show: true,
                                leaveId: req._id,
                                status: 'Approved',
                                comments: 'Approved. Enjoy your time off.',
                              })
                            }
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger d-flex align-items-center gap-1 px-3"
                            onClick={() =>
                              setReviewModal({
                                show: true,
                                leaveId: req._id,
                                status: 'Rejected',
                                comments: 'Unable to approve due to critical project milestones.',
                              })
                            }
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Apply for Leave */}
      {activeTab === 'apply' && (
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card card-premium p-4">
              <div className="d-flex align-items-center gap-2 mb-3 pb-3 border-bottom">
                <div className="p-2 rounded-3 bg-primary text-white">
                  <Send size={20} />
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-0">Apply for Time Off</h5>
                  <small className="text-muted">Submit your leave request for supervisor review</small>
                </div>
              </div>

              <form onSubmit={handleApplyLeave}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold">Leave Type *</label>
                    <select
                      name="leaveType"
                      className="form-select"
                      value={formData.leaveType}
                      onChange={handleInputChange}
                    >
                      <option value="Casual">Casual Leave (Personal / Urgent Matters)</option>
                      <option value="Sick">Sick Leave (Medical / Health)</option>
                      <option value="Earned">Earned / Annual Leave (Vacation)</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Start Date *</label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      className="form-control"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">End Date *</label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      className="form-control"
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold">Reason for Absence *</label>
                    <textarea
                      name="reason"
                      rows="3"
                      required
                      className="form-control"
                      placeholder="Please provide details regarding your leave request..."
                      value={formData.reason}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="col-12 text-end pt-2">
                    <button
                      type="submit"
                      className="btn btn-primary px-4 py-2 fw-semibold rounded-3 shadow-sm"
                      style={{ background: 'var(--primary-gradient)', border: 'none' }}
                      disabled={formSubmitting}
                    >
                      {formSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Submitting...
                        </>
                      ) : (
                        'Submit Leave Request'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab: My Leave History */}
      {activeTab === 'history' && (
        <div className="card card-premium overflow-hidden">
          <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
            <h5 className="fw-bold text-dark mb-0">My Leave Applications</h5>
            <span className="badge bg-light text-muted border px-3 py-1">All Recorded</span>
          </div>
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                  <th>Reviewer Comments</th>
                </tr>
              </thead>
              <tbody>
                {myLeavesList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No leave applications submitted yet.
                    </td>
                  </tr>
                ) : (
                  myLeavesList.map((l) => (
                    <tr key={l._id}>
                      <td className="fw-semibold text-dark">{l.leaveType} Leave</td>
                      <td>{new Date(l.startDate).toLocaleDateString()}</td>
                      <td>{new Date(l.endDate).toLocaleDateString()}</td>
                      <td style={{ maxWidth: 250 }}>
                        <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: 250 }} title={l.reason}>
                          {l.reason}
                        </span>
                      </td>
                      <td>{getStatusBadge(l.status)}</td>
                      <td className="text-muted small">
                        {l.reviewedBy ? l.reviewedBy.name : '—'}
                      </td>
                      <td className="text-muted small">
                        {l.comments || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Action Modal */}
      {reviewModal.show && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  Confirm Leave {reviewModal.status}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setReviewModal({ show: false, leaveId: null, status: '', comments: '' })}
                ></button>
              </div>
              <form onSubmit={handleReviewLeave}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    You are marking this leave request as{' '}
                    <strong className={reviewModal.status === 'Approved' ? 'text-success' : 'text-danger'}>
                      {reviewModal.status}
                    </strong>
                    . Add optional supervisor feedback or instructions for the employee below.
                  </p>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Reviewer Comments</label>
                    <textarea
                      rows="3"
                      className="form-control"
                      value={reviewModal.comments}
                      onChange={(e) => setReviewModal({ ...reviewModal, comments: e.target.value })}
                      placeholder="e.g. Approved. Please ensure handover notes are shared..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top py-3 px-4 bg-light-subtle">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setReviewModal({ show: false, leaveId: null, status: '', comments: '' })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${reviewModal.status === 'Approved' ? 'btn-success' : 'btn-danger'} px-4 fw-semibold`}
                  >
                    Confirm {reviewModal.status}
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

export default LeaveView;
