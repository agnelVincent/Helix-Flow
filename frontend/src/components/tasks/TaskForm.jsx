/**
 * components/tasks/TaskForm.jsx
 *
 * Modal form for creating and editing tasks.
 * When `task` prop is provided → edit mode.
 * When `task` is null → create mode.
 *
 * Props:
 *   task     {object|null} - Task to edit, or null for create
 *   onSave   {function}    - Called with saved task data on success
 *   onClose  {function}    - Called to close the modal
 */

import { useState } from 'react';
import toast from 'react-hot-toast';

import FormField    from '../common/FormField';
import SubmitButton from '../common/SubmitButton';
import { createTask, updateTask } from '../../api/taskApi';

const STATUS_OPTIONS   = ['pending', 'in_progress', 'completed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

export default function TaskForm({ task, onSave, onClose }) {
  const isEdit = Boolean(task);

  const [title,       setTitle]       = useState(task?.title       || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status,      setStatus]      = useState(task?.status      || 'pending');
  const [priority,    setPriority]    = useState(task?.priority    || 'medium');
  const [dueDate,     setDueDate]     = useState(
    task?.due_date ? task.due_date.slice(0, 16) : ''  // format for datetime-local input
  );
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!title.trim()) {
      setErrors({ title: 'Title is required.' });
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || null,
    };

    setLoading(true);
    try {
      let res;
      if (isEdit) {
        res = await updateTask(task.id, payload);
        toast.success('Task updated.');
      } else {
        res = await createTask(payload);
        toast.success('Task created.');
      }
      onSave(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    // ── Backdrop ──
    <div style={styles.backdrop} onClick={onClose}>
      <div
        style={styles.modal}
        className="glass-card page-enter"
        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
      >
        {/* Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <FormField
            label="Title *"
            id="task-title"
            placeholder="What needs to be done?"
            value={title}
            onChange={setTitle}
            error={errors.title}
          />

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="label" htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              placeholder="Add details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input"
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Status + Priority row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="label" htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} style={{ background: '#13132b' }}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="label" htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p} value={p} style={{ background: '#13132b' }}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="label" htmlFor="task-due">Due Date</label>
            <input
              id="task-due"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>

          {errors.form && (
            <p className="error-text" style={{ textAlign: 'center' }}>{errors.form}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost w-full" onClick={onClose}>
              Cancel
            </button>
            <SubmitButton loading={loading} style={{ margin: 0 }}>
              {isEdit ? 'Save Changes' : 'Create Task'}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    padding: '28px 32px',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 700,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-text-muted)',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color var(--transition-fast)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
};