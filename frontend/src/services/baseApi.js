import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../features/auth/authSlice';

// Determinar URL base en tiempo de EJECUCIÓN verificando el hostname
// No usar import.meta.env.DEV porque puede no compilarse correctamente en Vercel
const getBaseUrl = () => {
  try {
    // En desarrollo local
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api';
    }
    
    // En producción (cualquier hostname que no sea localhost)
    // Render backend está en https://ecommerce-gestion-trabajo.onrender.com
    return 'https://ecommerce-gestion-trabajo.onrender.com/api';
  } catch (e) {
    // Fallback en SSR o si window no está disponible
    return 'https://ecommerce-gestion-trabajo.onrender.com/api';
  }
};

const BASE_URL = getBaseUrl();

console.log('🔧 BaseApi configured with URL:', BASE_URL);

// Store token in memory (perdido al recargar, es seguro)
let accessToken = null;

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include', // Intenta enviar cookies
  prepareHeaders: (headers, { getState }) => {
    // Obtener token del Redux store primero (persiste entre reloads)
    const state = getState();
    let token = state?.auth?.accessToken;
    
    // Fallback: intentar desde sessionStorage (más seguro que localStorage, se borra al cerrar)
    if (!token) {
      token = sessionStorage.getItem('_auth_token');
    }
    
    // Fallback final: usar token en memoria
    if (!token) {
      token = accessToken;
    }
    
    // FALLBACK: Si no hay cookie, usar token en memoria + Authorization header
    // Esto es necesario para cross-domain (www.sausansystem.com.ar → ecommerce-gestion-trabajo.onrender.com)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('✅ Sending Authorization header with token');
    } else {
      console.warn('⚠️ No token found - request may fail with 401');
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
      // Guardar nuevo token en memoria Y en Redux
      if (refreshResult.data.accessToken) {
        setMemoryToken(refreshResult.data.accessToken);
        // También actualizar en Redux
        const state = api.getState();
        if (refreshResult.data.user) {
          api.dispatch(setCredentials({ 
            user: refreshResult.data.user,
            accessToken: refreshResult.data.accessToken 
          }));
        } else {
          // Si no viene usuario, al menos actualizar el token
          api.dispatch(setCredentials({ 
            user: state.auth.user,
            accessToken: refreshResult.data.accessToken 
          }));
        }
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

// Export baseQueryWithReauth for other APIs to use
export { baseQueryWithReauth };

// Exportar función para actualizar token en memoria
export const setMemoryToken = (token) => {
  accessToken = token;
  // También guardar en sessionStorage para usar en requests después de recargar
  // SessionStorage es más seguro que localStorage - se borra al cerrar la pestaña
  if (token) {
    sessionStorage.setItem('_auth_token', token);
    sessionStorage.setItem('quoteToken', token);
  }
};

export const getMemoryToken = () => {
  // Intentar obtener del memory primero, luego del sessionStorage
  return accessToken || sessionStorage.getItem('quoteToken');
};

export const clearMemoryToken = () => {
  accessToken = null;
  sessionStorage.removeItem('_auth_token');
  sessionStorage.removeItem('quoteToken');
};
