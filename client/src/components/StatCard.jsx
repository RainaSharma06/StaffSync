import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'primary', badgeText }) => {
  const colorMap = {
    primary: {
      bg: '#eff6ff',
      text: '#2563eb',
      border: '#bfdbfe',
    },
    success: {
      bg: '#ecfdf5',
      text: '#059669',
      border: '#a7f3d0',
    },
    warning: {
      bg: '#fffbeb',
      text: '#d97706',
      border: '#fde68a',
    },
    danger: {
      bg: '#fef2f2',
      text: '#dc2626',
      border: '#fecaca',
    },
    purple: {
      bg: '#f5f3ff',
      text: '#7c3aed',
      border: '#ddd6fe',
    },
  };

  const currentTheme = colorMap[color] || colorMap.primary;

  return (
    <div className="kpi-card h-100">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <span className="text-muted fw-semibold small text-uppercase letter-spacing-1">{title}</span>
          <h2 className="display-6 fw-bold mb-1 mt-2 text-dark">{value}</h2>
          {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
        </div>
        <div
          className="kpi-icon-badge"
          style={{
            backgroundColor: currentTheme.bg,
            color: currentTheme.text,
            border: `1px solid ${currentTheme.border}`,
          }}
        >
          {Icon && <Icon size={26} strokeWidth={2.2} />}
        </div>
      </div>
      {badgeText && (
        <div className="mt-3 pt-2 border-top border-light-subtle">
          <span className="badge rounded-pill bg-light text-dark fw-medium border px-2 py-1 small">
            {badgeText}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
