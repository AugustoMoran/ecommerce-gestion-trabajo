import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAdmin } from './features/auth/authSlice';
import { useGetCartQuery } from './services/cartApi';
import { setItems } from './features/cart/cartSlice';
import useAuthInit from './hooks/useAuthInit';
import Layout from './components/layout/Layout';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const Favorites = lazy(() => import('./pages/Favorites'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductsAdmin = lazy(() => import('./pages/admin/ProductsAdmin'));
const CategoriesAdmin = lazy(() => import('./pages/admin/CategoriesAdmin'));
const OrdersAdmin = lazy(() => import('./pages/admin/OrdersAdmin'));
const DeliveryAdmin = lazy(() => import('./pages/admin/DeliveryAdmin'));
const JobsAdmin = lazy(() => import('./pages/admin/JobsAdmin'));
const CouponsAdmin = lazy(() => import('./pages/admin/CouponsAdmin'));
const CloudinaryAdmin = lazy(() => import('./pages/admin/CloudinaryAdmin'));
const BannersAdmin = lazy(() => import('./pages/admin/BannersAdmin'));
const PopupAdmin = lazy(() => import('./pages/admin/PopupAdmin'));
const AdminCotizacion = lazy(() => import('./pages/admin/AdminCotizacion'));
const AdminUsuarios = lazy(() => import('./pages/admin/AdminUsuarios'));
const AdminRecomendaciones = lazy(() => import('./pages/admin/AdminRecomendaciones'));
const AdminQuotes = lazy(() => import('./pages/admin/AdminQuotes'));
const MyQuotes = lazy(() => import('./pages/MyQuotes'));

// Tecnico pages
const TecnicoDashboard = lazy(() => import('./pages/tecnico/TecnicoDashboard'));
const BolsaTrabajosPage = lazy(() => import('./pages/tecnico/BolsaTrabajosPage'));
const MisTrabajosPage = lazy(() => import('./pages/tecnico/MisTrabajosPage'));

// Despachante pages
const DespachanteDashboard = lazy(() => import('./pages/despachante/DespachanteDashboard'));
const DespachanteBolsaTrabajos = lazy(() => import('./pages/despachante/DespachanteBolsaTrabajos'));

// Guards
const ProtectedRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthInitialized = useSelector(state => state.auth.isAuthInitialized);
  
  if (!isAuthInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[100vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const isAdmin = useSelector(selectIsAdmin);
  const isAuthInitialized = useSelector(state => state.auth.isAuthInitialized);
  
  if (!isAuthInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[100vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  
  return isAdmin ? children : <Navigate to="/" replace />;
};

const TecnicoRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthInitialized = useSelector(state => state.auth.isAuthInitialized);
  
  // While auth is being initialized, show loading
  if (!isAuthInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[100vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  
  // After initialization, check role
  return user && user.role === 'tecnico' ? children : <Navigate to="/" replace />;
};

const DespachantRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const isAuthInitialized = useSelector(state => state.auth.isAuthInitialized);
  
  // While auth is being initialized, show loading
  if (!isAuthInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[100vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  
  // After initialization, check role
  return user && user.role === 'despachante' ? children : <Navigate to="/" replace />;
};

const GuestRoute = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  return !user ? children : <Navigate to="/" replace />;
};

const Loading = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
  </div>
);

const CartInitializer = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const { data } = useGetCartQuery(undefined, { skip: !user });
  useEffect(() => {
    if (data?.items) dispatch(setItems(data.items));
  }, [data, dispatch]);
  return null;
};

const AuthInitializer = () => {
  useAuthInit();
  return null;
};

const App = () => (
  <Suspense fallback={<Loading />}>
    <AuthInitializer />
    <CartInitializer />
    <Routes>
      {/* Public routes with layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/productos" element={<Products />} />
        <Route path="/productos/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orden/confirmacion" element={<OrderConfirmation />} />

        {/* Auth routes (guests only) */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/registro" element={<GuestRoute><Register /></GuestRoute>} />

        {/* Protected user routes */}
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/mis-ordenes" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/favoritos" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/mis-presupuestos" element={<ProtectedRoute><MyQuotes /></ProtectedRoute>} />
      </Route>

      {/* Admin routes (no Layout wrapper — AdminLayout is self-contained) */}
      <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/admin/productos" element={<AdminRoute><ProductsAdmin /></AdminRoute>} />
      <Route path="/admin/categorias" element={<AdminRoute><CategoriesAdmin /></AdminRoute>} />
      <Route path="/admin/ordenes" element={<AdminRoute><OrdersAdmin /></AdminRoute>} />
      <Route path="/admin/despacho" element={<AdminRoute><DeliveryAdmin /></AdminRoute>} />
      <Route path="/admin/trabajos" element={<AdminRoute><JobsAdmin /></AdminRoute>} />
      <Route path="/admin/cupones" element={<AdminRoute><CouponsAdmin /></AdminRoute>} />
      <Route path="/admin/cloudinary" element={<AdminRoute><CloudinaryAdmin /></AdminRoute>} />
      <Route path="/admin/banners" element={<AdminRoute><BannersAdmin /></AdminRoute>} />
      <Route path="/admin/popup" element={<AdminRoute><PopupAdmin /></AdminRoute>} />
      <Route path="/admin/cotizacion" element={<AdminRoute><AdminCotizacion /></AdminRoute>} />
      <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuarios /></AdminRoute>} />
      <Route path="/admin/recomendaciones" element={<AdminRoute><AdminRecomendaciones /></AdminRoute>} />
      <Route path="/admin/presupuestos" element={<AdminRoute><AdminQuotes /></AdminRoute>} />

      {/* Tecnico routes (no Layout wrapper — TecnicoLayout is self-contained) */}
      <Route path="/tecnico" element={<TecnicoRoute><TecnicoDashboard /></TecnicoRoute>} />
      <Route path="/tecnico/bolsa" element={<TecnicoRoute><BolsaTrabajosPage /></TecnicoRoute>} />
      <Route path="/tecnico/mis-trabajos" element={<TecnicoRoute><MisTrabajosPage /></TecnicoRoute>} />

      {/* Despachante routes (no Layout wrapper — DespachanteLayout is self-contained) */}
      <Route path="/despachante" element={<DespachantRoute><DespachanteDashboard /></DespachantRoute>} />
      <Route path="/despachante/bolsa" element={<DespachantRoute><DespachanteBolsaTrabajos /></DespachantRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default App;
