import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const access = localStorage.getItem('access');
    if (access) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('auth/profile/', {
        headers: { 'Bypass-Tunnel-Reminder': 'true' }
      });
      setUser(data);
    } catch {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const payload = { email, password };
    console.log("Payload:", payload);
    try {
      const { data } = await api.post('auth/login/', 
        payload,
        { headers: { 'Bypass-Tunnel-Reminder': 'true' } }
      );
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      setUser(data.user || null);
      await fetchProfile();
      return data;
    } catch (err) {
      console.error("API Error:", err.response?.data);
      throw err;
    }
  };

  const register = async (email, full_name, password, confirm_password) => {
    const payload = { email, full_name, password, confirm_password };
    console.log("Payload:", payload);
    try {
      const { data } = await api.post('auth/register/', 
        payload,
        { headers: { 'Bypass-Tunnel-Reminder': 'true' } }
      );
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      setUser(data.user);
      return data;
    } catch (err) {
      console.error("API Error:", err.response?.data);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
