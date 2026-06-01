/**
 * pages/Dashboard.jsx
 *
 * Overview page showing task stats and upcoming tasks.
 * Fetches all user tasks on mount and derives stats from them.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { getTasks } from '../api/taskApi';
import { formatDisplayDate, isOverdue } from '../utils/formatDate';

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, count, color, icon }) {
  return (
    <div style={{ ...styles.statCard, borderColor: color + '30' }} className="glass-card">
      <div style={{ ...styles.statIcon, background: color + '20', color }}>
        {icon}
      </div>
      <div>
        <p style={styles.statCount}>{count}</p>
        <p style={styles.statLabel}>{label}</p>
      </div>
    </div>
  );
}

// ── Mini task row ──────────────────────────────────────────────────────────

function TaskRow({ task, onClick }) {
  const overdue = isOverdue(task.due_date, task.is_completed);

  return (
    <div style={styles.taskRow} onClick={onClick}>
      <div style={styles.taskRowLeft}>
        <span
          className={`badge badge-${task.status.replace('_', '-')}`}
          style={{ marginRight: 10 }}
        >
          {task.status.replace('_', ' ')}
        </span>
        <span style={{
          ...styles.taskTitle,
          textDecoration: task.is_completed ? 'line-through' : 'none',
          color: task.is_completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
        }}>
          {task.title}
        </span>
      </div>
      {task.due_date && (
        <span style={{ color: overdue ? 'var(--color-error)' : 'var(--color-text-muted)', fontSize: 12 }}>
          {overdue ? '⚠ ' : ''}{formatDisplayDate(task.due_date)}
        </span>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [tasks,    setTasks]   = useState([]);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await getTasks();
        setTasks(res.data.data || []);
      } catch {
        toast.error('Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────
  const total      = tasks.length;
  const pending    = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed  = tasks.filter(t => t.status === 'completed').length;

  // Upcoming: due within next 7 days and not completed
  const now     = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = tasks
    .filter(t => t.due_date && !t.is_completed && new Date(t.due_date) <= in7Days)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  // Recent: last 5 created
  const recent = [...tasks].slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Layout>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>
            {greeting()}, {user?.first_name || 'there'} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Here's what's on your plate today.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/tasks')}
        >
          + New Task
        </button>
      </div>

      {/* ── Stats ── */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: 120 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <div style={styles.statsGrid}>
          <StatCard label="Total Tasks"  count={total}      color="#9d65f5" icon="⊞" />
          <StatCard label="Pending"      count={pending}    color="#94a3b8" icon="○" />
          <StatCard label="In Progress"  count={inProgress} color="#3b82f6" icon="◑" />
          <StatCard label="Completed"    count={completed}  color="#10b981" icon="✓" />
        </div>
      )}

      {/* ── Bottom panels ── */}
      {!loading && (
        <div style={styles.panels}>

          {/* Upcoming tasks */}
          <div className="glass-card" style={styles.panel}>
            <h2 style={styles.panelTitle}>⏰ Upcoming (7 days)</h2>
            {upcoming.length === 0 ? (
              <p style={styles.emptyText}>No tasks due in the next 7 days.</p>
            ) : (
              upcoming.map(task => (
                <TaskRow key={task.id} task={task} onClick={() => navigate('/tasks')} />
              ))
            )}
          </div>

          {/* Recent tasks */}
          <div className="glass-card" style={styles.panel}>
            <h2 style={styles.panelTitle}>🕐 Recent Tasks</h2>
            {recent.length === 0 ? (
              <p style={styles.emptyText}>No tasks yet. Create your first one!</p>
            ) : (
              recent.map(task => (
                <TaskRow key={task.id} task={task} onClick={() => navigate('/tasks')} />
              ))
            )}
          </div>

        </div>
      )}
    </Layout>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  heading: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    border: '1px solid',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  },
  statCount: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  panel: {
    padding: '24px',
  },
  panelTitle: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 700,
    marginBottom: 16,
    color: 'var(--color-text-primary)',
  },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'opacity var(--transition-fast)',
  },
  taskRowLeft: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 'var(--font-size-sm)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyText: {
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-sm)',
    textAlign: 'center',
    padding: '24px 0',
  },
};