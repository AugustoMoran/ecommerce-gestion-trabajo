import React, { useState } from 'react';
import TecnicoLayout from '../../components/tecnico/TecnicoLayout';
import { useGetOpenJobsQuery, useTakeJobMutation } from '../../services/jobsApi';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlinePhone,
  HiOutlineUser,
} from 'react-icons/hi';
import { MdLocationOn } from 'react-icons/md';

// Helper function to get unique technician IDs (deduplicates, no validation)
const getUniqueTechnicianIds = (assignedTechnicians) => {
  const seen = new Set();
  const unique = [];
  
  (assignedTechnicians || []).forEach(tech => {
    const techId = String(typeof tech === 'string' ? tech : tech._id);
    if (!seen.has(techId)) {
      seen.add(techId);
      unique.push(techId);
    }
  });
  
  return unique;
};

const BolsaTrabajosPage = () => {
  const [search, setSearch] = useState('');

  const { data: openJobs = [], isLoading, refetch } = useGetOpenJobsQuery();
  const [takeJob, { isLoading: isClaiming }] = useTakeJobMutation();

  const filteredJobs = openJobs.filter((job) =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.clientName.toLowerCase().includes(search.toLowerCase()) ||
    job.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleClaimJob = async (jobId) => {
    try {
      await takeJob({ id: jobId, slots: 1 }).unwrap();
      toast.success('¡Trabajo reclamado exitosamente!');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Error al reclamar el trabajo');
    }
  };

  const getAvailableSlots = (job) => {
    const uniqueCount = getUniqueTechnicianIds(job.assignedTechnicians).length;
    return job.slots - uniqueCount;
  };

  return (
    <TecnicoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Bolsa de Trabajos</h1>
            <p className="text-gray-600 mt-1">Trabajos disponibles para reclamar</p>
          </div>
          <div className="bg-blue-900 text-blue-300 px-4 py-2 rounded-lg">
            <p className="text-sm font-semibold">{filteredJobs.length} trabajos disponibles</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-900 rounded-lg shadow-sm p-4">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Buscar por título, cliente o dirección..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              Cargando trabajos...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <HiOutlineBriefcase size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No hay trabajos disponibles en este momento</p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const availableSlots = getAvailableSlots(job);
              return (
                <div
                  key={job._id}
                  className="bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border-l-4 border-primary-400"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-100 text-lg">{job.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {job.description}
                    </p>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    {/* Client */}
                    <div className="flex items-start gap-3">
                      <HiOutlineUser size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">Cliente</p>
                        <p className="text-gray-100 font-medium">{job.clientName}</p>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-start gap-3">
                      <HiOutlineCalendar size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">Fecha</p>
                        <p className="text-gray-100 font-medium">
                          {new Date(job.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3">
                      <MdLocationOn size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">Dirección</p>
                        <p className="text-gray-100 font-medium text-sm">{job.address}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                      <HiOutlinePhone size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase">Teléfono</p>
                        <p className="text-gray-100 font-medium">{job.clientPhone}</p>
                      </div>
                    </div>

                    {/* Price and Slots */}
                    <div className="flex gap-4 pt-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Precio</p>
                        <p className="text-green-400 font-bold text-lg">${job.price.toFixed(2)}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase">Cupos</p>
                        <p className="text-blue-400 font-bold text-lg">
                          {availableSlots}/{job.slots}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-gray-800 border-t border-gray-700">
                    <button
                      onClick={() => handleClaimJob(job._id)}
                      disabled={isClaiming || availableSlots === 0}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                      <HiOutlineCheckCircle size={18} />
                      {isClaiming ? 'Reclamando...' : 'Reclamar Trabajo'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </TecnicoLayout>
  );
};

export default BolsaTrabajosPage;
