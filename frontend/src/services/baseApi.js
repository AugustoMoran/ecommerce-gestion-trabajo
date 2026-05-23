import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../features/auth/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Store token in memory (perdido al recargar, es seguro)
let accessToken = null;

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include', // Intenta enviar cookies
  prepareHeaders: (headers) => {
    // FALLBACK: Si no hay cookie, usar token en memoria + Authorization header
    // Esto es necesario para cross-domain (Hostinger → Render)
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Try to refresh tokens
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Guardar nuevo token en memoria
      if (refreshResult.data.accessToken) {
        setMemoryToken(refreshResult.data.accessToken);
      }
      // Backend automatically updated cookies
      // Just retry the original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed - user must login again
      accessToken = null;
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Product', 'Category', 'Order', 'Cart', 'User', 'Coupon', 'Upload', 'Banner', 'Popup', 'Job', 'ExchangeRate'],
  endpoints: () => ({}),
});

// Exportar función para actualizar token en memoria
export const setMemoryToken = (token) => {
  accessToken = token;
};

export const clearMemoryToken = () => {
  accessToken = null;
};
