import { baseApi } from './baseApi';

export const adminUsersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/admin/users - listar usuarios
    getUsersList: builder.query({
      query: ({ role = '', search = '', limit = 20, skip = 0 } = {}) => {
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (search) params.append('search', search);
        params.append('limit', limit);
        params.append('skip', skip);
        return `/admin/users/?${params.toString()}`;
      },
      providesTags: ['Users'],
    }),

    // GET /api/admin/users/:id - obtener usuario por ID
    getUserById: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),

    // PUT /api/admin/users/:id/role - cambiar rol de usuario
    changeUserRole: builder.mutation({
      query: ({ id, newRole, zone }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PUT',
        body: { newRole, zone },
      }),
      invalidatesTags: (result, error, { id }) => ['Users', 'UserStats', { type: 'Users', id }],
    }),

    // DELETE /api/admin/users/:id - desactivar usuario
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users', 'UserStats'],
    }),

    // GET /api/admin/users/roles/stats - estadísticas por rol
    getUsersStatsQuery: builder.query({
      query: () => '/admin/users/roles/stats',
      providesTags: ['UserStats'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetUsersListQuery,
  useGetUserByIdQuery,
  useChangeUserRoleMutation,
  useDeleteUserMutation,
  useGetUsersStatsQuery,
} = adminUsersApi;
