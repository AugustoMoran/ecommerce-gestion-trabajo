import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetCategoriesQuery,
  useAddProductImageMutation,
  useRemoveProductImageMutation,
  useAddProductVideoMutation,
  useRemoveProductVideoMutation,
  useGetProductSuggestionsQuery,
} from '../../services/productsApi';
import { useGetExchangeRateQuery, useUpdateExchangeRateMutation } from '../../services/settingsApi';
import { useUploadImageMutation } from '../../services/cartApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { getPriceByRole } from '../../utils/getPriceByRole';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiX, HiOutlinePhotograph, HiOutlineSearch, HiOutlineRefresh, HiOutlineFilm } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';

const MAX_IMAGES = 7;

// Normalizar a strings para consistency (HTML input values son siempre strings)
const EMPTY = { 
  nombre: '', 
  descripcion: '', 
  priceUSD: '',
  pricePesos: '',
  stock: '', 
  categoria: '', 
  tags: '',
  hasInstallation: false,
  installationZones: ['AMBA', 'CABA']
};

const normalizeForm = (formData) => ({
  nombre: String(formData.nombre || ''),
  descripcion: String(formData.descripcion || ''),
  priceUSD: String(formData.priceUSD || ''),
  pricePesos: String(formData.pricePesos || ''),
  stock: String(formData.stock || ''),
  categoria: String(formData.categoria || ''),
  tags: String(formData.tags || ''),
  hasInstallation: Boolean(formData.hasInstallation || false),
  installationZones: Array.isArray(formData.installationZones) ? formData.installationZones : ['AMBA', 'CABA'],
});

