/**
 * 🗺️ VALIDACIÓN DE GEOLOCALIZACIÓN - CABA/AMBA
 * 
 * Valida si una dirección está dentro de CABA o AMBA
 * Usa Google Maps Geocoding API para obtener coordenadas
 * Luego valida contra límites geográficos definidos
 */

const axios = require('axios');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Partidos que se consideran AMBA (Gran Buenos Aires)
 * Incluye todos los municipios del conurbano bonaerense
 */
const AMBA_PARTIDOS = [
  // CABA (Autonomía de Buenos Aires)
  'CABA',
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires Federal',
  
  // Partidos del Gran Buenos Aires
  'Avellaneda',
  'Berazategui',
  'Ezeiza',
  'Florencio Varela',
  'Lanús',
  'Lomas de Zamora',
  'Quilmes',
  'Almirante Brown',
  'Morón',
  'Hurlingham',
  'Ituzaingó',
  'La Matanza',
  'Merlo',
  'Tres de Febrero',
  'San Martín',
  'San Isidro',
  'Vicente López',
  'General San Martín',
];

/**
 * Coordenadas aproximadas de límites de CABA y AMBA
 * Para validación más precisa
 */
const CABA_BOUNDS = {
  north: -34.5630,
  south: -34.7773,
  east: -58.3616,
  west: -58.5121,
};

const AMBA_EXPANDED_BOUNDS = {
  north: -34.4289,
  south: -35.0833,
  east: -58.1639,
  west: -59.0000,
};

/**
 * Geocodifica una dirección usando Google Maps
 * @param {string} direccion - Dirección a geocodificar (ej: "Morón, Buenos Aires")
 * @returns {Promise<{lat, lng, partido, provincia, formattedAddress}>}
 */
async function geocodifyAddress(direccion) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  GOOGLE_MAPS_API_KEY no configurado. Usando fallback.');
    return null;
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: `${direccion}, Argentina`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.results.length === 0) {
      console.warn(`⚠️  No se encontró geocodificación para: ${direccion}`);
      return null;
    }

    const result = response.data.results[0];
    const { lat, lng } = result.geometry.location;

    // Extraer componentes de dirección
    let partido = null;
    let provincia = null;

    for (const component of result.address_components) {
      const types = component.types;
      
      // Obtener partido (administrative_area_level_2)
      if (types.includes('administrative_area_level_2')) {
        partido = component.long_name;
      }
      
      // Obtener provincia (administrative_area_level_1)
      if (types.includes('administrative_area_level_1')) {
        provincia = component.long_name;
      }
    }

    return {
      lat,
      lng,
      partido,
      provincia,
      formattedAddress: result.formatted_address,
    };
  } catch (error) {
    console.error('❌ Error geocodificando dirección:', error.message);
    return null;
  }
}

/**
 * Valida si coordenadas están dentro de CABA
 */
function isWithinCABA(lat, lng) {
  return (
    lat <= CABA_BOUNDS.north &&
    lat >= CABA_BOUNDS.south &&
    lng <= CABA_BOUNDS.east &&
    lng >= CABA_BOUNDS.west
  );
}

/**
 * Valida si coordenadas están dentro de AMBA expandido
 */
function isWithinAMBACoordinates(lat, lng) {
  return (
    lat <= AMBA_EXPANDED_BOUNDS.north &&
    lat >= AMBA_EXPANDED_BOUNDS.south &&
    lng <= AMBA_EXPANDED_BOUNDS.east &&
    lng >= AMBA_EXPANDED_BOUNDS.west
  );
}

/**
 * Valida si un partido está en la lista de AMBA
 */
function isPartidoInAMBA(partido) {
  if (!partido) return false;
  return AMBA_PARTIDOS.some(p => 
    p.toLowerCase() === partido.toLowerCase() ||
    partido.toLowerCase().includes(p.toLowerCase()) ||
    p.toLowerCase().includes(partido.toLowerCase())
  );
}

