import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastAlert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const config = {
    success: {
      bg: 'alert-success',
      icon: CheckCircle2,
      textColor: 'text-success',
    },
    error: {
      bg: 'alert-danger',
      icon: AlertCircle,
      textColor: 'text-danger',
    },
    warning: {
      bg: 'alert-warning',
      icon: AlertCircle,
      textColor: 'text-warning',
    },
    info: {
      bg: 'alert-info',
      icon: Info,
      textColor: 'text-info',
    },
  }[type] || {
    bg: 'alert-info',
    icon: Info,
    textColor: 'text-info',
  };

  const Icon = config.icon;

  return (
    <div
      className={`alert ${config.bg} alert-dismissible fade show d-flex align-items-center shadow-sm py-2 px-3 mb-4 rounded-3`}
      role="alert"
    >
      <Icon className={`me-2 flex-shrink-0 ${config.textColor}`} size={20} />
      <div className="flex-grow-1 small fw-medium">{message}</div>
      {onClose && (
        <button
          type="button"
          className="btn-close ms-2 p-2"
          aria-label="Close"
          onClick={onClose}
          style={{ fontSize: '0.75rem' }}
        ></button>
      )}
    </div>
  );
};

export default ToastAlert;
