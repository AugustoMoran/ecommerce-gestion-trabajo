import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const adminUsersApi = createApi({
  reducerPath: 'adminUsersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/admin/users',
    credentials: 'include',
  }),

  tagTypes: ['Users', 'UserStats'],

  endpoints: (builder) => ({
    // GET /api/admin/users - listar usuarios
    getUsersList: builder.query({
      query: ({ role = '', search = '', limit = 20, skip = 0 } = {}) => {
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (search) params.append('search', search);
        params.append('limit', limit);
        params.append('skip', skip);
        return `/?${params.toString()}`;
      },
      providesTags: ['Users'],
    }),

    // GET /api/admin/users/:id - obtener usuario por ID
    getUserById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),

    // PUT /api/admin/users/:id/role - cambiar rol de usuario
    changeUserRole: builder.mutation({
      query: ({ id, newRole, zone }) => ({
        url: `/${id}/role`,
        method: 'PUT',
        body: { newRole, zone },
      }),
      invalidatesTags: (result, error, { id }) => ['Users', 'UserStats', { type: 'Users', id }],
    }),

    // DELETE /api/admin/users/:id - desactivar usuario
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users', 'UserStats'],
    }),

    // GET /api/admin/users/roles/stats - estadísticas por rol
    getUsersStats: builder.query({
      query: () => '/roles/stats',
      providesTags: ['UserStats'],
    }),
  }),
});

export const {
  useGetUsersListQuery,
  useGetUserByIdQuery,
  useChangeUserRoleMutation,
  useDeleteUserMutation,
  useGetUsersStatsQuery,
} = adminUsersApi;
