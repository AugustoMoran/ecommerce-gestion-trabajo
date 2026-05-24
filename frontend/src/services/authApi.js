import { baseApi, setMemoryToken, clearMemoryToken } from './baseApi';
import { setCredentials, logout } from '../features/auth/authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (data) => ({ url: '/auth/register', method: 'POST', body: data }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Guardar token en memoria Y en Redux (para cross-domain Vercel → Render)
          if (data.accessToken) {
            setMemoryToken(data.accessToken);
          }
          dispatch(setCredentials({ 
            user: data.user,
            accessToken: data.accessToken 
          }));
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
          // Guardar token en memoria Y en Redux (para cross-domain Vercel → Render)
          if (data.accessToken) {
            setMemoryToken(data.accessToken);
          }
          dispatch(setCredentials({ 
            user: data.user,
            accessToken: data.accessToken 
          }));
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
          clearMemoryToken();
          dispatch(logout());
        } catch {
          clearMemoryToken();
          dispatch(logout());
        }
      },
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
      transformResponse: (response) => {
        // Capture token before it's stored in cache
        if (response?.accessToken) {
          setMemoryToken(response.accessToken);
        }
        // Return response without accessToken so Redux only stores user data
        const { accessToken, ...userData } = response;
        return userData;
      },
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
