import { createSlice } from '@reduxjs/toolkit';

// IMPORTANT: Tokens are stored in HttpOnly cookies by the backend
// But we also need to store in Redux for cross-domain requests (Vercel → Render)
// HttpOnly cookies don't get sent in cross-origin requests
const initialState = {
  user: null,
  accessToken: null, // For cross-domain requests: Vercel → Render
  isLoading: false,
  isAuthenticated: false,
  isAuthInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken; // Save token for cross-domain requests
      state.isAuthenticated = !!user;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAuthInitialized: (state, action) => {
      state.isAuthInitialized = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setUser, setAccessToken, setLoading, setAuthInitialized, logout } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectIsAuthInitialized = (state) => state.auth.isAuthInitialized;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectIsTecnico = (state) => state.auth.user?.role === 'tecnico';
export const selectIsDespachante = (state) => state.auth.user?.role === 'despachante';
