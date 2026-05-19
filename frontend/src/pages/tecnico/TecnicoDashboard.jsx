import React from 'react';
import TecnicoLayout from '../../components/tecnico/TecnicoLayout';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetOpenJobsQuery, useGetMyJobsQuery } from '../../services/jobsApi';
import {
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';

const TecnicoDashboard = () => {
  const user = useSelector(selectCurrentUser);

  // Obtener trabajos disponibles desde la API
  const { data: openJobs = [] } = useGetOpenJobsQuery();
  
  // Obtener trabajos del técnico
  const { data: myJobsData = {} } = useGetMyJobsQuery();
  const myJobs = {
    enCurso: myJobsData.enCurso || [],
    finalizados: myJobsData.finalizados || [],
  };

  // Stats dinámicos basados en datos reales
  const stats = [
    {
      title: 'Trabajos Disponibles',
      value: openJobs.length.toString(),
      icon: HiOutlineBriefcase,
      color: 'bg-blue-900 text-blue-300',
      bgIcon: 'bg-blue-500',
    },
    {
      title: 'En Curso',
      value: myJobs.enCurso.length.toString(),
      icon: HiOutlineClock,
      color: 'bg-orange-900 text-orange-300',
      bgIcon: 'bg-orange-600',
    },
    {
      title: 'Completados',
      value: myJobs.finalizados.length.toString(),
      icon: HiOutlineCheckCircle,
      color: 'bg-green-900 text-green-300',
      bgIcon: 'bg-green-600',
    },
  ];

  // Trabajos recientes del técnico (En Curso)
  const recentJobs = myJobs.enCurso.slice(0, 2);

  return (
    <TecnicoLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            Bienvenido, {user?.nombre}!
          </h1>
          <p className="text-gray-600 mt-2">
            Aquí puedes ver tus trabajos y la bolsa de trabajos disponibles
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trabajos Recientes */}
          <div className="bg-gray-900 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Trabajos Recientes</h2>
            <div className="space-y-4">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <div key={job._id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-semibold text-gray-100">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.clientName}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        job.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-primary-100 text-primary-900'
                      }`}>
                        {job.status === 'IN_PROGRESS' ? 'En progreso' : 'Pendiente'}
                      </span>
                      <span className="text-green-600 font-bold">${job.price}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No tienes trabajos en curso</p>
              )}
            </div>
          </div>


        </div>
      </div>
    </TecnicoLayout>
  );
};

export default TecnicoDashboard;
