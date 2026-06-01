/**
 * pages/Calendar.jsx
 *
 * Monthly calendar view showing tasks grouped by due date.
 *
 * Features:
 *   - Month navigation (prev / next / today)
 *   - Task dots on days with scheduled tasks
 *   - Click a day to see its tasks in a side panel
 *   - Fetches from GET /api/tasks/calendar/?year=&month=
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import Layout from '../components/layout/Layout';
import { getCalendarTasks } from '../api/taskApi';
import { formatDisplayDate } from '../utils/formatDate';

// ── Constants ──────────────────────────────────────────────────────────────

const WEEKDAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS    = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build the full grid of day cells for a given month.
 * Includes padding nulls at start/end to fill the 7-column grid.
 */
function buildCalendarGrid(year, month) {
  const firstDay  = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) cells.push(null);

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Trailing empty cells to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

/**
 * Format a day number into a YYYY-MM-DD key matching API response keys.
 */
function toDayKey(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TaskPill({ task }) {
  return (
    <div style={{
      ...styles.pill,
      background: task.is_completed
        ? 'rgba(16,185,129,0.12)'
        : 'rgba(124,58,237,0.15)',
      borderColor: task.is_completed
        ? 'rgba(16,185,129,0.3)'
        : 'rgba(124,58,237,0.4)',
    }}>
      <span style={{
        ...styles.pillDot,
        background: task.is_completed ? 'var(--color-success)' : 'var(--color-primary-light)',
      }} />
      <span style={{
        ...styles.pillText,
        textDecoration: task.is_completed ? 'line-through' : 'none',
        color: task.is_completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
      }}>
        {task.title}
      </span>
      <span className={`badge badge-${task.priority}`} style={{ marginLeft: 'auto' }}>
        {task.priority}
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Calendar() {
  const today = new Date();

  const [year,        setYear]        = useState(today.getFullYear());
  const [month,       setMonth]       = useState(today.getMonth() + 1); // 1-indexed
  const [taskMap,     setTaskMap]     = useState({});                   // { 'YYYY-MM-DD': [...tasks] }
  const [loading,     setLoading]     = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);                 // day number or null

  // ── Fetch tasks for current month ────────────────────────────────────────

  useEffect(() => {
    const fetchCalendar = async () => {
      setLoading(true);
      setSelectedDay(null);
      try {
        const res  = await getCalendarTasks(year, month);
        setTaskMap(res.data.data || {});
      } catch {
        toast.error('Failed to load calendar.');
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [year, month]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const goToPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else             { setMonth(m => m - 1); }
  };

  const goToNext = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else              { setMonth(m => m + 1); }
  };

  const goToToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
    setSelectedDay(today.getDate());
  };

  // ── Derived ──────────────────────────────────────────────────────────────

  const grid           = buildCalendarGrid(year, month);
  const selectedKey    = selectedDay ? toDayKey(year, month, selectedDay) : null;
  const selectedTasks  = selectedKey ? (taskMap[selectedKey] || []) : [];
  const totalThisMonth = Object.values(taskMap).reduce((sum, arr) => sum + arr.length, 0);

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() + 1 &&
    year  === today.getFullYear();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Calendar</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {loading ? 'Loading...' : `${totalThisMonth} task${totalThisMonth !== 1 ? 's' : ''} this month`}
          </p>
        </div>

        {/* Month navigation */}
        <div style={styles.navRow}>
          <button onClick={goToPrev} style={styles.navBtn}>‹</button>
          <span style={styles.monthLabel}>
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={goToNext} style={styles.navBtn}>›</button>
          <button onClick={goToToday} className="btn btn-ghost" style={{ padding: '8px 16px' }}>
            Today
          </button>
        </div>
      </div>

      <div style={styles.layout}>
        {/* ── Calendar grid ── */}
        <div style={styles.calendarWrap} className="glass-card">

          {/* Weekday headers */}
          <div style={styles.weekdayRow}>
            {WEEKDAYS.map(d => (
              <div key={d} style={styles.weekdayCell}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          {loading ? (
            <div className="flex items-center justify-center" style={{ height: 320 }}>
              <div className="spinner" style={{ width: 36, height: 36 }} />
            </div>
          ) : (
            <div style={styles.grid}>
              {grid.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} style={styles.emptyCell} />;

                const key        = toDayKey(year, month, day);
                const dayTasks   = taskMap[key] || [];
                const hasTask    = dayTasks.length > 0;
                const isSelected = day === selectedDay;
                const today_cell = isToday(day);

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    style={{
                      ...styles.dayCell,
                      ...(isSelected ? styles.dayCellSelected : {}),
                      ...(today_cell && !isSelected ? styles.dayCellToday : {}),
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{
                      ...styles.dayNumber,
                      ...(today_cell ? styles.dayNumberToday : {}),
                    }}>
                      {day}
                    </span>

                    {/* Task dots */}
                    {hasTask && (
                      <div style={styles.dotRow}>
                        {dayTasks.slice(0, 3).map((t, i) => (
                          <span key={i} style={{
                            ...styles.dot,
                            background: t.is_completed
                              ? 'var(--color-success)'
                              : 'var(--color-primary-light)',
                          }} />
                        ))}
                        {dayTasks.length > 3 && (
                          <span style={styles.dotMore}>+{dayTasks.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Day detail panel ── */}
        <div style={styles.panel} className="glass-card">
          {!selectedDay ? (
            <div style={styles.panelEmpty}>
              <p style={{ fontSize: 32 }}>📅</p>
              <p style={{ fontWeight: 600, marginTop: 12 }}>Select a day</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 4 }}>
                Click any date to see its scheduled tasks.
              </p>
            </div>
          ) : (
            <>
              <h3 style={styles.panelTitle}>
                {formatDisplayDate(new Date(year, month - 1, selectedDay))}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 16 }}>
                {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
              </p>

              {selectedTasks.length === 0 ? (
                <div style={styles.panelEmpty}>
                  <p style={{ fontSize: 28 }}>✓</p>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginTop: 8 }}>
                    Nothing scheduled.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedTasks.map(task => (
                    <TaskPill key={task.id} task={task} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
    flexWrap: 'wrap',
    gap: 16,
  },
  heading: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    marginBottom: 4,
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-md)',
    fontSize: 20,
    color: 'var(--color-text-secondary)',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  monthLabel: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 700,
    minWidth: 160,
    textAlign: 'center',
    color: 'var(--color-text-primary)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: 20,
    alignItems: 'start',
  },
  calendarWrap: {
    padding: 20,
    overflow: 'hidden',
  },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom: 8,
  },
  weekdayCell: {
    textAlign: 'center',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    padding: '8px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  emptyCell: {
    minHeight: 80,
  },
  dayCell: {
    minHeight: 80,
    padding: '10px 8px 8px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    border: '1px solid transparent',
    transition: 'all var(--transition-fast)',
  },
  dayCellSelected: {
    background: 'rgba(124,58,237,0.15)',
    border: '1px solid rgba(124,58,237,0.4)',
  },
  dayCellToday: {
    border: '1px solid rgba(124,58,237,0.25)',
    background: 'rgba(124,58,237,0.06)',
  },
  dayNumber: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    lineHeight: 1,
  },
  dayNumberToday: {
    color: 'var(--color-primary-light)',
    fontWeight: 700,
  },
  dotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  dotMore: {
    fontSize: 10,
    color: 'var(--color-text-muted)',
    fontWeight: 600,
  },
  panel: {
    padding: 24,
    minHeight: 400,
  },
  panelTitle: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 700,
    marginBottom: 4,
  },
  panelEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 16px',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid',
    fontSize: 'var(--font-size-sm)',
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  pillText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};