const ProductsAdmin = () => {
  const [searchParams] = useSearchParams();
  const user = useSelector(selectCurrentUser);
  const { data: rateData, refetch: refetchRate } = useGetExchangeRateQuery();
  const [updateExchangeRate] = useUpdateExchangeRateMutation();
  const exchangeRate = rateData?.rate || 1000;
  const [showExchangeRateModal, setShowExchangeRateModal] = useState(false);
  const [newExchangeRate, setNewExchangeRate] = useState('');
  
  // Cuando se abre el modal, inicializar el input con el valor actual
  React.useEffect(() => {
    if (showExchangeRateModal) {
      setNewExchangeRate(String(exchangeRate || 1000));
    }
  }, [showExchangeRateModal, exchangeRate]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const sinStock = searchParams.get('sinStock') === '1';
  
  const { data, isLoading, refetch: refetchProducts } = useGetProductsQuery({ page, limit: 12, search: search || undefined, categoria: filterCat || undefined, sinStock: sinStock || undefined });
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: suggestions = [] } = useGetProductSuggestionsQuery(search);
  
  const [deleteProduct] = useDeleteProductMutation();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [addImage] = useAddProductImageMutation();
  const [removeImage] = useRemoveProductImageMutation();
  const [addVideo] = useAddProductVideoMutation();
  const [removeVideo] = useRemoveProductVideoMutation();
  const [uploadImage] = useUploadImageMutation();

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [newVideoFiles, setNewVideoFiles] = useState([]);
  const [newVideoPreviews, setNewVideoPreviews] = useState([]);
  const [restockId, setRestockId] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [nuevoColor, setNuevoColor] = useState({ nombre: '', codigo: '#000000', habilitado: true });

  const existingImages = editingProduct?.imagenes || [];
  const existingVideos = editingProduct?.videos || [];
  const totalImages = existingImages.length + newImagePreviews.length;
  const totalVideos = existingVideos.length + newVideoPreviews.length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - totalImages;
    const toAdd = files.slice(0, remaining);
    setNewImageFiles((prev) => [...prev, ...toAdd]);
    setNewImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVideos = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - totalVideos;
    const toAdd = files.slice(0, remaining);
    setNewVideoFiles((prev) => [...prev, ...toAdd]);
    setNewVideoPreviews((prev) => [...prev, ...toAdd.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))]);
    e.target.value = '';
  };

  const removeNewVideo = (index) => {
    setNewVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setNewVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingVideo = async (publicId) => {
    if (!editingProduct) return;
    try {
      await removeVideo({ id: editingProduct._id, publicId }).unwrap();
      setEditingProduct((prev) => ({ ...prev, videos: prev.videos.filter((vid) => vid.publicId !== publicId) }));
      toast.success('Video eliminado');
    } catch {
      toast.error('Error al eliminar video');
    }
  };

  const handleRemoveExistingImage = async (publicId) => {
    if (!editingProduct) return;
    try {
      await removeImage({ id: editingProduct._id, publicId }).unwrap();
      setEditingProduct((prev) => ({ ...prev, imagenes: prev.imagenes.filter((img) => img.publicId !== publicId) }));
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar imagen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      // Validar que los valores requeridos no sean vacíos
      if (!form.nombre.trim() || (!form.priceUSD && !form.pricePesos)) {
        toast.error('Nombre y al menos un precio (USD o ARS) son requeridos');
        setUploading(false);
        return;
      }

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        stock: Number(form.stock) || 0,
        categoria: form.categoria || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        priceUSD: form.priceUSD ? Number(form.priceUSD) : undefined,
        pricePesos: form.pricePesos ? Number(form.pricePesos) : undefined,
        hasInstallation: form.hasInstallation || false,
        installationZones: form.hasInstallation ? (form.installationZones || ['AMBA', 'CABA']) : [],
      };

      let productId = editing;
      if (editing) {
        await updateProduct({ id: editing, ...payload }).unwrap();
        toast.success('Producto actualizado');
      } else {
        const created = await createProduct(payload).unwrap();
        productId = created._id;
        toast.success('Producto creado');
      }
      
      for (const file of newImageFiles) {
        const fd = new FormData();
        fd.append('image', file);
        const { url, publicId } = await uploadImage(fd).unwrap();
        await addImage({ id: productId, url, publicId }).unwrap();
      }
      
      for (const file of newVideoFiles) {
        const fd = new FormData();
        fd.append('image', file); // Cloudinary acepta videos en el campo "image"
        const { url, publicId } = await uploadImage(fd).unwrap();
        await addVideo({ id: productId, url, publicId }).unwrap();
      }
      
      setForm(EMPTY);
      setEditing(null);
      setEditingProduct(null);
      setShowForm(false);
      setNewImageFiles([]);
      setNewImagePreviews([]);
      setNewVideoFiles([]);
      setNewVideoPreviews([]);
      setNuevoColor({ nombre: '', codigo: '#000000', habilitado: true });
    } catch (err) {
      const errorMessage = err?.data?.message || 
                          err?.status?.message || 
                          err?.message || 
                          'Error al guardar';
      console.error('Error detallado:', err);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (p) => {
    // Normalizar todos los valores a strings para consistency
    setForm(normalizeForm({
      nombre: p.nombre,
      descripcion: p.descripcion,
      stock: p.stock,
      categoria: p.categoria?._id || p.categoria || '',
      tags: p.tags?.join(', ') || '',
      priceUSD: p.priceUSD || '',
      pricePesos: p.pricePesos || '',
      hasInstallation: p.hasInstallation || false,
      installationZones: p.installationZones || ['AMBA', 'CABA'],
    }));
    setEditing(p._id);
    setEditingProduct(p);
    setShowForm(true);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setNewVideoFiles([]);
    setNewVideoPreviews([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar producto?')) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Eliminado');
    } catch { toast.error('Error'); }
  };

  const handleRestock = async (p) => {
    const qty = parseInt(restockQty, 10);
    if (!qty || qty <= 0) { toast.error('Ingresá una cantidad válida'); return; }
    try {
      await updateProduct({ id: p._id, stock: qty }).unwrap();
      toast.success(`Stock actualizado a ${qty}`);
      setRestockId(null);
      setRestockQty('');
    } catch { toast.error('Error al actualizar stock'); }
  };

  const handleSuggestionClick = async (suggestionProduct) => {
    try {
      // Obtener el producto completo para asegurar todos los datos
      const response = await fetch(`http://localhost:5000/api/products/${suggestionProduct._id}`);
      const fullProduct = await response.json();
      handleEdit(fullProduct);
      setSearch('');
      setShowSuggestions(false);
      toast.success(`Editando: ${fullProduct.nombre}`);
    } catch (err) {
      toast.error('Error al cargar producto');
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowExchangeRateModal(true)} 
            className="btn-secondary flex items-center gap-2 text-sm"
            title={`Cotización actual: 1 USD = $${exchangeRate.toLocaleString('es-AR')}`}
          >
            <HiOutlineRefresh size={16} /> Cotización: ${exchangeRate.toLocaleString('es-AR')}
          </button>
          <button onClick={() => { setShowForm(true); setEditing(null); setEditingProduct(null); setForm(EMPTY); setNewImageFiles([]); setNewImagePreviews([]); setNewVideoFiles([]); setNewVideoPreviews([]); }} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus size={16} /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[180px]" ref={suggestionsRef}>
          <HiOutlineSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => { 
              setSearch(e.target.value); 
              setPage(1);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="input-field pl-9"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && search.trim().length > 0 && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {suggestions.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleSuggestionClick(product)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 text-left"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                    {product.imagenes?.[0]?.url ? (
                      <img src={product.imagenes[0].url} alt={product.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <HiOutlineSearch size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-100 truncate">{product.nombre}</p>
                    <p className="text-xs text-gray-500">
                      ${getPriceByRole(product, user?.role, exchangeRate).toLocaleString('es-AR')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* No results message */}
          {showSuggestions && search.trim().length > 0 && suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-4 text-center text-sm text-gray-400">
              No se encontraron productos
            </div>
          )}
        </div>
        <select
          value={filterCat}
          onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
          className="input-field w-auto"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
        </select>
        {(search || filterCat) && (
          <button onClick={() => { setSearch(''); setFilterCat(''); setPage(1); }} className="btn-secondary text-sm">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
            <button onClick={() => setShowForm(false)}><HiX size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-field" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" required min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="input-field">
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tags (separados por coma)</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="electrónico, networking, seguridad" />
            </div>

            {/* Precio section */}
            <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio en Dólares (USD)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.priceUSD}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setForm({ ...form, priceUSD: value });
                  }}
                  className="input-field"
                  placeholder="Ej: 50.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio en Pesos (ARS)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.pricePesos}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setForm({ ...form, pricePesos: value });
                  }}
                  className="input-field"
                  placeholder="Ej: 55000.00"
                />
              </div>
            </div>

            {/* Installation section */}
            <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">¿Incluye instalación?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="installation"
                      value="true"
                      checked={form.hasInstallation === true}
                      onChange={() => setForm({ ...form, hasInstallation: true, installationZones: ['AMBA', 'CABA'] })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Sí</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="installation"
                      value="false"
                      checked={form.hasInstallation === false}
                      onChange={() => setForm({ ...form, hasInstallation: false })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Zonas de instalación - Solo si incluye instalación */}
              {form.hasInstallation && (
                <div className="mt-4 hidden">
                  <label className="block text-sm font-medium mb-2">Zonas de instalación disponibles</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.installationZones?.includes('AMBA') || false}
                        onChange={(e) => {
                          const zones = form.installationZones || [];
                          if (e.target.checked) {
                            if (!zones.includes('AMBA')) {
                              setForm({ ...form, installationZones: [...zones, 'AMBA'] });
                            }
                          } else {
                            setForm({ ...form, installationZones: zones.filter(z => z !== 'AMBA') });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">AMBA</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.installationZones?.includes('CABA') || false}
                        onChange={(e) => {
                          const zones = form.installationZones || [];
                          if (e.target.checked) {
                            if (!zones.includes('CABA')) {
                              setForm({ ...form, installationZones: [...zones, 'CABA'] });
                            }
                          } else {
                            setForm({ ...form, installationZones: zones.filter(z => z !== 'CABA') });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">CABA</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Multi-image section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Imágenes <span className="text-gray-400 font-normal">({totalImages}/{MAX_IMAGES})</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {/* Existing images */}
                {existingImages.map((img) => (
                  <div key={img.publicId} className="relative aspect-square">
                    <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(img.publicId)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {/* New image previews */}
                {newImagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {/* Add slot */}
                {totalImages < MAX_IMAGES && (
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                    <HiOutlinePlus size={18} className="text-gray-300" />
                    <span className="text-xs text-gray-400 mt-1">Agregar</span>
                    <input type="file" accept="image/*" multiple className="sr-only" onChange={handleAddImages} />
                  </label>
                )}
              </div>
            </div>

            {/* Multi-video section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Vídeos <span className="text-gray-400 font-normal">({totalVideos}/3)</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {/* Existing videos */}
                {existingVideos.map((vid) => (
                  <div key={vid.publicId} className="relative aspect-square">
                    <video src={vid.url} className="w-full h-full object-cover rounded-lg border bg-black" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <HiOutlineFilm size={24} className="text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingVideo(vid.publicId)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {/* New video previews */}
                {newVideoPreviews.map((vidData, i) => (
                  <div key={i} className="relative aspect-square">
                    <video src={vidData.url} className="w-full h-full object-cover rounded-lg border bg-black" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <HiOutlineFilm size={24} className="text-white" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewVideo(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                    >
                      <HiX size={10} />
                    </button>
                  </div>
                ))}
                {/* Add slot */}
                {totalVideos < 3 && (
                  <label className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                    <HiOutlinePlus size={18} className="text-gray-300" />
                    <span className="text-xs text-gray-400 mt-1">Agregar</span>
                    <input type="file" accept="video/*" multiple className="sr-only" onChange={handleAddVideos} />
                  </label>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Guardando...' : editing ? 'Guardar' : 'Crear'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Fotos</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : (data?.products || []).map((p) => (
              <tr key={p._id} className="border-b last:border-0 hover:bg-gray-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      {p.imagenes?.[0]?.url ? (
                        <img src={p.imagenes[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlinePhotograph size={14} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    {p.imagenes?.length > 1 && (
                      <span className="text-xs text-gray-400">+{p.imagenes.length - 1}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.nombre}</td>
                <td className="px-4 py-3">{formatCurrency(getPriceByRole(p, user?.role, exchangeRate))}</td>
                <td className="px-4 py-3">
                  {restockId === p._id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={restockQty}
                        onChange={(e) => setRestockQty(e.target.value)}
                        className="w-16 text-xs border border-gray-700 rounded-lg px-2 py-1 bg-gray-800 text-gray-100"
                        placeholder="Cant."
                        autoFocus
                      />
                      <button onClick={() => handleRestock(p)} className="text-xs px-2 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700">OK</button>
                      <button onClick={() => { setRestockId(null); setRestockQty(''); }} className="text-xs px-2 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-100">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${p.stock > 5 ? 'bg-green-900 text-green-300' : p.stock > 0 ? 'bg-primary-900 text-primary-400' : 'bg-red-900 text-red-400'}`}>
                        {p.stock}
                      </span>
                      {p.stock <= 5 && (
                        <button
                          onClick={() => { setRestockId(p._id); setRestockQty(''); }}
                          title="Reponer stock"
                          className="p-1 rounded-lg hover:bg-gray-700 text-primary-400"
                        >
                          <HiOutlineRefresh size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400">
                      <HiOutlinePencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-gray-800 text-red-400">
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.pages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === i + 1 ? 'bg-primary-400 text-white' : 'bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Exchange Rate Modal */}
      {showExchangeRateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HiOutlineRefresh size={20} /> Actualizar Cotización
              </h2>
              <button onClick={() => setShowExchangeRateModal(false)} className="text-gray-400 hover:text-gray-200">
                <HiX size={20} />
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">1 Dólar (USD) = ? Pesos (ARS)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newExchangeRate}
                onChange={(e) => {
                  setNewExchangeRate(e.target.value);
                }}
                className="input-field"
                placeholder="Ej: 1000"
              />
              <p className="text-xs text-gray-400 mt-2">Cotización actual: ${exchangeRate.toLocaleString('es-AR')}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExchangeRateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  console.log('💬 Input value:', newExchangeRate, 'Type:', typeof newExchangeRate);
                  const newRate = parseFloat(newExchangeRate);
                  console.log('💬 Parsed rate:', newRate);
                  
                  if (!newRate || newRate <= 0 || isNaN(newRate)) {
                    toast.error('Ingresá una cotización válida mayor a 0');
                    return;
                  }
                  
                  try {
                    console.log('🔄 [1] Enviando mutation con:', newRate);
                    const result = await updateExchangeRate(newRate).unwrap();
                    console.log('✅ [2] Response del backend:', result);
                    
                    // Esperar que RTK Query invalide la caché
                    await new Promise(resolve => setTimeout(resolve, 500));
                    console.log('⏳ [3] Esperó 500ms para invalidación');
                    
                    // Refetchear manualmente
                    console.log('🔄 [4] Iniciando refetch de rate y products...');
                    const rateRefetch = await refetchRate();
                    const productsRefetch = await refetchProducts();
                    console.log('✅ [5] Rate refetch:', rateRefetch);
                    console.log('✅ [5] Products refetch:', productsRefetch);
                    
                    toast.success(`✅ Cotización actualizada: 1 USD = $${newRate.toLocaleString('es-AR')}`);
                    console.log('✅ [6] Toast mostrado, cerrando modal');
                    
                    // Cerrar modal después de completar todo
                    setShowExchangeRateModal(false);
                  } catch (err) {
                    console.error('❌ [ERROR]:', err);
                    console.error('❌ Error status:', err?.status);
                    console.error('❌ Error data:', err?.data);
                    toast.error('❌ Error al actualizar cotización: ' + (err?.data?.message || err?.message || 'Error desconocido'));
                  }
                }}
                className="btn-primary flex-1"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductsAdmin;
