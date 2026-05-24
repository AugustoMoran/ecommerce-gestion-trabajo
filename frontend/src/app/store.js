import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../services/baseApi';
import { quoteApi } from '../services/quoteApi';
import { quotesApi } from '../services/quotesApi';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import uiReducer from '../features/ui/uiSlice';

const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [quoteApi.reducerPath]: quoteApi.reducer,
    [quotesApi.reducerPath]: quotesApi.reducer,
    auth: authReducer,
    cart: cartReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(baseApi.middleware)
      .concat(quoteApi.middleware)
      .concat(quotesApi.middleware),
});

export default store;