/**
 * FUNCIÓN PRINCIPAL: Valida si una dirección está en CABA/AMBA
 * @param {string} direccion - Dirección completa (ej: "Calle 123, Morón")
 * @returns {Promise<{esEnAMBA: boolean, caba: boolean, coordenadas: {lat, lng}, partido: string, detalle: string}>}
 */
async function validateLocationAMBA(direccion) {
  console.log(`🗺️  Validando ubicación: ${direccion}`);

  if (!direccion || direccion.trim().length === 0) {
    console.warn('⚠️  Dirección vacía');
    return {
      esEnAMBA: false,
      caba: false,
      coordenadas: null,
      partido: null,
      detalle: 'Dirección vacía',
    };
  }

  // Intentar geocodificar
  const geoData = await geocodifyAddress(direccion);

  if (!geoData) {
    console.warn(`⚠️  No se pudo geocodificar: ${direccion}. Fallback a búsqueda por palabra clave.`);
    // Fallback: buscar por palabra clave en la dirección
    const direccionLower = direccion.toLowerCase().trim();
    
    // Buscar CABA - buscar indicadores de CABA
    const esCABA = direccionLower.includes('caba') || 
                   direccionLower.includes('ciudad autónoma') ||
                   direccionLower.includes('ciudad de buenos aires') ||
                   direccionLower.includes('flores') ||
                   direccionLower.includes('capital') ||
                   (direccionLower.includes('buenos aires') && direccionLower.includes('argentina'));
    
    // Buscar partido: buscar entre los partidos conocidos cuál aparece en la dirección
    const partidoKeyword = AMBA_PARTIDOS.find(p => {
      const parLower = p.toLowerCase();
      // Buscar el partido de forma case-insensitive en la dirección
      // Usar limites de palabra para evitar coincidencias parciales
      const regex = new RegExp(`\\b${parLower}\\b`, 'i');
      return regex.test(direccionLower);
    });

    console.log(`   Fallback CABA: ${esCABA}, Partido: ${partidoKeyword}`);

    return {
      esEnAMBA: esCABA || !!partidoKeyword,
      caba: esCABA,
      coordenadas: null,
      partido: partidoKeyword || null,
      detalle: 'Validación por palabra clave (geocodificación falló)',
    };
  }

  const { lat, lng, partido, provincia, formattedAddress } = geoData;

  console.log(`✅ Geocodificación exitosa:`);
  console.log(`   Coordenadas: ${lat}, ${lng}`);
  console.log(`   Partido: ${partido}`);
  console.log(`   Provincia: ${provincia}`);
  console.log(`   Dirección formateada: ${formattedAddress}`);

  // Validar con coordenadas
  const esEnCABA = isWithinCABA(lat, lng);
  const esEnAMBACoordinates = isWithinAMBACoordinates(lat, lng);
  
  // Validar con nombre de partido
  const esPartidoAMBA = isPartidoInAMBA(partido);

  // Resultado final: si está en CABA O en AMBA
  const esEnAMBA = esEnCABA || esEnAMBACoordinates || esPartidoAMBA;

  console.log(`🎯 Resultado:`);
  console.log(`   En CABA: ${esEnCABA}`);
  console.log(`   En AMBA (coordenadas): ${esEnAMBACoordinates}`);
  console.log(`   Partido en AMBA: ${esPartidoAMBA}`);
  console.log(`   RESULTADO FINAL: ${esEnAMBA ? '✅ SÍ' : '❌ NO'}`);

  return {
    esEnAMBA,
    caba: esEnCABA,
    coordenadas: { lat, lng },
    partido,
    provincia,
    formattedAddress,
    detalle: esEnAMBA ? 'Ubicación dentro de CABA/AMBA' : 'Ubicación fuera de cobertura',
  };
}

module.exports = {
  validateLocationAMBA,
  geocodifyAddress,
  isWithinCABA,
  isWithinAMBACoordinates,
  isPartidoInAMBA,
};
