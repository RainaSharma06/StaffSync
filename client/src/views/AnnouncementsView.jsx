import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ToastAlert from '../components/ToastAlert';
import {
  Bell,
  Plus,
  AlertTriangle,
  Info,
  ShieldAlert,
  Calendar,
  User,
  Building,
  Tag,
} from 'lucide-react';

const AnnouncementsView = () => {
  const { user } = useAuth();
  const isHR = user?.role === 'HR';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Normal',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedPriority !== 'All') params.priority = selectedPriority;

      const res = await axiosClient.get('/announcements', { params });
      if (res.success) {
        setAnnouncements(res.announcements || []);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error fetching notices' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedPriority]);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setAlert({ type: '', message: '' });

    try {
      const res = await axiosClient.post('/announcements', formData);
      if (res.success) {
        setAlert({
          type: 'success',
          message: 'Official announcement published to corporate notice board!',
        });
        setShowCreateModal(false);
        setFormData({ title: '', content: '', priority: 'Normal' });
        fetchAnnouncements();
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error publishing notice' });
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="badge-pill-soft badge-soft-danger d-flex align-items-center gap-1">
            <span className="priority-indicator Critical"></span> Critical Priority
          </span>
        );
      case 'Important':
        return (
          <span className="badge-pill-soft badge-soft-warning d-flex align-items-center gap-1">
            <span className="priority-indicator Important"></span> Important
          </span>
        );
      case 'Normal':
      default:
        return (
          <span className="badge-pill-soft badge-soft-info d-flex align-items-center gap-1">
            <span className="priority-indicator Normal"></span> General Notice
          </span>
        );
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Bell className="text-primary" size={28} /> Corporate Notice Board
          </h3>
          <p className="text-muted small mb-0">
            Company-wide updates, executive policy releases, and official communications.
          </p>
        </div>

        {isHR && (
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 fw-semibold rounded-3 shadow-sm"
            style={{ background: 'var(--primary-gradient)', border: 'none' }}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} /> Post New Announcement
          </button>
        )}
      </div>

      <ToastAlert
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert({ type: '', message: '' })}
      />

      {/* Priority Filter Bar */}
      <div className="card card-premium mb-4">
        <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <Tag size={16} className="text-muted" />
            <span className="small fw-semibold text-muted">Filter by Priority:</span>
            <div className="btn-group btn-group-sm" role="group">
              {['All', 'Critical', 'Important', 'Normal'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn ${selectedPriority === p ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                  onClick={() => setSelectedPriority(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <span className="text-muted small">
            Showing <strong>{announcements.length}</strong> bulletins
          </span>
        </div>
      </div>

      {/* Notice Feed */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          Loading notices...
        </div>
      ) : announcements.length === 0 ? (
        <div className="card card-premium p-5 text-center text-muted">
          <Bell size={48} className="mx-auto mb-3 opacity-50 text-primary" />
          <h5 className="fw-bold text-dark">No Announcements Found</h5>
          <p className="small mb-0">There are no notices matching the selected priority filter.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {announcements.map((item) => (
            <div
              key={item._id}
              className={`card card-premium p-4 ${
                item.priority === 'Critical' ? 'border-start border-4 border-danger' : ''
              }`}
            >
              <div className="d-flex flex-column flex-sm-row align-items-sm-start justify-content-between gap-2 mb-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="fw-bold text-dark mb-0">{item.title}</h5>
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mt-1">
                    <span className="d-flex align-items-center gap-1">
                      <User size={14} /> {item.postedBy?.name || 'HR Admin'} ({item.postedBy?.role || 'HR'})
                    </span>
                    <span>•</span>
                    <span className="d-flex align-items-center gap-1">
                      <Calendar size={14} /> {new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
                <div>{getPriorityBadge(item.priority)}</div>
              </div>

              <div className="p-3 bg-light rounded-3 text-secondary" style={{ lineHeight: 1.7, fontSize: '0.925rem' }}>
                {item.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Announcement Modal (HR Only) */}
      {showCreateModal && isHR && (
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
                    <Bell size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Publish Company Announcement</h5>
                    <small className="text-muted">Broadcast official message to all staff members</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreateNotice}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Announcement Headline *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Q4 Town Hall Meeting & Annual Performance Reviews"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Priority Tag *</label>
                    <select
                      className="form-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="Normal">Normal (Standard Information & Activities)</option>
                      <option value="Important">Important (Urgent Operations / Deadlines)</option>
                      <option value="Critical">Critical (Immediate Security / Compliance Attention)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Announcement Content *</label>
                    <textarea
                      rows="5"
                      required
                      className="form-control"
                      placeholder="Enter the full text of the corporate announcement..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top py-3 px-4 bg-light-subtle">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 fw-semibold"
                    style={{ background: 'var(--primary-gradient)', border: 'none' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Publishing...' : 'Publish Announcement'}
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

export default AnnouncementsView;
