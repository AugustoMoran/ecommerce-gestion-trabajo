import { baseApi } from './baseApi';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExchangeRate: builder.query({
      query: () => '/settings/exchange-rate',
      refetchOnFocus: true,
      refetchOnReconnect: true,
      providesTags: ['ExchangeRate'],
    }),
    updateExchangeRate: builder.mutation({
      query: (rate) => ({
        url: '/settings/exchange-rate',
        method: 'PATCH',
        body: { rate },
      }),
      invalidatesTags: ['ExchangeRate'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetExchangeRateQuery,
  useUpdateExchangeRateMutation,
} = settingsApi;
