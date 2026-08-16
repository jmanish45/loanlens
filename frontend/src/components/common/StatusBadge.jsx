const statusConfig = {
  draft: { label: 'Draft', variant: 'bg-cream-300 text-charcoal-600' },
  documents_pending: { label: 'Documents Pending', variant: 'bg-warning-100 text-warning-600' },
  under_review: { label: 'Under Review', variant: 'bg-accent-100 text-accent-600' },
  approved: { label: 'Approved', variant: 'bg-success-100 text-success-600' },
  rejected: { label: 'Rejected', variant: 'bg-error-100 text-error-600' },
  withdrawn: { label: 'Withdrawn', variant: 'bg-cream-300 text-charcoal-500' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1
        text-xs font-semibold rounded-full
        ${config.variant}
        ${className}
      `}
    >
      {config.label}
    </span>
  );
}
