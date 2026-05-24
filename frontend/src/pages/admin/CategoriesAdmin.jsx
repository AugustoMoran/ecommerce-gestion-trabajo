import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../services/productsApi';
import { useUploadImageMutation } from '../../services/cartApi';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencil, HiX, HiOutlinePhotograph } from 'react-icons/hi';

const EMPTY = { nombre: '', descripcion: '', imagen: null };

const CategoriesAdmin = () => {
  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [uploadImage] = useUploadImageMutation();

  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previousImagePublicId, setPreviousImagePublicId] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imagenData = form.imagen;
      let imagenPublicId = form.imagenPublicId || null;

      // Si hay archivo de imagen nuevo, subirlo a Cloudinary
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const result = await uploadImage(fd).unwrap();
        imagenData = result.url;
        imagenPublicId = result.publicId;
      }

      const dataToSave = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        imagen: imagenData,
        imagenPublicId: imagenPublicId,
      };

      if (editing) {
        await updateCategory({ id: editing, ...dataToSave }).unwrap();
        toast.success('Categoría actualizada');
      } else {
        await createCategory(dataToSave).unwrap();
        toast.success('Categoría creada');
      }
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
      setImageFile(null);
      setImagePreview(null);
      setPreviousImagePublicId(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (c) => {
    setForm({
      nombre: c.nombre,
      descripcion: c.descripcion || '',
      imagen: c.imagen || null,
      imagenPublicId: c.imagenPublicId || null,
    });
    setImagePreview(c.imagen || null);
    setPreviousImagePublicId(c.imagenPublicId || null);
    setEditing(c._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar categoría?')) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success('Eliminada');
    } catch { toast.error('Error'); }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, imagen: null, imagenPublicId: null });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY); setImageFile(null); setImagePreview(null); setPreviousImagePublicId(null); }} className="btn-primary flex items-center gap-2">
          <HiOutlinePlus size={16} /> Nueva categoría
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
            <button onClick={() => setShowForm(false)}><HiX size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <input type="text" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Imagen (opcional)</label>
              <div className="flex gap-3">
                <label className="flex-1 border-2 border-dashed border-gray-600 rounded-lg p-4 cursor-pointer hover:border-primary-400 transition-colors">
                  <div className="flex flex-col items-center">
                    <HiOutlinePhotograph size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-400">Subir imagen</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
                </label>
                {imagePreview && (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    <button type="button" onClick={handleClearImage} disabled={uploading} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600 disabled:opacity-50">
                      <HiX size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={uploading} className="btn-primary disabled:opacity-50">{uploading ? 'Guardando...' : (editing ? 'Guardar' : 'Crear')}</button>
              <button type="button" onClick={() => setShowForm(false)} disabled={uploading} className="btn-secondary disabled:opacity-50">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-800 rounded" />
            </div>
          ))
        ) : categories.map((c) => (
          <div key={c._id} className="card p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {c.imagen ? (
                <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-400 text-lg">📁</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{c.nombre}</p>
              {c.descripcion && <p className="text-xs text-gray-400 truncate">{c.descripcion}</p>}
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400">
                <HiOutlinePencil size={14} />
              </button>
              <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-gray-800 text-red-400">
                <HiOutlineTrash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default CategoriesAdmin;
