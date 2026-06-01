/**
 * pages/Tasks.jsx
 *
 * Full task management page — list, filter, create, edit,
 * delete, and complete tasks.
 *
 * State:
 *   tasks        → full list from API
 *   filters      → { status, priority } for server-side filtering
 *   showForm     → whether the create/edit modal is open
 *   editingTask  → task object being edited (null = create mode)
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import Layout   from '../components/layout/Layout';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';

import {
  getTasks,
  deleteTask,
  completeTask,
} from '../api/taskApi';

const STATUS_FILTERS   = ['all', 'pending', 'in_progress', 'completed'];
const PRIORITY_FILTERS = ['all', 'low', 'medium', 'high'];

export default function Tasks() {
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editingTask, setEditingTask] = useState(null);  // null = create mode
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // ── Fetch tasks ────────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter   !== 'all') filters.status   = statusFilter;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;

      const res = await getTasks(filters);
      setTasks(res.data.data || []);
    } catch {
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleComplete = async (taskId) => {
    try {
      const res = await completeTask(taskId);
      // Update in place — no full refetch needed
      setTasks(prev =>
        prev.map(t => t.id === taskId ? res.data.data : t)
      );
      toast.success('Task marked as completed!');
    } catch {
      toast.error('Failed to complete task.');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted.');
    } catch {
      toast.error('Failed to delete task.');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleFormSave = (savedTask) => {
    if (editingTask) {
      // Update existing task in list
      setTasks(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
    } else {
      // Prepend new task to list
      setTasks(prev => [savedTask, ...prev]);
    }
    setShowForm(false);
    setEditingTask(null);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Tasks</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          + New Task
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={styles.filters}>
        {/* Status filter */}
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Status</span>
          <div style={styles.filterBtns}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  ...styles.filterBtn,
                  ...(statusFilter === f ? styles.filterBtnActive : {}),
                }}
              >
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Priority filter */}
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>Priority</span>
          <div style={styles.filterBtns}>
            {PRIORITY_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setPriorityFilter(f)}
                style={{
                  ...styles.filterBtn,
                  ...(priorityFilter === f ? styles.filterBtnActive : {}),
                }}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Task grid ── */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : tasks.length === 0 ? (
        <div style={styles.empty} className="glass-card">
          <p style={{ fontSize: 40 }}>📋</p>
          <p style={{ fontWeight: 600, marginTop: 12 }}>No tasks found</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 4 }}>
            {statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first task to get started.'}
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 20 }}
            onClick={handleCreate}
          >
            + Create Task
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit modal ── */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </Layout>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  heading: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  filters: {
    display: 'flex',
    gap: 24,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  filterLabel: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  },
  filterBtns: {
    display: 'flex',
    gap: 4,
  },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    textTransform: 'capitalize',
  },
  filterBtnActive: {
    background: 'rgba(124,58,237,0.15)',
    color: 'var(--color-primary-light)',
    borderColor: 'var(--color-primary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  empty: {
    textAlign: 'center',
    padding: '60px 24px',
    marginTop: 8,
  },
};