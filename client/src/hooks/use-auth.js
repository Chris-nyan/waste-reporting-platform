import { useContext } from 'react';
import AuthContext from '@/contexts/AuthContext';

// This is a simple custom hook that provides a shortcut for accessing the AuthContext.
const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;

