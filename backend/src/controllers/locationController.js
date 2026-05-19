/**
 * 🗺️ CONTROLLER - VALIDACIÓN DE GEOLOCALIZACIÓN
 * 
 * Endpoints para validar ubicaciones CABA/AMBA
 */

const { validateLocationAMBA } = require('../utils/geovalidation');

/**
 * POST /api/location/validate
 * Valida si una dirección está en CABA/AMBA
 * 
 * Body: { direccion: "Morón, Buenos Aires" }
 * Response: { esEnAMBA, caba, coordenadas, partido, detalle }
 */
const validateLocation = async (req, res, next) => {
  try {
    const { direccion } = req.body;

    if (!direccion || direccion.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Dirección requerida',
        error: true 
      });
    }

    console.log(`\n📌 Validando ubicación: ${direccion}`);

    const result = await validateLocationAMBA(direccion);

    res.json({
      ...result,
      error: false,
    });
  } catch (error) {
    console.error('❌ Error en validateLocation:', error.message);
    res.status(500).json({ 
      message: 'Error validando ubicación',
      error: true,
      details: error.message,
    });
  }
};

/**
 * GET /api/location/check-installation-available
 * Verifica si instalación está disponible en la ubicación del usuario
 * 
 * Query: ?direccion=Morón,Buenos Aires
 * Response: { disponible: true/false, razon: string }
 */
const checkInstallationAvailable = async (req, res, next) => {
  try {
    const { direccion } = req.query;

    if (!direccion) {
      return res.status(400).json({ 
        message: 'Parámetro "direccion" requerido',
        disponible: false,
      });
    }

    console.log(`🔍 Verificando disponibilidad de instalación: ${direccion}`);

    const validation = await validateLocationAMBA(direccion);

    if (!validation.esEnAMBA) {
      return res.json({
        disponible: false,
        razon: 'La instalación solo está disponible en CABA y AMBA',
        ubicacion: validation.detalle,
      });
    }

    res.json({
      disponible: true,
      razon: 'Instalación disponible en tu zona',
      esCABA: validation.caba,
      partido: validation.partido,
    });
  } catch (error) {
    console.error('❌ Error en checkInstallationAvailable:', error.message);
    res.status(500).json({ 
      message: 'Error verificando disponibilidad',
      disponible: false,
      details: error.message,
    });
  }
};

module.exports = {
  validateLocation,
  checkInstallationAvailable,
};
