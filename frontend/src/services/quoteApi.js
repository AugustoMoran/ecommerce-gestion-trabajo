import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const quoteApi = createApi({
  reducerPath: 'quoteApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/quote',
    credentials: 'include',
  }),

  tagTypes: ['Quote'],

  endpoints: (builder) => ({
    // GET /api/quote - obtener cotización actual (público)
    getCurrentQuote: builder.query({
      query: () => '/',
      providesTags: ['Quote'],
    }),

    // PUT /api/admin/quote/update - actualizar cotización
    updateQuote: builder.mutation({
      query: (data) => ({
        url: '/update',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Quote'],
    }),

    // GET /api/admin/quote/history - historial de cotizaciones
    getQuoteHistory: builder.query({
      query: ({ limit = 20, skip = 0 } = {}) =>
        `/history?limit=${limit}&skip=${skip}`,
      providesTags: ['Quote'],
    }),

    // GET /api/admin/quote/stats - estadísticas de cotización
    getQuoteStats: builder.query({
      query: () => '/stats',
      providesTags: ['Quote'],
    }),
  }),
});

export const {
  useGetCurrentQuoteQuery,
  useUpdateQuoteMutation,
  useGetQuoteHistoryQuery,
  useGetQuoteStatsQuery,
} = quoteApi;
