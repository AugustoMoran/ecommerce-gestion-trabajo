import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useGetProductsQuery } from '../../services/productsApi';
import { useGetUsersListQuery } from '../../services/adminUsersApi';
import toast from 'react-hot-toast';

const AdminRecomendaciones = () => {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [message, setMessage] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const clientSearchRef = useRef(null);

  // Queries
  const { data: productsList = { products: [] }, isLoading: productsLoading } = useGetProductsQuery({ limit: 100 });
  const { data: usersList = { users: [] }, isLoading: usersLoading } = useGetUsersListQuery({ search: clientSearch, limit: 100 });

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products
  const filteredProducts = productsList.products?.filter(p =>
    p.nombre?.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  const handleSelectProduct = (productId) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(id => id !== productId));
  };

  const handleCreateRecommendation = async () => {
    if (!selectedClient || selectedProducts.length === 0) {
      toast.error('Selecciona un cliente y al menos un producto');
      return;
    }

    try {
      toast.success('Recomendación creada exitosamente');
      setSelectedClient('');
      setSelectedProducts([]);
      setMessage('');
    } catch (error) {
      toast.error('Error al crear recomendación');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Recomendaciones de Productos</h1>
          <p className="text-gray-400 mt-2">Envía recomendaciones personalizadas a clientes</p>
        </div>

      {/* Create Recommendation */}
      <div className="bg-gray-900 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-100">Nueva Recomendación</h2>

        {/* Client Selection with Autocomplete */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Cliente</label>
          <div className="relative" ref={clientSearchRef}>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value);
                setShowClientSuggestions(true);
              }}
              onFocus={() => setShowClientSuggestions(true)}
              className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100"
            />
            
            {/* Suggestions Dropdown */}
            {showClientSuggestions && clientSearch && (
              <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {usersLoading ? (
                  <div className="px-4 py-3 text-gray-400 text-sm">Cargando usuarios...</div>
                ) : usersList?.users?.length > 0 ? (
                  usersList.users.map(user => (
                    <div
                      key={user._id}
                      onClick={() => {
                        setSelectedClient(user._id);
                        setClientSearch(`${user.nombre} ${user.apellido}`);
                        setShowClientSuggestions(false);
                      }}
                      className="px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                    >
                      <p className="font-medium text-gray-100">{user.nombre} {user.apellido}</p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-400 text-sm">No se encontraron usuarios</div>
                )}
              </div>
            )}

            {/* Selected Client Display */}
            {selectedClient && (
              <div className="mt-2 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                {usersList?.users?.find(u => u._id === selectedClient) && (
                  <div>
                    <p className="font-medium text-blue-300">
                      {usersList.users.find(u => u._id === selectedClient).nombre} {usersList.users.find(u => u._id === selectedClient).apellido}
                    </p>
                    <p className="text-sm text-blue-400">{usersList.users.find(u => u._id === selectedClient).email}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedClient('');
                    setClientSearch('');
                  }}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Cambiar cliente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Productos</label>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-700 rounded-lg mb-3 bg-gray-800 text-gray-100"
          />
          {productsLoading ? (
            <div className="text-center py-4 text-gray-400">Cargando productos...</div>
          ) : filteredProducts?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleSelectProduct(product._id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedProducts.includes(product._id)
                      ? 'border-blue-400 bg-blue-900'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <p className="font-medium truncate text-gray-100">{product.nombre}</p>
                  <p className="text-sm text-gray-400">${product.priceUSD}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">No hay productos disponibles</div>
          )}
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="font-medium mb-3 text-gray-100">Productos Seleccionados ({selectedProducts.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((productId) => {
                const product = productsList.products?.find(p => p._id === productId);
                return (
                  <div key={productId} className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg shadow">
                    <span className="text-gray-200">{product?.nombre}</span>
                    <button
                      onClick={() => handleRemoveProduct(productId)}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Mensaje (opcional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mensaje personalizado para el cliente..."
            className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100"
            rows="4"
          />
          <p className="text-sm text-gray-400 mt-1">{message.length}/500</p>
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateRecommendation}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          Enviar Recomendación
        </button>
      </div>

      {/* Recommendations List */}
      <div className="bg-gray-900 rounded-lg shadow p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 text-gray-100">Historial de Recomendaciones</h2>
        <div className="text-center py-8 text-gray-400">
          Las recomendaciones aparecerán aquí
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRecomendaciones;
