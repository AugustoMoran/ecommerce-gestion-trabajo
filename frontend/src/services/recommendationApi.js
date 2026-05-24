import { baseApi } from './baseApi';

export const recommendationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/admin/recommendations - listar recomendaciones (admin)
    getRecommendations: builder.query({
      query: ({ limit = 20, skip = 0 } = {}) =>
        `/admin/recommendations?limit=${limit}&skip=${skip}`,
      providesTags: ['Recommendations'],
    }),

    // POST /api/admin/recommendations - crear recomendación (admin)
    createRecommendation: builder.mutation({
      query: (data) => ({
        url: '/admin/recommendations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Recommendations', 'ClientRecommendations'],
    }),

    // GET /api/recommendations - ver mis recomendaciones (cliente)
    getMyRecommendations: builder.query({
      query: () => '/recommendations',
      providesTags: ['ClientRecommendations'],
    }),

    // DELETE /api/recommendations/:id - rechazar recomendación (cliente)
    rejectRecommendation: builder.mutation({
      query: (id) => ({
        url: `/recommendations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ClientRecommendations'],
    }),

    // PUT /api/recommendations/:id/viewed - marcar como visto (cliente)
    markAsViewed: builder.mutation({
      query: (id) => ({
        url: `/recommendations/${id}/viewed`,
        method: 'PUT',
      }),
      invalidatesTags: ['ClientRecommendations'],
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
