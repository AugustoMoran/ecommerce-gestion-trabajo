import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  HiOutlineViewGrid,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineHome,
  HiOutlineLogout,
} from 'react-icons/hi';

const NAV_ITEMS = [
  { to: '/tecnico', label: 'Panel', icon: HiOutlineViewGrid, exact: true },
  { to: '/tecnico/bolsa', label: 'Bolsa de Trabajos', icon: HiOutlineBriefcase },
  { to: '/tecnico/mis-trabajos', label: 'Mis Trabajos', icon: HiOutlineCheckCircle },
];

const TecnicoLayout = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!user || user.role !== 'tecnico') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-gray-100 flex-shrink-0 hidden md:flex flex-col">
        <div className="px-5 py-4 border-b border-gray-800">
          <p className="font-bold text-white">Panel Técnico</p>
          <p className="text-sm text-gray-400 mt-1">{user?.nombre}</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  active ? 'bg-blue-500 text-white font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <HiOutlineHome size={18} />
            Ir a la tienda
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-950 p-6">
        {children}
      </main>
    </div>
  );
};

export default TecnicoLayout;
