import { useState, useEffect, createContext, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.verify()
        .then(data => {
          setUser({ ...data.user, token });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('token', data.token);
    setUser({ ...data.user, token: data.token });
    return data;
  };

  const register = async (email, password, username) => {
    return api.register({ email, password, username });
  };

  const logout = async () => {
    await api.logout();
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const data = await api.verify();
        setUser({ ...data.user, token });
        return data;
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
        throw error;
      }
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
