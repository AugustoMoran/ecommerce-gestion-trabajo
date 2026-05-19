import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart } from 'react-icons/hi';
import { formatCurrency } from '../../utils/formatCurrency';
import { getPriceByRole, getCurrencyByRole } from '../../utils/getPriceByRole';
import useCart from '../../hooks/useCart';
import { useToggleFavoriteMutation, useGetMeQuery } from '../../services/authApi';
import { useGetExchangeRateQuery } from '../../services/settingsApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const user = useSelector(selectCurrentUser);
  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const { data: rateData } = useGetExchangeRateQuery();
  const [toggleFavorite] = useToggleFavoriteMutation();

  const exchangeRate = rateData?.rate || 1000;
  const isFavorite = me?.favoritos?.includes(product._id);
  const image = product.imagenes?.[0]?.url || 'https://via.placeholder.com/400x400?text=Sin+imagen';
  const currency = getCurrencyByRole(user?.role);
  
  // Usar función para obtener precio según rol CON conversión
  const displayPrice = getPriceByRole(product, user?.role, exchangeRate);

  const handleFavorite = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Iniciá sesión para agregar favoritos'); return; }
    try {
      await toggleFavorite(product._id).unwrap();
    } catch (_) {}
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  return (
    <Link to={`/productos/${product._id}`} className="card group cursor-pointer animate-fade-in">
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-gray-900">
        <img
          src={image}
          alt={product.nombre}
          loading="lazy"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">Sin stock</span>
          </div>
        )}
        {/* Hover actions */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shadow-lg"
          >
            <HiOutlineShoppingCart size={14} />
            Agregar
          </button>
        </div>
        {/* Favorite */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 w-8 h-8 bg-primary-400 rounded-full shadow flex items-center justify-center transition-all hover:scale-110 text-white"
        >
          {isFavorite ? (
            <HiHeart size={16} className="text-red-500" />
          ) : (
            <HiOutlineHeart size={16} className="text-gray-500" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-1 truncate">{product.categoria?.nombre}</p>
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-100 group-hover:text-primary-400 transition-colors">
          {product.nombre}
        </h3>
        <div className="flex items-baseline gap-1.5">
          <span className="font-bold text-lg text-white">{formatCurrency(displayPrice, currency)}</span>
          <span className="text-xs font-semibold text-white bg-gray-700 px-1.5 py-0.5 rounded">
            {currency}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
