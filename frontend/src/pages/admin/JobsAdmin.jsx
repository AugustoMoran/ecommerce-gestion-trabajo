import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetAllJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useAssignTechnicianMutation,
  useRemoveTechnicianMutation,
} from '../../services/jobsApi';
import { useGetUsersListQuery } from '../../services/adminUsersApi';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiX,
  HiOutlineSearch,
  HiOutlineUserGroup,
} from 'react-icons/hi';

const EMPTY_JOB = {
  title: '',
  description: '',
  date: '',
  clientName: '',
  clientPhone: '',
  address: '',
  price: '',
  slots: '',
  status: 'OPEN',
  observations: '',
};

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Abierto', color: 'bg-green-900 text-green-200' },
  { value: 'FULL', label: 'Completo', color: 'bg-primary-900 text-primary-200' },
  { value: 'IN_PROGRESS', label: 'En progreso', color: 'bg-blue-900 text-blue-200' },
  { value: 'DONE', label: 'Completado', color: 'bg-gray-700 text-gray-200' },
];

// Helper function to get unique technician IDs from assignedTechnicians array
const getUniqueTechnicianIds = (assignedTechnicians, availableTechnicians = []) => {
  const seen = new Set();
  const unique = [];
  
  (assignedTechnicians || []).forEach(tech => {
    const techId = String(typeof tech === 'string' ? tech : tech._id);
    // Only add if not seen before AND technician exists in the system
    if (!seen.has(techId) && availableTechnicians.some(t => String(t._id) === techId)) {
      seen.add(techId);
      unique.push(techId);
    }
  });
  
  return unique;
};

