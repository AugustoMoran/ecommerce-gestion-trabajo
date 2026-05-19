import React, { useState } from 'react';
import TecnicoLayout from '../../components/tecnico/TecnicoLayout';
import { useGetMyJobsQuery, useStartJobMutation, useFinalizeJobMutation, useAbandonJobMutation } from '../../services/jobsApi';
import {
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlinePhone,
} from 'react-icons/hi';
import { MdLocationOn } from 'react-icons/md';
import toast from 'react-hot-toast';

const MisTrabajosPage = () => {
  const [activeTab, setActiveTab] = useState('pendientes');

  // Fetch technician's jobs
  const { data: myJobsData = {}, isLoading } = useGetMyJobsQuery();
  const [startJob, { isLoading: isStarting }] = useStartJobMutation();
  const [finalizeJob, { isLoading: isFinalizing }] = useFinalizeJobMutation();
  const [abandonJob, { isLoading: isAbandoning }] = useAbandonJobMutation();

  // Structure data by status
  const myJobs = {
    pendientes: myJobsData.pendientes || [],
    enCurso: myJobsData.enCurso || [],
    finalizados: myJobsData.finalizados || [],
  };

  const tabs = [
    { id: 'pendientes', label: 'Pendientes', icon: HiOutlineClipboardList, count: myJobs.pendientes.length },
    { id: 'enCurso', label: 'En Curso', icon: HiOutlineClock, count: myJobs.enCurso.length },
    { id: 'finalizados', label: 'Finalizados', icon: HiOutlineCheckCircle, count: myJobs.finalizados.length },
  ];

  const currentJobs = myJobs[activeTab];

  const handleStartJob = async (jobId) => {
    try {
      await startJob(jobId).unwrap();
      toast.success('¡Trabajo iniciado!');
    } catch (err) {
      toast.error(err?.data?.message || 'Error al iniciar el trabajo');
    }
  };

  const handleFinishJob = async (jobId) => {
    try {
      await finalizeJob({ id: jobId, observations: '', photos: [] }).unwrap();
      toast.success('¡Trabajo finalizado!');
    } catch (err) {
      toast.error(err?.data?.message || 'Error al finalizar el trabajo');
    }
  };

  const handleAbandonJob = async (jobId) => {
    if (window.confirm('¿Estás seguro de que quieres abandonar este trabajo? El cupo será devuelto.')) {
      try {
        await abandonJob(jobId).unwrap();
        toast.success('¡Has abandonado el trabajo!');
      } catch (err) {
        toast.error(err?.data?.message || 'Error al abandonar el trabajo');
      }
    }
  };

  const JobCard = ({ job }) => (
    <div className="bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-primary-400">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-100">{job.title}</h3>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(job.date).toLocaleDateString('es-ES')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          activeTab === 'pendientes' ? 'bg-primary-100 text-primary-900' :
          activeTab === 'enCurso' ? 'bg-blue-900 text-blue-300' :
          'bg-green-900 text-green-300'
        }`}>
          {activeTab === 'pendientes' ? 'Pendiente' :
           activeTab === 'enCurso' ? 'En Progreso' :
           'Completado'}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-gray-300">
          <HiOutlineUser size={16} className="text-gray-400" />
          <span>{job.clientName}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <HiOutlinePhone size={16} className="text-gray-400" />
          <a href={`tel:${job.clientPhone}`} className="text-blue-400 hover:underline">
            {job.clientPhone}
          </a>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <MdLocationOn size={16} className="text-gray-400" />
          <span className="text-sm">{job.address}</span>
        </div>
      </div>

      <div className="border-t pt-4 flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Precio</p>
          <p className="text-green-400 font-bold text-lg">${job.price.toFixed(2)}</p>
        </div>

        {activeTab === 'pendientes' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleStartJob(job._id)}
              disabled={isStarting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              Iniciar Trabajo
            </button>
            <button
              onClick={() => handleAbandonJob(job._id)}
              disabled={isAbandoning}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              Abandonar
            </button>
          </div>
        )}

        {activeTab === 'enCurso' && (
          <button
            onClick={() => handleFinishJob(job._id)}
            disabled={isFinalizing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
          >
            Finalizar Trabajo
          </button>
        )}

        {activeTab === 'finalizados' && (
          <span className="text-gray-400 text-sm">
            Completado el {new Date(job.finishDate).toLocaleDateString('es-ES')}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <TecnicoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Mis Trabajos</h1>
          <p className="text-gray-400 mt-1">Gestiona tus trabajos asignados</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700">>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors border-b-2 ${
                  isActive
                    ? 'text-blue-400 border-blue-600'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                <span className="ml-2 bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              Cargando trabajos...
            </div>
          ) : currentJobs.length === 0 ? (
            <div className="text-center py-12">
              <HiOutlineClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {activeTab === 'pendientes' && 'No tienes trabajos pendientes'}
                {activeTab === 'enCurso' && 'No tienes trabajos en curso'}
                {activeTab === 'finalizados' && 'No tienes trabajos finalizados'}
              </p>
            </div>
          ) : (
            currentJobs.map((job) => <JobCard key={job._id} job={job} />)
          )}
        </div>
      </div>
    </TecnicoLayout>
  );
};

export default MisTrabajosPage;
