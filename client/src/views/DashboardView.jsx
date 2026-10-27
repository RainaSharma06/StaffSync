import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import StatCard from '../components/StatCard';
import {
  Users,
  Clock,
  CalendarDays,
  Bell,
  Play,
  Square,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building2,
  CheckCircle,
} from 'lucide-react';

const DashboardView = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentToday: 0,
    pendingLeaves: 0,
    activeAnnouncements: 0,
  });
  const [myAttendance, setMyAttendance] = useState(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/dashboard/stats');
      if (res.success) {
        setStats(res.stats || {});
        setMyAttendance(res.myTodayAttendance || null);
        setRecentAnnouncements(res.recentAnnouncements || []);
        setRecentLeaves(res.recentLeaves || []);
        setDepartmentBreakdown(res.departmentBreakdown || []);
      }
    } catch (err) {
      console.error('[Dashboard fetch error]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Live timer for clocked-in shift
  useEffect(() => {
    let interval = null;
    if (myAttendance?.clockIn && !myAttendance?.clockOut) {
      const startTime = new Date(myAttendance.clockIn).getTime();
      const updateTimer = () => {
        const diffMs = Date.now() - startTime;
        setTimerSeconds(Math.max(0, Math.floor(diffMs / 1000)));
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [myAttendance]);

  const formatTimer = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      setActionMessage('');
      const res = await axiosClient.post('/attendance/clock-in');
      if (res.success) {
        setMyAttendance(res.attendance);
        setActionMessage(`Clocked in successfully as ${res.attendance.status}`);
        fetchDashboardData();
      }
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      setActionMessage('');
      const res = await axiosClient.post('/attendance/clock-out');
      if (res.success) {
        setMyAttendance(res.attendance);
        setActionMessage('Clocked out successfully. Great job today!');
        fetchDashboardData();
      }
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return <span className="badge bg-danger">Critical</span>;
      case 'Important':
        return <span className="badge bg-warning text-dark">Important</span>;
      case 'Normal':
      default:
        return <span className="badge bg-primary">Normal</span>;
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      {/* Welcome Banner */}
      <div className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden" style={{ background: 'var(--dark-gradient)' }}>
        <div className="card-body p-4 p-md-5 text-white position-relative">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="badge bg-primary bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-1 mb-3 rounded-pill fw-medium">
                🏢 Enterprise HR Portal • {user?.department || 'Operations'}
              </span>
              <h2 className="display-6 fw-bold mb-2">
                Welcome back, {user?.name}!
              </h2>
              <p className="text-light opacity-75 mb-3 lead" style={{ fontSize: '1rem' }}>
                {user?.role === 'HR' && 'You have full administrative privileges to oversee employees, approvals, and notices.'}
                {user?.role === 'Manager' && 'You have team-level oversight to review leave requests and assign training programs.'}
                {user?.role === 'Employee' && 'Track your attendance, manage leaves, view assigned training, and stay informed.'}
              </p>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3 py-2 fw-semibold rounded-3 d-flex align-items-center gap-2 shadow-sm"
                  style={{ background: 'var(--primary-gradient)', border: 'none' }}
                  onClick={() => setActiveTab('attendance')}
                >
                  <Clock size={16} /> Attendance Punch
                </button>
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm px-3 py-2 fw-semibold rounded-3 d-flex align-items-center gap-2"
                  onClick={() => setActiveTab('leaves')}
                >
                  <CalendarDays size={16} /> Leave Management
                </button>
              </div>
            </div>
            
            {/* Quick Shift Timer Card */}
            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="p-3 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10 backdrop-blur">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-white-50 small fw-semibold text-uppercase">Live Shift Status</span>
                  {myAttendance?.clockIn && !myAttendance?.clockOut ? (
                    <span className="badge bg-success d-flex align-items-center gap-1">
                      <span className="spinner-grow spinner-grow-sm" style={{ width: 8, height: 8 }}></span> Clocked In
                    </span>
                  ) : myAttendance?.clockOut ? (
                    <span className="badge bg-secondary">Shift Completed</span>
                  ) : (
                    <span className="badge bg-warning text-dark">Not Clocked In</span>
                  )}
                </div>

                <div className="text-center py-2">
                  <div className="display-6 fw-bold font-monospace tracking-wide text-white">
                    {formatTimer(timerSeconds)}
                  </div>
                  <div className="small text-white-50 mt-1">
                    {myAttendance?.clockIn
                      ? `Started at ${new Date(myAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Punch in to start shift duration timer'}
                  </div>
                </div>

                <div className="mt-3">
                  {!myAttendance?.clockIn ? (
                    <button
                      type="button"
                      className="btn btn-success w-100 fw-bold py-2 rounded-3 punch-pulse d-flex align-items-center justify-content-center gap-2"
                      onClick={handleClockIn}
                      disabled={actionLoading}
                    >
                      <Play size={18} /> Clock In Now
                    </button>
                  ) : !myAttendance?.clockOut ? (
                    <button
                      type="button"
                      className="btn btn-danger w-100 fw-bold py-2 rounded-3 punch-pulse-danger d-flex align-items-center justify-content-center gap-2"
                      onClick={handleClockOut}
                      disabled={actionLoading}
                    >
                      <Square size={18} /> Clock Out (End Shift)
                    </button>
                  ) : (
                    <button type="button" className="btn btn-outline-light w-100 py-2 rounded-3" disabled>
                      <CheckCircle size={18} className="me-1" /> Shift Logged Today
                    </button>
                  )}
                </div>
                {actionMessage && <div className="text-warning small text-center mt-2">{actionMessage}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Total Staff"
            value={stats.totalStaff}
            subtitle="Active registered personnel"
            icon={Users}
            color="primary"
            badgeText="All Departments"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Present Today"
            value={stats.presentToday}
            subtitle={`${stats.totalStaff > 0 ? Math.round((stats.presentToday / stats.totalStaff) * 100) : 0}% workforce logged in`}
            icon={Clock}
            color="success"
            badgeText="Today's Shift"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Pending Leaves"
            value={stats.pendingLeaves}
            subtitle={user?.role === 'Employee' ? 'Your pending requests' : 'Awaiting review/approval'}
            icon={CalendarDays}
            color="warning"
            badgeText="Action required"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <StatCard
            title="Company Notices"
            value={stats.activeAnnouncements}
            subtitle="Published corporate updates"
            icon={Bell}
            color="purple"
            badgeText="Notice Board"
          />
        </div>
      </div>

      {/* Grid: Recent Announcements & Department Breakdown / Recent Leaves */}
      <div className="row g-4">
        {/* Left Column: Notice Board Highlight */}
        <div className="col-lg-7">
          <div className="card card-premium h-100">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3 px-4">
              <div className="d-flex align-items-center gap-2">
                <Bell size={18} className="text-primary" />
                <h6 className="fw-bold mb-0 text-dark">Official Announcements</h6>
              </div>
              <button
                type="button"
                className="btn btn-link btn-sm text-primary text-decoration-none p-0 d-flex align-items-center gap-1 fw-medium"
                onClick={() => setActiveTab('announcements')}
              >
                View all <ArrowRight size={14} />
              </button>
            </div>
            <div className="card-body p-4">
              {recentAnnouncements.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <Bell size={32} className="mb-2 opacity-50" />
                  <p className="mb-0 small">No recent announcements published yet.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {recentAnnouncements.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 rounded-3 border bg-light-subtle card-interactive"
                    >
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <h6 className="fw-bold text-dark mb-0">{item.title}</h6>
                        <div>{getPriorityBadge(item.priority)}</div>
                      </div>
                      <p className="text-muted small mb-2 line-clamp-2" style={{ lineHeight: 1.5 }}>
                        {item.content}
                      </p>
                      <div className="d-flex align-items-center justify-content-between small text-secondary pt-1 border-top border-light-subtle">
                        <span>Posted by: <strong>{item.postedBy?.name || 'HR Team'}</strong></span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Department Workforce & Quick Leaves */}
        <div className="col-lg-5">
          <div className="card card-premium mb-4">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3 px-4">
              <div className="d-flex align-items-center gap-2">
                <Building2 size={18} className="text-primary" />
                <h6 className="fw-bold mb-0 text-dark">Department Distribution</h6>
              </div>
              <span className="badge bg-light text-dark border">Staff Breakdown</span>
            </div>
            <div className="card-body p-4">
              {departmentBreakdown.length === 0 ? (
                <p className="text-muted small text-center mb-0">No department data available.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {departmentBreakdown.map((dept) => {
                    const percentage = stats.totalStaff > 0 ? Math.round((dept.count / stats.totalStaff) * 100) : 0;
                    return (
                      <div key={dept._id}>
                        <div className="d-flex justify-content-between small fw-medium mb-1">
                          <span className="text-dark">{dept._id}</span>
                          <span className="text-muted">{dept.count} members ({percentage}%)</span>
                        </div>
                        <div className="progress" style={{ height: 6 }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${percentage}%`,
                              background: 'var(--primary-gradient)',
                            }}
                            aria-valuenow={percentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Leave Requests */}
          <div className="card card-premium">
            <div className="card-header bg-transparent border-bottom d-flex align-items-center justify-content-between py-3 px-4">
              <div className="d-flex align-items-center gap-2">
                <CalendarDays size={18} className="text-warning" />
                <h6 className="fw-bold mb-0 text-dark">Recent Leave Activity</h6>
              </div>
              <button
                type="button"
                className="btn btn-link btn-sm text-primary text-decoration-none p-0 d-flex align-items-center gap-1 fw-medium"
                onClick={() => setActiveTab('leaves')}
              >
                Manage <ArrowRight size={14} />
              </button>
            </div>
            <div className="card-body p-0">
              {recentLeaves.length === 0 ? (
                <div className="p-4 text-center text-muted small">No recent leave requests recorded.</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {recentLeaves.slice(0, 4).map((l) => (
                    <li key={l._id} className="list-group-item px-4 py-3 d-flex align-items-center justify-content-between">
                      <div>
                        <div className="fw-semibold text-dark small">{l.userId?.name || 'Employee'}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {l.leaveType} Leave • {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`badge-pill-soft ${
                          l.status === 'Approved'
                            ? 'badge-soft-success'
                            : l.status === 'Rejected'
                            ? 'badge-soft-danger'
                            : 'badge-soft-warning'
                        }`}
                      >
                        {l.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
