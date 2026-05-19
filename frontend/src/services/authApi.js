import { baseApi } from './baseApi';
import { setCredentials, logout } from '../features/auth/authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => ({ url: '/auth/register', method: 'POST', body: data }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data.user }));
        } catch {
          // Component handles error display
        }
      },
    }),
    login: builder.mutation({
      query: (data) => ({ url: '/auth/login', method: 'POST', body: data }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ user: data.user }));
        } catch {
          // Component handles error display
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logout());
        } catch {
          dispatch(logout());
        }
      },
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({ url: '/users/profile', method: 'PUT', body: data }),
      invalidatesTags: ['User'],
    }),
    getFavorites: builder.query({
      query: () => '/users/favorites',
      providesTags: ['User'],
    }),
    toggleFavorite: builder.mutation({
      query: (productId) => ({ url: `/users/favorites/${productId}`, method: 'POST' }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useGetFavoritesQuery,
  useToggleFavoriteMutation,
} = authApi;
