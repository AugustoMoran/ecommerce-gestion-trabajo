import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const recommendationApi = createApi({
  reducerPath: 'recommendationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/admin/recommendations',
    credentials: 'include',
  }),

  tagTypes: ['Recommendations', 'ClientRecommendations'],

  endpoints: (builder) => ({
    // GET /api/admin/recommendations - listar recomendaciones (admin)
    getRecommendations: builder.query({
      query: ({ limit = 20, skip = 0 } = {}) =>
        `/?limit=${limit}&skip=${skip}`,
      providesTags: ['Recommendations'],
    }),

    // POST /api/admin/recommendations - crear recomendación (admin)
    createRecommendation: builder.mutation({
      query: (data) => ({
        url: '/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Recommendations', 'ClientRecommendations'],
    }),

    // GET /api/recommendations/client - ver mis recomendaciones (cliente)
    getMyRecommendations: builder.query({
      query: () => '/client',
      providesTags: ['ClientRecommendations'],
    }),

    // DELETE /api/recommendations/:id - rechazar recomendación (cliente)
    rejectRecommendation: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ClientRecommendations'],
    }),

    // PUT /api/admin/recommendations/:id/viewed - marcar como visto (admin)
    markAsViewed: builder.mutation({
      query: (id) => ({
        url: `/${id}/viewed`,
        method: 'PUT',
      }),
      invalidatesTags: ['Recommendations'],
    }),
  }),
});

export const {
  useGetRecommendationsQuery,
  useCreateRecommendationMutation,
  useGetMyRecommendationsQuery,
  useRejectRecommendationMutation,
  useMarkAsViewedMutation,
} = recommendationApi;
