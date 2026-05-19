const Settings = require('../models/Settings');

const getExchangeRate = async () => {
  try {
    console.log('🔄 [Service] getExchangeRate - buscando USD_TO_ARS');
    const setting = await Settings.findOne({ key: 'USD_TO_ARS' });
    console.log('🔄 [Service] Setting encontrado:', setting);
    
    let value = setting?.value || 1000;
    
    // Handle case where value is stored as object { rate: number } instead of plain number
    if (typeof value === 'object' && value.rate) {
      console.log('⚠️ [Service] Valor era objeto, extrayendo .rate:', value.rate);
      value = value.rate;
    }
    
    console.log('✅ [Service] Retornando:', value);
    return value;
  } catch (error) {
    console.error('❌ [Service] Error fetching exchange rate:', error);
    return 1000;
  }
};

const updateExchangeRate = async (rate) => {
  try {
    console.log('🔄 [Service] updateExchangeRate:', rate);
    const setting = await Settings.findOneAndUpdate(
      { key: 'USD_TO_ARS' },
      { value: rate },
      { upsert: true, new: true }
    );
    console.log('✅ [Service] Actualizado en DB:', setting);
    return setting;
  } catch (error) {
    console.error('❌ [Service] Error:', error);
    throw Object.assign(new Error('Error actualizando cotización del dólar'), { statusCode: 500 });
  }
};

const getAllSettings = async () => {
  try {
    const settings = await Settings.find();
    return settings;
  } catch (error) {
    throw Object.assign(new Error('Error obteniendo configuraciones'), { statusCode: 500 });
  }
};

module.exports = {
  getExchangeRate,
  updateExchangeRate,
  getAllSettings,
};
