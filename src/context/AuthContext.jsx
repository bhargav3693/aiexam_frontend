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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = `${baseUrl}/api/auth/profile/`.replace(/([^:]\/)\/+/g, "$1");
    console.log("Full API URL being called:", fullUrl);
    try {
      const { data } = await api.get(fullUrl, {
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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = `${baseUrl}/api/auth/login/`.replace(/([^:]\/)\/+/g, "$1");
    console.log("Full API URL being called:", fullUrl);
    try {
      const { data } = await api.post(fullUrl, 
        { email, password },
        { headers: { 'Bypass-Tunnel-Reminder': 'true' } }
      );
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      setUser(data.user || null);
      // fetch full profile
      await fetchProfile();
      return data;
    } catch (err) {
      console.error("Login Error:", err);
      throw err;
    }
  };

  const register = async (email, full_name, password, confirm_password) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = `${baseUrl}/api/auth/register/`.replace(/([^:]\/)\/+/g, "$1");
    console.log("Full API URL being called:", fullUrl);
    try {
      const { data } = await api.post(fullUrl, 
        { email, full_name, password, confirm_password },
        { headers: { 'Bypass-Tunnel-Reminder': 'true' } }
      );
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      setUser(data.user);
      return data;
    } catch (err) {
      console.error("Register Error:", err);
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
