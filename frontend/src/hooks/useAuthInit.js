import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useGetMeQuery } from '../services/authApi';
import { setUser, logout, setLoading, setAuthInitialized } from '../features/auth/authSlice';

/**
 * Hook that initializes auth state on app load
 * Calls getMe to restore session from HttpOnly cookies
 */
export const useAuthInit = () => {
  const dispatch = useDispatch();
  const initialized = useRef(false);
  
  try {
    // Always call getMe - RTK Query will handle caching
    // This ensures session is restored from cookies after page reload
    const { data: user, isLoading, error } = useGetMeQuery(undefined);

    useEffect(() => {
      // Dispatch loading state
      dispatch(setLoading(isLoading));
      
      if (initialized.current && isLoading) return; // Skip if already processed and still loading
      
      if (user && !isLoading && !initialized.current) {
        dispatch(setUser(user));
        dispatch(setAuthInitialized(true));
        initialized.current = true;
      } else if (error && !isLoading && !initialized.current) {
        // No valid session
        dispatch(logout());
        dispatch(setAuthInitialized(true));
        initialized.current = true;
      }
    }, [user, error, isLoading, dispatch]);

    return isLoading;
  } catch (err) {
    // RTK Query not yet initialized, skip
    console.warn('RTK Query not ready during auth init:', err.message);
    dispatch(setLoading(false));
    dispatch(setAuthInitialized(true));
    return false;
  }
};

export default useAuthInit;
