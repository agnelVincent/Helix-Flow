 /* Clean hook to consume AuthContext anywhere in the component tree.
 *
 * Throws a clear error if used outside <AuthProvider> —
 */


import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';


export function useAuth() {

  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth() must be used inside <AuthProvider>. Check your App.jsx.');
  }

  return context;
}

