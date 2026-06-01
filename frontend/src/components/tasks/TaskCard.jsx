/**
 * components/tasks/TaskCard.jsx
 *
 * Displays a single task with actions:
 * complete, edit, delete.
 *
 * Props:
 *   task       {object}   - Task data object
 *   onComplete {function} - Called with task id to mark complete
 *   onEdit     {function} - Called with task object to open edit form
 *   onDelete   {function} - Called with task id to delete
 */

import { formatDisplayDate, isOverdue } from '../../utils/formatDate';

export default function TaskCard({ task, onComplete, onEdit, onDelete }) {
  const overdue = isOverdue(task.due_date, task.is_completed);

  return (
    <div style={{
      ...styles.card,
      opacity: task.is_completed ? 0.65 : 1,
    }}
      className="glass-card"
    >
      {/* ── Top row: title + actions ── */}
      <div style={styles.topRow}>
        <h3 style={{
          ...styles.title,
          textDecoration: task.is_completed ? 'line-through' : 'none',
          color: task.is_completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        }}>
          {task.title}
        </h3>

        <div style={styles.actions}>
          {/* Complete */}
          {!task.is_completed && (
            <button
              style={styles.actionBtn}
              title="Mark as complete"
              onClick={() => onComplete(task.id)}
            >
              ✓
            </button>
          )}
          {/* Edit */}
          <button
            style={styles.actionBtn}
            title="Edit task"
            onClick={() => onEdit(task)}
          >
            ✎
          </button>
          {/* Delete */}
          <button
            style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
            title="Delete task"
            onClick={() => onDelete(task.id)}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Description ── */}
      {task.description && (
        <p style={styles.description}>{task.description}</p>
      )}

      {/* ── Footer: badges + due date ── */}
      <div style={styles.footer}>
        <div style={styles.badges}>
          <span className={`badge badge-${task.status.replace('_', '-')}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className={`badge badge-${task.priority}`}>
            {task.priority}
          </span>
        </div>

        {task.due_date && (
          <span style={{
            fontSize: 'var(--font-size-xs)',
            color: overdue ? 'var(--color-error)' : 'var(--color-text-muted)',
            fontWeight: overdue ? 600 : 400,
          }}>
            {overdue ? '⚠ Overdue · ' : '📅 '}
            {formatDisplayDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 600,
    lineHeight: 1.4,
    flex: 1,
  },
  actions: {
    display: 'flex',
    gap: 4,
    flexShrink: 0,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    color: 'var(--color-text-muted)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  actionBtnDanger: {
    color: 'var(--color-error)',
    borderColor: 'rgba(239,68,68,0.2)',
    background: 'rgba(239,68,68,0.05)',
  },
  description: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  badges: {
    display: 'flex',
    gap: 6,
  },
};