import { useState, useEffect } from 'react';
import { useCreateQuoteMutation, useUpdateQuoteMutation } from '../../services/quotesApi';
import { useGetProductsQuery } from '../../services/productsApi';
import { useGetUsersListQuery } from '../../services/adminUsersApi';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiX } from 'react-icons/hi';

const QuoteForm = ({ quote, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Búsqueda y selección de productos (estilo carrito)
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Moneda y tasa de conversión
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1000); // ARS por USD

  const [createQuote] = useCreateQuoteMutation();
  const [updateQuote] = useUpdateQuoteMutation();
  const { data: productsData = {} } = useGetProductsQuery({ limit: 10000, page: 1 }, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const { data: usersData = { users: [] } } = useGetUsersListQuery({ limit: 10000, skip: 0 }, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  
  const products = productsData?.products || [];
  const users = usersData?.users || [];
  const clients = users.filter(u => u.role === 'user');

  const [formData, setFormData] = useState({
    clientId: quote?.client._id || '',
    items: quote?.items || [],
    instalacion: quote?.instalacion || { incluye: false, monto: 0, descripcion: '' },
    notas: quote?.notas || '',
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { producto: '', nombre: '', cantidad: 1, precioUnitario: 0 }],
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSelectProduct = (product) => {
    // Buscar precio en cualquier campo disponible
    const precioFinal = product.precioOferta ?? product.precio ?? product.priceOfferUSD ?? product.priceUSD ?? product.priceOfferPesos ?? product.pricePesos ?? 0;
    setSelectedProduct(product);
    setTempPrice(precioFinal);
    setProductSearch(product.nombre);
    setShowProductDropdown(false);
  };

  const handleAddProductToList = () => {
    if (!selectedProduct) {
      toast.error('Selecciona un producto');
      return;
    }

    if (!tempPrice || tempPrice <= 0) {
      toast.error('Ingresa un precio válido');
      return;
    }

    const newItem = {
      producto: selectedProduct._id,
      nombre: selectedProduct.nombre,
      cantidad: parseInt(tempQuantity) || 1,
      precioUnitario: parseFloat(tempPrice),
      currency: selectedCurrency, // USD o ARS
      exchangeRate: exchangeRate,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });

    // Limpiar todo
    setProductSearch('');
    setSelectedProduct(null);
    setTempQuantity(1);
    setTempPrice(0);
    toast.success('Producto agregado');
  };

  const calculateTotals = () => {
    // Agrupar por moneda
    const byCurrency = { USD: 0, ARS: 0 };
    
    formData.items.forEach(item => {
      const currency = item.currency || 'USD';
      byCurrency[currency] = (byCurrency[currency] || 0) + item.cantidad * item.precioUnitario;
    });

    const totalProducts = Object.values(byCurrency).reduce((a, b) => a + b, 0);
    const instalacion = formData.instalacion.incluye ? formData.instalacion.monto : 0;
    
    return {
      byCurrency,
      totalProducts,
      instalacion,
      total: totalProducts + instalacion,
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast.error('Selecciona un cliente');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    setIsSubmitting(true);
    try {
      if (quote) {
        await updateQuote({ id: quote._id, ...formData }).unwrap();
        toast.success('Presupuesto actualizado');
      } else {
        await createQuote(formData).unwrap();
        toast.success('Presupuesto creado');
      }
      onSuccess();
    } catch (error) {
      toast.error(error?.data?.message || 'Error al guardar presupuesto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-100">{quote ? 'Editar Presupuesto' : 'Crear Presupuesto'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl transition-colors"
          >
            <HiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cliente con Búsqueda */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Cliente *</label>
            <div className="relative">
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2">
                <HiOutlineSearch className="text-gray-500" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Buscar cliente por nombre o email..."
                  className="flex-1 bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none"
                />
              </div>
              
              {showClientDropdown && (
                <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-lg mt-1 max-h-40 overflow-y-auto z-10">
                  {clients
                    .filter(c => 
                      !clientSearch ||
                      c.nombre?.toLowerCase().includes(clientSearch.toLowerCase()) ||
                      c.email?.toLowerCase().includes(clientSearch.toLowerCase())
                    )
                    .slice(0, clientSearch ? 100 : 12)
                    .map(c => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, clientId: c._id });
                          setClientSearch(c.nombre);
                          setShowClientDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 border-b border-gray-700 last:border-0"
                      >
                        <div className="font-medium text-gray-200">{c.nombre}</div>
                        <div className="text-xs text-gray-500">{c.email}</div>
                      </button>
                    ))}
                </div>
              )}

              {formData.clientId && (
                <div className="mt-1 text-xs text-green-400">
                  ✓ Cliente seleccionado: {clientSearch}
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Productos *</label>

            {/* Búsqueda y Selección de Productos */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
              {/* Selector de Moneda Simple */}
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('USD')}
                  className={`py-1 px-3 rounded text-sm font-medium transition-colors ${
                    selectedCurrency === 'USD'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('ARS')}
                  className={`py-1 px-3 rounded text-sm font-medium transition-colors ${
                    selectedCurrency === 'ARS'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ARS
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <div className="flex items-center bg-gray-700 border border-gray-600 rounded px-2">
                    <HiOutlineSearch className="text-gray-500" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setSelectedProduct(null);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder="Buscar producto..."
                      className="flex-1 bg-gray-700 border-0 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                  
                  {showProductDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded mt-1 max-h-40 overflow-y-auto z-10">
                      {products
                        .filter(p => !productSearch || p.nombre?.toLowerCase().includes(productSearch.toLowerCase()))
                        .slice(0, productSearch ? 100 : 12)
                        .map(p => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => handleSelectProduct(p)}
                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-gray-700 border-b border-gray-700 last:border-0 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <span>{p.nombre}</span>
                              <span className="text-xs text-gray-400">
                                ${(p.precioOferta ?? p.precio ?? p.priceOfferUSD ?? p.priceUSD ?? p.priceOfferPesos ?? p.pricePesos ?? 0).toFixed(2)}
                              </span>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedProduct && (
                <div className="bg-gray-700 p-3 rounded mb-3 border border-gray-600">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-semibold text-gray-100">{selectedProduct.nombre}</div>
                  </div>
                  
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-300 mb-1 block">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={tempQuantity}
                        onChange={(e) => setTempQuantity(parseInt(e.target.value) || 1)}
                        placeholder="1"
                        className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <label className="text-xs text-gray-300 mb-1 block">Precio ({selectedCurrency})</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddProductToList}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                  >
                    ✓ Agregar
                  </button>
                </div>
              )}
            </div>

            {/* Lista de Productos Agregados */}
            {formData.items.length > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700 border-b border-gray-600">
                    <tr>
                      <th className="text-left px-4 py-2 text-gray-300">Producto</th>
                      <th className="text-center px-2 py-2 text-gray-300">Cantidad</th>
                      <th className="text-right px-2 py-2 text-gray-300">P. Unitario</th>
                      <th className="text-right px-2 py-2 text-gray-300">Subtotal</th>
                      <th className="text-center px-2 py-2 text-gray-300">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-2 text-gray-200">{item.nombre}</td>
                        <td className="text-center px-2 py-2 text-gray-300">{item.cantidad}</td>
                        <td className="text-right px-2 py-2 text-gray-300">
                          ${item.precioUnitario?.toFixed(2) || '0.00'} {item.currency || 'USD'}
                        </td>
                        <td className="text-right px-2 py-2 font-semibold text-green-400">
                          ${(item.cantidad * item.precioUnitario)?.toFixed(2) || '0.00'} {item.currency || 'USD'}
                        </td>
                        <td className="text-center px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <HiX size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {formData.items.length === 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center text-gray-400">
                Busca y agrega productos para crear el presupuesto
              </div>
            )}
          </div>

          {/* Instalación */}
          <div className="border border-gray-600 rounded-lg p-4 bg-gray-800">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={formData.instalacion.incluye}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    instalacion: { ...formData.instalacion, incluye: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-600 cursor-pointer"
              />
              <span className="font-medium text-gray-300">Incluir Instalación</span>
            </label>

            {formData.instalacion.incluye && (
              <div className="space-y-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.instalacion.monto === 0 ? '' : formData.instalacion.monto}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      instalacion: {
                        ...formData.instalacion,
                        monto: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="Monto de instalación"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <textarea
                  value={formData.instalacion.descripcion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      instalacion: {
                        ...formData.instalacion,
                        descripcion: e.target.value,
                      },
                    })
                  }
                  placeholder="Descripción de la instalación"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Notas Internas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Notas visibles solo para el admin..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          {/* Totales Preview */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-4 border border-blue-700">
            {totals.byCurrency.USD > 0 && (
              <div className={totals.byCurrency.ARS > 0 ? "mb-4 pb-4 border-b border-blue-600" : ""}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Subtotal USD:</span>
                  <span className="font-medium text-gray-100">${totals.byCurrency.USD.toFixed(2)}</span>
                </div>
                {formData.instalacion.incluye && totals.byCurrency.ARS === 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Instalación:</span>
                    <span className="font-medium text-gray-100">${totals.instalacion.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span className="text-gray-200">{totals.byCurrency.ARS > 0 ? "Total USD:" : "Total Final:"}</span>
                  <span className="text-green-400">
                    ${(totals.byCurrency.USD + (formData.instalacion.incluye && totals.byCurrency.ARS === 0 ? totals.instalacion : 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            {totals.byCurrency.ARS > 0 && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Subtotal ARS:</span>
                  <span className="font-medium text-gray-100">${totals.byCurrency.ARS.toFixed(2)}</span>
                </div>
                {formData.instalacion.incluye && totals.byCurrency.USD === 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Instalación:</span>
                    <span className="font-medium text-gray-100">${totals.instalacion.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span className="text-gray-200">{totals.byCurrency.USD > 0 ? "Total ARS:" : "Total Final:"}</span>
                  <span className="text-green-400">
                    ${(totals.byCurrency.ARS + (formData.instalacion.incluye && totals.byCurrency.USD === 0 ? totals.instalacion : 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Presupuesto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-600 text-gray-300 hover:bg-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuoteForm;
