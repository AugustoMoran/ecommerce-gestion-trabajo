import React from 'react';
import { HiOutlineHome } from 'react-icons/hi2';

/**
 * Badge que muestra si el producto ofrece instalación
 * Usado en vista de producto y listados
 */
const InstallationBadge = ({ hasInstallation, zones, userZone, isRegistered }) => {
  if (!hasInstallation) return null;

  // Usuario registrado en zona con instalación
  if (isRegistered && userZone && zones?.includes(userZone)) {
    return (
      <div className="flex items-center gap-2 bg-green-900 border border-green-700 rounded-lg px-3 py-2 text-sm text-green-300">
        <HiOutlineHome className="text-green-600" size={18} />
        <span className="text-green-700 font-medium">✅ Instalación disponible en tu zona</span>
      </div>
    );
  }

  // Usuario registrado fuera de zona
  if (isRegistered && userZone && !zones?.includes(userZone)) {
    return (
      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300">
        <HiOutlineHome className="text-gray-600" size={18} />
        <span className="text-gray-600 font-medium">Instalación no disponible en tu zona</span>
      </div>
    );
  }

  // Usuario NO registrado pero en zona aplicable
  if (!isRegistered && zones?.length > 0) {
    return (
      <div className="flex items-center gap-2 bg-blue-900 border border-blue-700 rounded-lg px-3 py-2 text-sm text-blue-300">
        <HiOutlineHome className="text-blue-600" size={18} />
        <span className="text-blue-700 font-medium">🏠 Servicio de instalación disponible</span>
      </div>
    );
  }

  return null;
};

export default InstallationBadge;
