import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  credentials: 'include',
});

export const quotesApi = createApi({
  reducerPath: 'quotesApi',
  baseQuery,
  tagTypes: ['Quote', 'MyQuotes', 'AllQuotes'],
  endpoints: (builder) => ({
    // Admin: crear presupuesto
    createQuote: builder.mutation({
      query: (quoteData) => ({
        url: '/quotes',
        method: 'POST',
        body: quoteData,
      }),
      invalidatesTags: ['AllQuotes'],
    }),

    // Admin: obtener todos los presupuestos
    getAllQuotes: builder.query({
      query: () => '/quotes/admin/all',
      providesTags: ['AllQuotes'],
    }),

    // Obtener presupuesto por ID
    getQuoteById: builder.query({
      query: (id) => `/quotes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Quote', id }],
    }),

    // Cliente: obtener mis presupuestos
    getMyQuotes: builder.query({
      query: () => '/quotes/mis-presupuestos',
      providesTags: ['MyQuotes'],
    }),

    // Admin: actualizar presupuesto
    updateQuote: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quotes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Quote', id }, 'AllQuotes'],
    }),

    // Admin: enviar presupuesto por email
    sendQuote: builder.mutation({
      query: (id) => ({
        url: `/quotes/${id}/enviar`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Quote', id }, 'AllQuotes'],
    }),

    // Descargar PDF
    downloadQuotePDF: builder.query({
      query: (id) => ({
        url: `/quotes/${id}/pdf`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Cliente: cambiar estado presupuesto
    updateQuoteStatus: builder.mutation({
      query: ({ id, estado }) => ({
        url: `/quotes/${id}/status`,
        method: 'PUT',
        body: { estado },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Quote', id }, 'MyQuotes'],
    }),

    // Admin: eliminar presupuesto
    deleteQuote: builder.mutation({
      query: (id) => ({
        url: `/quotes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AllQuotes'],
    }),
  }),
});

export const {
  useCreateQuoteMutation,
  useGetAllQuotesQuery,
  useGetQuoteByIdQuery,
  useGetMyQuotesQuery,
  useUpdateQuoteMutation,
  useSendQuoteMutation,
  useDownloadQuotePDFQuery,
  useUpdateQuoteStatusMutation,
  useDeleteQuoteMutation,
} = quotesApi;
