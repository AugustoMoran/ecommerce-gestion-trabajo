/**
 * Componente InstallationOption
 * 
 * Muestra la opcion de consultar instalacion a domicilio via WhatsApp
 * Solo aparece si esEnAMBA = true
 * 
 * Props:
 * - disponible: boolean
 * - esEnAMBA: boolean
 * - zona: string
 * - productName: string - Nombre del producto (para WhatsApp)
 * - onContactVendor: function - Callback cuando se contacta
 */

import React from 'react';
import { HiOutlineSparkles, HiOutlineXCircle } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

export default function InstallationOption({
  disponible = false,
  esEnAMBA = false,
  zona = '',
  productName = '',
  onContactVendor = () => {},
  className = '',
}) {
  const handleContactVendor = () => {
    onContactVendor();
  };

  // Si no está disponible, muestra mensaje
  if (!disponible || !esEnAMBA) {
    return (
      <div className={`
        bg-yellow-50 border border-yellow-200 rounded-lg p-4
        text-yellow-800 flex items-center gap-3
        ${className}
      `}>
        <HiOutlineXCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-semibold">⚠️ Instalación no disponible</p>
          <p className="text-sm opacity-75">
            En este momento, la instalación a domicilio no está disponible en tu zona.
          </p>
        </div>
      </div>
    );
  }

  // Si está disponible, muestra botón para contactar
  return (
    <div className={`
      bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 
      rounded-lg p-6 flex items-start gap-4
      ${className}
    `}>
      <HiOutlineSparkles className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
      
      <div className="flex-1">
        <h3 className="font-semibold text-emerald-900 mb-2">
          Instalación profesional disponible
        </h3>
        
        <p className="text-sm text-emerald-700 mb-4">
          Podemos instalar tu compra en {zona}. Contacta con nuestro equipo para coordinar los detalles y presupuesto.
        </p>
        
        <button
          onClick={handleContactVendor}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <FaWhatsapp className="w-5 h-5" />
          Consultar Instalacion
        </button>
      </div>
    </div>
  );
}
