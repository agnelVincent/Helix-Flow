
import { createContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout as logoutApi } from '../api/authApi';


export const AuthContext = createContext(null);



export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const restoreSession = async () => {
      try {
        // If the access_token cookie is valid, this succeeds and returns user
        const response = await getMe();
        setUser(response.data.data);

      } catch {
        // Cookie missing or expired — user is not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── Auth actions ─────────────────────────────────────────────────────────

  /**
   * Called after a successful login or OTP verify response.
   * The server has already set the cookies — we just store the user locally.
   *
   * @param {Object} userData - { email, first_name, last_name }
   */
  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  /**
   * Logs the user out — clears server-side cookies and local user state.
   */
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
    } finally {
      setUser(null);
    }
  }, []);

  // ── Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}