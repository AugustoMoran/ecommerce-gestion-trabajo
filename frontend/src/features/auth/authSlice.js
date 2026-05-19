import { createSlice } from '@reduxjs/toolkit';

// IMPORTANT: Tokens are stored in HttpOnly cookies by the backend
// Frontend NEVER stores tokens in localStorage or memory
// Only user data is stored in Redux state for UI purposes
const initialState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isAuthInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user } = action.payload;
      state.user = user;
      state.isAuthenticated = !!user;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAuthInitialized: (state, action) => {
      state.isAuthInitialized = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setUser, setLoading, setAuthInitialized, logout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsAuthInitialized = (state) => state.auth.isAuthInitialized;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectIsTecnico = (state) => state.auth.user?.role === 'tecnico';
export const selectIsDespachante = (state) => state.auth.user?.role === 'despachante';
