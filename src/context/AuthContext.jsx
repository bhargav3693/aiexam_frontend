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
    const fullUrl = (api.defaults.baseURL || '') + '/api/auth/profile/';
    console.log("Calling Profile URL:", fullUrl);
    try {
      const { data } = await api.get('api/auth/profile/', {
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
    const fullUrl = (api.defaults.baseURL || '') + '/api/auth/login/';
    console.log("Calling Login URL:", fullUrl);
    try {
      const { data } = await api.post('api/auth/login/', 
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
    const fullUrl = (api.defaults.baseURL || '') + '/api/auth/register/';
    console.log("Calling Register URL:", fullUrl);
    try {
      const { data } = await api.post('api/auth/register/', 
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
