import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../lib/api';
import { toast } from 'react-toastify';

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const decodedUser = jwtDecode(token);
          if (decodedUser.exp * 1000 > Date.now()) {
            setUser(decodedUser);
          } else {
            localStorage.removeItem('authToken');
          }
        } catch (err) {
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token } = response.data;

      localStorage.setItem('authToken', token);
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
      toast.success('Login Successful!');
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred during login.';
      setError(errorMessage);
      toast.error(errorMessage); // Display error toast
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    toast.info("You have been logged out.");
  };

  const contextValue = {
    user,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

