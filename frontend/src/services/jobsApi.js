import { baseApi } from './baseApi';

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all jobs (for admin listing)
    getAllJobs: builder.query({
      query: ({ status = '', page = 1, limit = 10 } = {}) => {
        return {
          url: '/jobs',
          params: { status: status || undefined },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Job', id: _id })),
              { type: 'Job', id: 'LIST' },
            ]
          : [{ type: 'Job', id: 'LIST' }],
    }),

    // Get open jobs (bolsa de trabajo for technicians)
    getOpenJobs: builder.query({
      query: () => '/jobs/bolsa/open',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Job', id: _id })),
              { type: 'Job', id: 'OPEN' },
            ]
          : [{ type: 'Job', id: 'OPEN' }],
    }),

    // Get technician's jobs
    getMyJobs: builder.query({
      query: () => '/jobs/my/jobs',
      providesTags: (result) =>
        result
          ? [
              ...Object.values(result)
                .flat()
                .map(({ _id }) => ({ type: 'Job', id: _id })),
              { type: 'Job', id: 'MY' },
            ]
          : [{ type: 'Job', id: 'MY' }],
    }),

    // Get single job
    getJobById: builder.query({
      query: (id) => `/jobs/${id}`,
      providesTags: (result, error, id) => [{ type: 'Job', id }],
    }),

    // Create job (admin only)
    createJob: builder.mutation({
      query: (body) => ({
        url: '/jobs',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),

    // Update job (admin only)
    updateJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/jobs/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Job', id }, { type: 'Job', id: 'LIST' }],
    }),

    // Delete job (admin only)
    deleteJob: builder.mutation({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),

    // Take job (claim slots) - technician
    takeJob: builder.mutation({
      query: ({ id, slots = 1 }) => ({
        url: `/jobs/${id}/take`,
        method: 'POST',
        body: { slots },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'OPEN' },
        { type: 'Job', id: 'MY' },
      ],
    }),

    // Start job - technician
    startJob: builder.mutation({
      query: (id) => ({
        url: `/jobs/${id}/start`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Job', id }, { type: 'Job', id: 'MY' }],
    }),

    // Finalize job - technician
    finalizeJob: builder.mutation({
      query: ({ id, observations = '', photos = [] }) => ({
        url: `/jobs/${id}/finalize`,
        method: 'POST',
        body: { observations, photos },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Job', id }, { type: 'Job', id: 'MY' }],
    }),

    // Abandon job - technician (remove self and restore cupo)
    abandonJob: builder.mutation({
      query: (id) => ({
        url: `/jobs/${id}/abandon`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Job', id },
        { type: 'Job', id: 'OPEN' },
        { type: 'Job', id: 'MY' },
      ],
    }),

    // Assign technician - admin
    assignTechnician: builder.mutation({
      query: ({ id, technicianId }) => ({
        url: `/jobs/${id}/assign`,
        method: 'POST',
        body: { technicianId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
        { type: 'Job', id: 'OPEN' },
      ],
    }),

    // Remove technician - admin
    removeTechnician: builder.mutation({
      query: ({ id, technicianId }) => ({
        url: `/jobs/${id}/unassign`,
        method: 'POST',
        body: { technicianId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Job', id },
        { type: 'Job', id: 'LIST' },
        { type: 'Job', id: 'OPEN' },
      ],
    }),
  }),
});

export const {
  useGetAllJobsQuery,
  useGetOpenJobsQuery,
  useGetMyJobsQuery,
  useGetJobByIdQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useTakeJobMutation,
  useStartJobMutation,
  useFinalizeJobMutation,
  useAbandonJobMutation,
  useAssignTechnicianMutation,
  useRemoveTechnicianMutation,
} = jobsApi;
