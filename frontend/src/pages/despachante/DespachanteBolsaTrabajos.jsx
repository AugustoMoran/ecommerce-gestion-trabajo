import React, { useState, useMemo } from 'react';
import DespachanteLayout from '../../components/despachante/DespachanteLayout';
import {
  useGetAllJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} from '../../services/jobsApi';
import { useGetUsersListQuery } from '../../services/adminUsersApi';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiX,
  HiOutlineSearch,
  HiOutlineChevronLeft,
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

const DespachanteBolsaTrabajos = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [editing, setEditing] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedTechnicians, setSelectedTechnicians] = useState([]);
  const [showTechnicianModal, setShowTechnicianModal] = useState(null);

  // Get jobs and technicians
  const { data: jobs = [], isLoading, refetch } = useGetAllJobsQuery({ status: statusFilter });
  const { data: usersData = { users: [] } } = useGetUsersListQuery({ role: 'tecnico', limit: 100 });
  const technicians = usersData.users || [];

  // Mutations
  const [createJob] = useCreateJobMutation();
  const [updateJob] = useUpdateJobMutation();
  const [deleteJob] = useDeleteJobMutation();

  // Filter jobs
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
      setEditingJob(null);
      setSelectedTechnicians([]);
      setShowForm(false);
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
    setEditingJob(job);
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

  const handleToggleTechnician = (technicianId) => {
    if (selectedTechnicians.includes(technicianId)) {
      setSelectedTechnicians(selectedTechnicians.filter(id => id !== technicianId));
    } else {
      // Permitir agregar técnicos sin límite
      setSelectedTechnicians([...selectedTechnicians, technicianId]);
    }
  };

  return (
    <DespachanteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Bolsa de Trabajos</h1>
            <p className="text-gray-600 mt-1">Gestiona trabajos y asigna técnicos</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setForm(EMPTY_JOB);
              setEditing(null);
              setEditingJob(null);
              setSelectedTechnicians([]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <HiOutlinePlus size={18} />
            Nuevo Trabajo
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-lg shadow p-4 flex gap-4">
          <div className="flex-1 flex items-center gap-2 border border-gray-700 rounded-lg px-3 bg-gray-800">
            <HiOutlineSearch size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar trabajo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 py-2 outline-none bg-gray-800 text-gray-100 placeholder-gray-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Jobs Table */}
        <div className="bg-gray-900 rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4">Cargando trabajos...</p>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Título</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Cliente</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Técnicos</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Precio</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredJobs.map(job => (
                    <tr key={job._id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium text-gray-100">{job.title}</td>
                      <td className="px-6 py-4 text-gray-400">{job.clientName}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm font-medium">
                          {job.assignedTechnicians?.length || 0}/{job.slots}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">${job.price}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          STATUS_OPTIONS.find(s => s.value === job.status)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {STATUS_OPTIONS.find(s => s.value === job.status)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEdit(job)}
                          className="text-blue-600 hover:text-blue-800 mr-3 font-medium"
                        >
                          <HiOutlinePencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          <HiOutlineTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              No hay trabajos para mostrar
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editing ? 'Editar Trabajo' : 'Nuevo Trabajo'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                  <HiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="title"
                    placeholder="Título"
                    value={form.title}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 col-span-2 bg-gray-700 text-gray-100 placeholder-gray-500"
                    required
                  />
                  <input
                    type="text"
                    name="clientName"
                    placeholder="Nombre cliente"
                    value={form.clientName}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-500"
                    required
                  />
                  <input
                    type="tel"
                    name="clientPhone"
                    placeholder="Teléfono"
                    value={form.clientPhone}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-500"
                    required
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Dirección"
                    value={form.address}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 col-span-2 bg-gray-700 text-gray-100 placeholder-gray-500"
                    required
                  />
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-700 text-gray-100"
                    required
                  />
                  <input
                    type="number"
                    name="slots"
                    placeholder="Slots (técnicos) - Opcional"
                    value={form.slots}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-500"
                    min="0"
                  />
                  <input
                    type="number"
                    name="price"
                    placeholder="Precio"
                    value={form.price}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-500"
                    min="0"
                    required
                  />
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 bg-gray-700 text-gray-100"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    name="description"
                    placeholder="Descripción"
                    value={form.description}
                    onChange={handleInputChange}
                    className="border border-gray-700 rounded-lg px-3 py-2 col-span-2 bg-gray-700 text-gray-100 placeholder-gray-500"
                    rows="2"
                    required
                  />
                </div>

                {/* Technician Selection */}
                <div className="border-t border-gray-700 pt-4">
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

                <div className="flex gap-3 justify-end border-t border-gray-700 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-700 text-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editing ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DespachanteLayout>
  );
};

export default DespachanteBolsaTrabajos;
