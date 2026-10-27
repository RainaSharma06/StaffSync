import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ToastAlert from '../components/ToastAlert';
import {
  Clock,
  Play,
  Square,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Timer,
  FileSpreadsheet,
  Building,
  Filter,
  Check,
} from 'lucide-react';

const AttendanceView = () => {
  const { user } = useAuth();
  const isHRorManager = user?.role === 'HR' || user?.role === 'Manager';

  const [activeTab, setActiveTab] = useState('my-punch'); // 'my-punch' | 'all-logs'
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [myLogs, setMyLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filters for All Logs (HR / Manager)
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDept, setFilterDept] = useState('All');

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/attendance/my-logs');
      if (res.success) {
        setTodayRecord(res.today);
        setMyLogs(res.logs || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error fetching attendance logs' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAttendance = async () => {
    if (!isHRorManager) return;
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterStatus !== 'All') params.status = filterStatus;
      if (filterDept !== 'All') params.department = filterDept;

      const res = await axiosClient.get('/attendance/all', { params });
      if (res.success) {
        setAllLogs(res.records || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error fetching company attendance logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'all-logs') {
      fetchAllAttendance();
    }
  }, [activeTab, filterDate, filterStatus, filterDept]);

  // Live timer for active shift
  useEffect(() => {
    let interval = null;
    if (todayRecord?.clockIn && !todayRecord?.clockOut) {
      const startTime = new Date(todayRecord.clockIn).getTime();
      const tick = () => {
        const diffMs = Date.now() - startTime;
        setTimerSeconds(Math.max(0, Math.floor(diffMs / 1000)));
      };
      tick();
      interval = setInterval(tick, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [todayRecord]);

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setAlert({ type: '', message: '' });
      const res = await axiosClient.post('/attendance/clock-in');
      if (res.success) {
        setTodayRecord(res.attendance);
        setAlert({
          type: 'success',
          message: `Clocked in successfully at ${new Date(res.attendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Status: ${res.attendance.status}`,
        });
        fetchMyAttendance();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setAlert({ type: '', message: '' });
      const res = await axiosClient.post('/attendance/clock-out');
      if (res.success) {
        setTodayRecord(res.attendance);
        setAlert({
          type: 'success',
          message: `Shift ended successfully at ${new Date(res.attendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${res.durationHours} hrs).`,
        });
        fetchMyAttendance();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return <span className="badge-pill-soft badge-soft-success">Present</span>;
      case 'Late':
        return <span className="badge-pill-soft badge-soft-warning">Late Arrival</span>;
      case 'Half-day':
        return <span className="badge-pill-soft badge-soft-danger">Half-day</span>;
      default:
        return <span className="badge-pill-soft badge-soft-info">{status}</span>;
    }
  };

  const computeDuration = (clockIn, clockOut) => {
    if (!clockIn) return '—';
    const end = clockOut ? new Date(clockOut) : new Date();
    const diffHours = (end.getTime() - new Date(clockIn).getTime()) / (1000 * 60 * 60);
    return `${diffHours.toFixed(2)} hrs`;
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      {/* Title */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Clock className="text-primary" size={28} /> Attendance & Time Tracking
          </h3>
          <p className="text-muted small mb-0">
            Real-time biometric punch terminal, working hour calculators, and historical shift audits.
          </p>
        </div>

        {/* Tab Switcher for Managers/HR */}
        {isHRorManager && (
          <ul className="nav nav-pills nav-pills-staffsync bg-white p-1 rounded-3 border shadow-sm">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'my-punch' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-punch')}
              >
                <Timer size={16} /> My Punch Terminal
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === 'all-logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('all-logs')}
              >
                <FileSpreadsheet size={16} /> {user.role === 'HR' ? 'All Staff Logs' : 'Team Attendance'}
              </button>
            </li>
          </ul>
        )}
      </div>

      <ToastAlert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {activeTab === 'my-punch' ? (
        <>
          {/* Main Interactive Clock-In / Clock-Out Widget */}
          <div className="row g-4 mb-4">
            <div className="col-lg-5">
              <div className="card card-premium h-100 text-center p-4">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <span className="text-muted small fw-bold text-uppercase letter-spacing-1">
                    Terminal Status
                  </span>
                  <span className="badge bg-light text-dark border px-2 py-1 small">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="my-auto py-3">
                  <div
                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 shadow"
                    style={{
                      width: 140,
                      height: 140,
                      background:
                        todayRecord?.clockIn && !todayRecord?.clockOut
                          ? 'var(--success-gradient)'
                          : todayRecord?.clockOut
                          ? 'var(--dark-gradient)'
                          : 'var(--primary-gradient)',
                      color: '#ffffff',
                    }}
                  >
                    <Timer size={54} />
                  </div>

                  <h3 className="display-6 fw-bold font-monospace text-dark mb-1">
                    {formatTimer(timerSeconds)}
                  </h3>
                  <div className="text-muted small mb-4">
                    {todayRecord?.clockIn && !todayRecord?.clockOut ? (
                      <span className="text-success fw-bold d-flex align-items-center justify-content-center gap-1">
                        <span className="spinner-grow spinner-grow-sm"></span> Shift Active in Progress
                      </span>
                    ) : todayRecord?.clockOut ? (
                      <span className="text-secondary fw-semibold">Shift Finished for Today</span>
                    ) : (
                      <span className="text-muted">Awaiting Clock-in for Today</span>
                    )}
                  </div>

                  {/* Punch Button */}
                  <div className="d-grid gap-2 col-10 col-md-8 mx-auto">
                    {!todayRecord?.clockIn ? (
                      <button
                        type="button"
                        className="btn btn-success btn-lg fw-bold py-3 rounded-4 punch-pulse shadow-sm d-flex align-items-center justify-content-center gap-2"
                        onClick={handleClockIn}
                        disabled={actionLoading}
                      >
                        <Play size={22} /> Punch In (Clock In)
                      </button>
                    ) : !todayRecord?.clockOut ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-lg fw-bold py-3 rounded-4 punch-pulse-danger shadow-sm d-flex align-items-center justify-content-center gap-2"
                        onClick={handleClockOut}
                        disabled={actionLoading}
                      >
                        <Square size={22} /> Punch Out (Clock Out)
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-lg py-3 rounded-4 disabled opacity-75"
                        disabled
                      >
                        <Check size={20} className="me-1" /> Shift Logged Today
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-3 border-top text-muted small">
                  Standard Shift Policy: Arrival after 09:30 AM marked as <strong>Late</strong>. Shifts &lt; 4 hrs flagged as <strong>Half-day</strong>.
                </div>
              </div>
            </div>

            {/* Today's Shift Metrics Details */}
            <div className="col-lg-7">
              <div className="card card-premium h-100 p-4">
                <h5 className="fw-bold text-dark mb-3">Today's Shift Details</h5>
                
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <div className="p-3 rounded-3 bg-light border">
                      <div className="text-muted small mb-1">Clock-In Timestamp</div>
                      <div className="h5 fw-bold text-dark mb-0">
                        {todayRecord?.clockIn
                          ? new Date(todayRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="p-3 rounded-3 bg-light border">
                      <div className="text-muted small mb-1">Clock-Out Timestamp</div>
                      <div className="h5 fw-bold text-dark mb-0">
                        {todayRecord?.clockOut
                          ? new Date(todayRecord.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : '— (Active)'}
                      </div>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="p-3 rounded-3 bg-light border">
                      <div className="text-muted small mb-1">Today's Recorded Status</div>
                      <div className="mt-1">
                        {todayRecord?.status ? getStatusBadge(todayRecord.status) : <span className="text-muted small">Pending</span>}
                      </div>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="p-3 rounded-3 bg-light border">
                      <div className="text-muted small mb-1">Total Shift Duration</div>
                      <div className="h5 fw-bold text-primary mb-0">
                        {computeDuration(todayRecord?.clockIn, todayRecord?.clockOut)}
                      </div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-2">Punch Terminal Rules & Notes</h6>
                <ul className="list-unstyled small text-muted d-flex flex-column gap-2 mb-0">
                  <li className="d-flex align-items-start gap-2">
                    <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                    <span>One attendance record is maintained per employee per calendar day.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                    <span>Duration is calculated automatically upon clock-out and synced with payroll audit.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <AlertCircle size={16} className="text-warning mt-0.5 flex-shrink-0" />
                    <span>Please remember to clock out prior to leaving company premises or logging off.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Personal Attendance History Logs */}
          <div className="card card-premium overflow-hidden">
            <div className="card-header bg-transparent border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
              <h5 className="fw-bold text-dark mb-0">My Shift History Logs</h5>
              <span className="badge bg-light text-muted border px-3 py-1">Last 60 Days</span>
            </div>
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Total Working Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        Loading history...
                      </td>
                    </tr>
                  ) : myLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No previous shift logs found.
                      </td>
                    </tr>
                  ) : (
                    myLogs.map((log) => (
                      <tr key={log._id}>
                        <td className="fw-semibold text-dark">{log.date}</td>
                        <td className="text-muted">
                          {log.clockIn
                            ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="text-muted">
                          {log.clockOut
                            ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : <span className="badge bg-success bg-opacity-25 text-success">Active</span>}
                        </td>
                        <td className="fw-bold text-dark">
                          {computeDuration(log.clockIn, log.clockOut)}
                        </td>
                        <td>{getStatusBadge(log.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* All Staff Attendance Logs (HR & Manager) */
        <div className="card card-premium">
          <div className="card-header bg-transparent border-bottom py-3 px-4">
            <div className="row g-3 align-items-center">
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Filter by Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Filter by Status</label>
                <select
                  className="form-select form-select-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half-day">Half-day</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Department</label>
                <select
                  className="form-select form-select-sm"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Finance & Legal">Finance & Legal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Loading company logs...
                    </td>
                  </tr>
                ) : allLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No attendance records found matching filters.
                    </td>
                  </tr>
                ) : (
                  allLogs.map((log) => (
                    <tr key={log._id}>
                      <td>
                        <div className="fw-bold text-dark">{log.userId?.name || 'Unknown'}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {log.userId?.designation}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">
                          {log.userId?.department || '—'}
                        </span>
                      </td>
                      <td className="fw-medium text-dark">{log.date}</td>
                      <td className="text-muted">
                        {log.clockIn
                          ? new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="text-muted">
                        {log.clockOut
                          ? new Date(log.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : <span className="badge bg-success bg-opacity-25 text-success">Active</span>}
                      </td>
                      <td className="fw-bold text-dark">
                        {computeDuration(log.clockIn, log.clockOut)}
                      </td>
                      <td>{getStatusBadge(log.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-transparent border-top py-3 px-4 d-flex justify-content-between align-items-center text-muted small">
            <span>Total records found: <strong>{allLogs.length}</strong></span>
            {filterDate && (
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0"
                onClick={() => setFilterDate('')}
              >
                Clear date filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
