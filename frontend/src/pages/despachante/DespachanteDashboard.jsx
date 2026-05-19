import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetAllJobsQuery } from '../../services/jobsApi';
import {
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';
import DespachanteLayout from '../../components/despachante/DespachanteLayout';

const DespachanteDashboard = () => {
  const user = useSelector(selectCurrentUser);
  const { data: jobs = [] } = useGetAllJobsQuery({});

  // Calcular estadísticas
  const openJobs = jobs.filter(j => j.status === 'OPEN').length;
  const inProgressJobs = jobs.filter(j => j.status === 'IN_PROGRESS').length;
  const doneJobs = jobs.filter(j => j.status === 'DONE').length;
  const totalPrice = jobs.reduce((acc, j) => acc + (j.price || 0), 0);

  const stats = [
    {
      title: 'Trabajos Abiertos',
      value: openJobs.toString(),
      icon: HiOutlineBriefcase,
      color: 'bg-blue-900 text-blue-200',
      bgIcon: 'bg-blue-600',
    },
    {
      title: 'En Progreso',
      value: inProgressJobs.toString(),
      icon: HiOutlineClock,
      color: 'bg-orange-900 text-orange-200',
      bgIcon: 'bg-orange-600',
    },
    {
      title: 'Completados',
      value: doneJobs.toString(),
      icon: HiOutlineCheckCircle,
      color: 'bg-green-900 text-green-200',
      bgIcon: 'bg-green-600',
    },
  ];

  return (
    <DespachanteLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            Bienvenido, {user?.nombre}!
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona la bolsa de trabajos y asigna técnicos a los trabajos
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-gray-900 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-100 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgIcon} p-3 rounded-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Jobs */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Trabajos Recientes</h2>
          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Título</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Cliente</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Técnicos</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-100">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {jobs.slice(0, 5).map(job => (
                    <tr key={job._id} className="hover:bg-gray-800">
                      <td className="px-6 py-4 font-medium text-gray-100">{job.title}</td>
                      <td className="px-6 py-4 text-gray-400">{job.clientName}</td>
                      <td className="px-6 py-4 text-gray-400">{job.assignedTechnicians?.length || 0}/{job.slots}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          job.status === 'OPEN' ? 'bg-green-900 text-green-200' :
                          job.status === 'FULL' ? 'bg-primary-900 text-primary-200' :
                          job.status === 'IN_PROGRESS' ? 'bg-blue-900 text-blue-200' :
                          'bg-gray-700 text-gray-200'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay trabajos disponibles</p>
          )}
        </div>
      </div>
    </DespachanteLayout>
  );
};

export default DespachanteDashboard;
