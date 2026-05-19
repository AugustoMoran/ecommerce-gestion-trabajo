import { baseApi } from './baseApi';

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /api/location/validate
     * Valida si una dirección está en CABA/AMBA
     */
    validateLocation: builder.mutation({
      query: (direccion) => ({
        url: '/location/validate',
        method: 'POST',
        body: { direccion },
      }),
    }),

    /**
     * GET /api/location/check-installation-available
     * Verifica si instalación está disponible en una ubicación
     */
    checkInstallationAvailable: builder.query({
      query: (direccion) => ({
        url: '/location/check-installation-available',
        params: { direccion },
      }),
    }),
  }),
});

export const {
  useValidateLocationMutation,
  useCheckInstallationAvailableQuery,
} = locationApi;
