/**
 * 🗺️ RUTAS - GEOLOCALIZACIÓN
 */

const express = require('express');
const { validateLocation, checkInstallationAvailable } = require('../controllers/locationController');

const router = express.Router();

/**
 * POST /api/location/validate
 * Valida si una dirección está en CABA/AMBA
 */
router.post('/validate', validateLocation);

/**
 * GET /api/location/check-installation-available
 * Verifica si instalación está disponible
 */
router.get('/check-installation-available', checkInstallationAvailable);

module.exports = router;
