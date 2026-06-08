/**
 * components/layout/Layout.jsx
 *
 * Shared page layout — sidebar + scrollable main content area.
 * Wrap all authenticated pages with this.
 */

import Sidebar from './TempSideBar';

export default function Layout({ children }) {
  return (
    <div style={styles.shell}>
      <Sidebar />
      <main style={styles.main} className="page-enter">
        {children}
      </main>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    marginLeft: 240,         
    padding: '36px 40px',
    maxWidth: '100%',
    overflowX: 'hidden',
  },
};