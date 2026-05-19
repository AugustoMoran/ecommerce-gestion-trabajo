import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../features/auth/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include', // HttpOnly cookies sent automatically by browser
  prepareHeaders: (headers) => {
    // NO Authorization header needed - tokens in HttpOnly cookies only
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Try to refresh tokens using HttpOnly cookies
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Backend automatically updated HttpOnly cookies
      // Just retry the original request
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed - user must login again
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
