import React, { useState, useEffect } from 'react';
import { useCheckInstallationAvailableQuery } from '../../services/locationApi';
import { HiOutlineMapPin, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

/**
 * 🗺️ Componente: LocationValidator
 * 
 * Valida si una dirección está en CABA/AMBA
 * Muestra si instalación está disponible
 * 
 * Props:
 *   - direccion: string - Dirección a validar
 *   - onValidationChange: (esValida: boolean, data: object) => void
 *   - showInstalationOption: boolean - Mostrar opción de instalación si está disponible
 */
export default function LocationValidator({
  direccion,
  onValidationChange,
  showInstallationOption = false,
}) {
  const [displayDireccion, setDisplayDireccion] = useState(direccion || '');
  const [shouldValidate, setShouldValidate] = useState(false);

  // Debounce: solo validar si la dirección cambió después de 1 segundo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (displayDireccion && displayDireccion !== direccion) {
        setShouldValidate(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [displayDireccion, direccion]);

  // Query: Validar ubicación
  const { data: validationData, isLoading, error } = useCheckInstallationAvailableQuery(
    displayDireccion,
    { skip: !shouldValidate || !displayDireccion }
  );

  // Notificar cambios
  useEffect(() => {
    if (validationData && onValidationChange) {
      onValidationChange(validationData.disponible, validationData);
    }
  }, [validationData, onValidationChange]);

  // Si no hay dirección, no renderizar nada
  if (!displayDireccion) {
    return null;
  }

  // Estado: validando
  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
        <div className="animate-spin">
          <HiOutlineMapPin className="text-blue-600 text-lg" />
        </div>
        <span className="text-sm text-blue-700">Validando ubicación...</span>
      </div>
    );
  }

  // Estado: error
  if (error) {
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700 flex items-center gap-2">
          <HiOutlineXCircle className="text-red-600" />
          Error validando ubicación: {error.message}
        </p>
      </div>
    );
  }

  // Estado: sin validar
  if (!validationData) {
    return null;
  }

  // Estado: DISPONIBLE ✅
  if (validationData.disponible) {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-2">
          <HiOutlineCheckCircle className="text-green-600 text-lg flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800">✅ Cobertura disponible</p>
            <p className="text-xs text-green-700 mt-1">{validationData.razon}</p>
            {validationData.esCABA && (
              <p className="text-xs text-green-600 mt-1">📍 Ubicación: CABA</p>
            )}
            {validationData.partido && !validationData.esCABA && (
              <p className="text-xs text-green-600 mt-1">📍 Ubicación: {validationData.partido}</p>
            )}
            {showInstallationOption && (
              <p className="text-xs text-green-700 mt-2 font-semibold">
                ✨ Instalación disponible en tu zona
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Estado: NO DISPONIBLE ❌
  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-2">
        <HiOutlineXCircle className="text-amber-600 text-lg flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">⚠️ Fuera de cobertura</p>
          <p className="text-xs text-amber-700 mt-1">{validationData.razon}</p>
          <p className="text-xs text-amber-600 mt-1">
            Actualmente atendemos CABA y Gran Buenos Aires
          </p>
        </div>
      </div>
    </div>
  );
}