const JobsAdmin = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [editing, setEditing] = useState(null);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [showTechnicianManager, setShowTechnicianManager] = useState(null);

  const { data: jobs = [], isLoading, refetch } = useGetAllJobsQuery({
    status: statusFilter,
  });
  const { data: usersData = { users: [] } } = useGetUsersListQuery({ role: 'tecnico', limit: 100 });
  const technicians = usersData.users || [];
  const [createJob] = useCreateJobMutation();
  const [updateJob] = useUpdateJobMutation();
  const [deleteJob] = useDeleteJobMutation();
  const [assignTechnician, { isLoading: isAssigning }] = useAssignTechnicianMutation();
  const [removeTechnician, { isLoading: isRemoving }] = useRemoveTechnicianMutation();

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.clientName.toLowerCase().includes(search.toLowerCase()) ||
      job.clientPhone.includes(search)
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        slots: Number(form.slots),
        assignedTechnicians: selectedTechnicians,
      };

      if (editing) {
        await updateJob({ id: editing, ...payload }).unwrap();
        toast.success('Trabajo actualizado');
      } else {
        await createJob(payload).unwrap();
        toast.success('Trabajo creado');
      }
      setForm(EMPTY_JOB);
      setEditing(null);
      setShowForm(false);
      setSelectedTechnicians([]);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Error al guardar el trabajo');
    }
  };

  const handleEdit = (job) => {
    setForm({
      title: job.title,
      description: job.description,
      date: job.date ? job.date.split('T')[0] : '',
      clientName: job.clientName,
      clientPhone: job.clientPhone,
      address: job.address,
      price: String(job.price),
      slots: String(job.slots),
      status: job.status,
      observations: job.observations,
    });
    // Extract IDs from assignedTechnicians (they come as objects with _id from backend)
    const techIds = (job.assignedTechnicians || []).map(t => 
      typeof t === 'string' ? t : t._id
    );
    setSelectedTechnicians(techIds);
    setEditing(job._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este trabajo?')) return;
    try {
      await deleteJob(id).unwrap();
      toast.success('Trabajo eliminado');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Error al eliminar');
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_JOB);
    setEditing(null);
    setShowForm(false);
    setSelectedTechnicians([]);
  };

  const handleToggleTechnician = (technicianId) => {
    if (selectedTechnicians.includes(technicianId)) {
      setSelectedTechnicians(selectedTechnicians.filter(id => id !== technicianId));
    } else {
      // Permitir agregar técnicos sin límite
      setSelectedTechnicians([...selectedTechnicians, technicianId]);
    }
  };

  const handleAssignTechnician = async (jobId, technicianId) => {
    try {
      await assignTechnician({ id: jobId, technicianId }).unwrap();
      toast.success('Técnico asignado');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Error al asignar técnico');
    }
  };

  const handleRemoveTechnician = async (jobId, technicianId) => {
    try {
      await removeTechnician({ id: jobId, technicianId }).unwrap();
      toast.success('Técnico removido');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Error al remover técnico');
    }
  };

  const getStatusBadge = (status) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option ? option : { label: status, color: 'bg-gray-800 text-gray-300' };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-100">Bolsa de Trabajos</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary-400 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <HiOutlinePlus size={20} />
            Nuevo Trabajo
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-gray-900 rounded-lg shadow-md p-6 border-l-4 border-primary-400">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editing ? 'Editar Trabajo' : 'Crear Nuevo Trabajo'}
              </h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                <HiX size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <input
                type="text"
                name="title"
                placeholder="Título del trabajo"
                value={form.title}
                onChange={handleInputChange}
                required
                className="col-span-2 px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Description */}
              <textarea
                name="description"
                placeholder="Descripción"
                value={form.description}
                onChange={handleInputChange}
                required
                rows="3"
                className="col-span-2 px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Date */}
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Status */}
              <select
                name="status"
                value={form.status}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Client Name */}
              <input
                type="text"
                name="clientName"
                placeholder="Nombre del cliente"
                value={form.clientName}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Client Phone */}
              <input
                type="tel"
                name="clientPhone"
                placeholder="Teléfono del cliente"
                value={form.clientPhone}
                onChange={handleInputChange}
                required
                className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Address */}
              <input
                type="text"
                name="address"
                placeholder="Dirección"
                value={form.address}
                onChange={handleInputChange}
                required
                className="col-span-2 px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Price */}
              <input
                type="number"
                name="price"
                placeholder="Precio"
                value={form.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Slots */}
              <input
                type="number"
                name="slots"
                placeholder="Cantidad de técnicos - Opcional"
                value={form.slots}
                onChange={handleInputChange}
                min="0"
                className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Observations */}
              <textarea
                name="observations"
                placeholder="Observaciones"
                value={form.observations}
                onChange={handleInputChange}
                rows="2"
                className="col-span-2 px-4 py-2 border border-gray-700 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />

              {/* Technician Selection */}
              <div className="col-span-2 border-t border-gray-700 pt-4">
                <label className="block text-sm font-medium mb-2 text-gray-100">
                  Técnicos Asignados ({selectedTechnicians.length}) - Opcional
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-gray-700 p-3 rounded-lg">
                  {technicians.length > 0 ? (
                    technicians.map(tech => (
                      <label key={tech._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedTechnicians.includes(tech._id)}
                          onChange={() => handleToggleTechnician(tech._id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-sm text-gray-100">{tech.nombre}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm col-span-2">No hay técnicos disponibles</p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="col-span-2 flex gap-3 justify-end border-t border-gray-700 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors bg-gray-900 text-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-400 hover:bg-primary-500 text-white rounded-lg font-semibold transition-colors"
                >
                  {editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 items-center bg-gray-900 rounded-lg p-4 shadow-sm">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, cliente o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Cargando trabajos...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay trabajos disponibles
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">
                      Título
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">
                      Técnicos
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-100">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-100">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredJobs.map((job) => {
                    const statusBadge = getStatusBadge(job.status);
                    return (
                      <tr key={job._id} className="hover:bg-gray-800 transition-colors border-b border-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-100 font-medium">
                          {job.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {job.clientName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {new Date(job.date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-100 font-semibold">
                          ${job.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {getUniqueTechnicianIds(job.assignedTechnicians, technicians).length}/{job.slots}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(job)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar"
                          >
                            <HiOutlinePencil size={18} />
                          </button>
                          <button
                            onClick={() => setShowTechnicianManager(job)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Gestionar técnicos"
                          >
                            <HiOutlineUserGroup size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(job._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Eliminar"
                          >
                            <HiOutlineTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Technician Manager Modal */}
        {showTechnicianManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-100">
                  {showTechnicianManager.title} - Gestionar Técnicos
                </h3>
                <button
                  onClick={() => setShowTechnicianManager(null)}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <HiX size={24} />
                </button>
              </div>

              {/* Calculate only valid AND unique assigned technicians */}
              {(() => {
                const uniqueValidAssignedIds = getUniqueTechnicianIds(showTechnicianManager.assignedTechnicians, technicians);
                
                return (
                  <>
                    <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-300">
                        Cupos asignados: <span className="font-bold text-green-400">
                          {uniqueValidAssignedIds.length}
                        </span> / <span className="font-bold">{showTechnicianManager.slots}</span>
                      </p>
                    </div>

                    {/* Assigned Technicians - Only Unique */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Técnicos Asignados:</h4>
                      {uniqueValidAssignedIds.length > 0 ? (
                        <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                          {uniqueValidAssignedIds.map((techId) => {
                            const technicianData = technicians.find(t => t._id === techId);
                            
                            return (
                              <div
                                key={`assigned-tech-${techId}`}
                                className="flex items-center justify-between bg-gray-800 p-2 rounded-lg"
                              >
                                <span className="text-sm text-gray-300">
                                  {technicianData.nombre} {technicianData.apellido}
                                </span>
                                <button
                                  onClick={() => handleRemoveTechnician(showTechnicianManager._id, techId)}
                                  disabled={isRemoving}
                                  className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                >
                                  <HiOutlineTrash size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mb-4">No hay técnicos asignados</p>
                      )}
                    </div>

                    {/* Available Technicians to Add */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Agregar Técnico:</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {technicians
                          .filter(tech => !uniqueValidAssignedIds.includes(tech._id))
                          .map(tech => (
                            <button
                              key={tech._id}
                              onClick={() => handleAssignTechnician(showTechnicianManager._id, tech._id)}
                              disabled={isAssigning}
                              className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors disabled:opacity-50 flex items-center justify-between"
                            >
                              <span>{tech.nombre} {tech.apellido}</span>
                              <span className="text-gray-500">+</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default JobsAdmin;
