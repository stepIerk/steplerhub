export function ProgressBar({ value, className = '' }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div
      className={`progress ${className}`.trim()}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${safe}%` }} />
    </div>
  )
}

export function StatusBadge({ status }) {
  const label =
    status === 'done' ? 'Готово' : status === 'in_progress' ? 'В процессе' : 'Не начато'
  return <span className={`badge badge-${status || 'todo'}`}>{label}</span>
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
      {action}
    </div>
  )
}

export function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
