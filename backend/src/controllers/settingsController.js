const settingsService = require('../services/settingsService');

const getExchangeRate = async (req, res, next) => {
  try {
    const rate = await settingsService.getExchangeRate();
    res.json({ rate });
  } catch (error) {
    next(error);
  }
};

const updateExchangeRate = async (req, res, next) => {
  try {
    console.log('🔄 [Backend] updateExchangeRate recibido');
    console.log('🔄 [Backend] Body:', req.body);
    console.log('🔄 [Backend] User:', req.user?.email, 'Role:', req.user?.role);
    
    const { rate } = req.body;
    
    if (!rate || rate <= 0 || isNaN(rate)) {
      console.log('❌ [Backend] Tasa inválida:', rate);
      return res.status(400).json({ message: 'Cotización debe ser mayor a 0' });
    }
    
    console.log('✅ [Backend] Tasa válida:', rate);
    const setting = await settingsService.updateExchangeRate(rate);
    console.log('✅ [Backend] Actualizado:', setting);
    
    res.json({ message: 'Cotización actualizada', setting });
  } catch (error) {
    console.error('❌ [Backend] Error:', error);
    next(error);
  }
};

const getAllSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExchangeRate,
  updateExchangeRate,
  getAllSettings,
};
