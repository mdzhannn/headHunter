import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { candidateAuth, clearStoredToken, decodeJwtPayload, getStoredToken, setStoredAuthTokens } from './auth';

type AuthContextValue = {
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  getToken: () => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existing = getStoredToken();
    setToken(existing);
    if (existing) {
      const payload = decodeJwtPayload(existing);
      setRole(typeof payload?.role === 'string' ? payload.role : null);
    } else {
      setRole(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await candidateAuth.login(email, password);
    setStoredAuthTokens(res.accessToken, res.refreshToken);
    setToken(res.accessToken);
    const payload = decodeJwtPayload(res.accessToken);
    const nextRole = typeof payload?.role === 'string' ? payload.role : null;
    setRole(nextRole);
    return nextRole;
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setRole(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    token,
    role,
    isLoading,
    login,
    logout,
    getToken: () => token,
  }), [token, role, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
