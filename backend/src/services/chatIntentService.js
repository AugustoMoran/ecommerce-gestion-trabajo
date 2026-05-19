/**
 * src/services/chatIntentService.js
 *
 * Provides new intent detection capabilities for the chat controller.
 *
 * DESIGN:
 * - This file only ADDS new intent handling and category intelligence.
 * - It NEVER modifies or replaces any existing chatController logic.
 * - chatController calls detectSpecialIntent() first; if null is returned
 *   the controller falls through to its own existing product-search logic.
 *
 * Responsibilities:
 *  1. TTL-cached category loading from MongoDB.
 *  2. detectSpecialIntent() — checks non-product intents (greeting, orders,
 *     installation, contact, jobs, warranties, price info, payment, shipping).
 *  3. matchCategory() — matches a message to a DB category using its keywords.
 *  4. getDynamicKeywords() — returns a flat keyword list from active categories.
 */

const Category = require('../models/Category');

// ─── Strip accents (mirrors the same helper in chatController) ────────────────
const sa = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// ─── TTL category cache ───────────────────────────────────────────────────────
let _categoryCache = null;
let _categoryCacheAt = 0;
const CATEGORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load active categories from MongoDB, with a 5-minute in-memory cache.
 * On DB error, returns the last cached value (or empty array).
 */
const getCategories = async () => {
  const now = Date.now();
  if (_categoryCache && now - _categoryCacheAt < CATEGORY_CACHE_TTL) {
    return _categoryCache;
  }
  try {
    _categoryCache = await Category.find({ isActive: true })
      .select('nombre keywords')
      .lean();
    _categoryCacheAt = now;
  } catch (_err) {
    _categoryCache = _categoryCache || [];
  }
  return _categoryCache;
};

/** Force-clear the category cache (called when a category is updated). */
const invalidateCategoryCache = () => {
  _categoryCache = null;
  _categoryCacheAt = 0;
};

/**
 * Return a flat array of all normalized keywords from active categories.
 * Used to extend the static PRODUCT_KEYWORDS list in chatController.
 */
const getDynamicKeywords = async () => {
  const cats = await getCategories();
  return cats.flatMap((c) => [
    sa(c.nombre.toLowerCase()),
    ...(c.keywords || []).map((k) => sa(k.toLowerCase())),
  ]);
};

/**
 * Match a normalized message against DB category names and keywords.
 * Returns the first matching category object, or null.
 *
 * @param {string} msgNorm  Accent-stripped lowercase message
 * @returns {object|null}
 */
const matchCategory = async (msgNorm) => {
  const cats = await getCategories();
  for (const cat of cats) {
    const keywords = [cat.nombre, ...(cat.keywords || [])].map((k) =>
      sa(k.toLowerCase())
    );
    if (keywords.some((kw) => msgNorm.includes(kw))) return cat;
  }
  return null;
};

// ─── Shared WhatsApp URL helper ───────────────────────────────────────────────
const waUrl = () => {
  const phone = process.env.WHATSAPP_PHONE || '';
  return phone ? `https://wa.me/${phone}` : '#contacto';
};

// ─── Intent definitions ───────────────────────────────────────────────────────
/**
 * Each intent has:
 *   regex   — pattern tested against the ORIGINAL (unstripped) message
 *   respond — function(context) → { text, products, intent, actions }
 *
 * Order matters: more specific intents first.
 */
const INTENT_DEFINITIONS = [
  // ── Greeting ────────────────────────────────────────────────────────────────
  {
    name: 'greeting',
    regex: /^(hola|buenas?|hey|buen[ao]s?\s+(d[ií]as?|tardes?|noches?)|hi|ola|buenas)\b/i,
    respond: () => ({
      text: '¡Hola! Soy el asistente de la tienda. Puedo ayudarte a:\n\n• Buscar y comparar productos\n• Consultar precios\n• Rastrear pedidos\n• Info sobre instalación y garantías\n• Acceder a la bolsa de trabajo (técnicos)\n\n¿Qué necesitás hoy?',
      products: [],
      intent: 'greeting',
      actions: [
        { type: 'navigate', label: 'Ver catálogo', url: '/productos' },
        { type: 'navigate', label: 'Mis pedidos', url: '/mis-pedidos' },
      ],
    }),
  },

  // ── Order tracking ───────────────────────────────────────────────────────────
  {
    name: 'orders',
    regex: /\b(pedido|orden|compra|seguimiento|track|donde\s+est[aá]|estado\s+de\s+mi|como\s+va\s+mi\s+(pedido|orden|compra)|consultar\s+pedido|rastrear)\b/i,
    respond: () => ({
      text: 'Para consultar tu pedido podés:\n\n• Iniciar sesión → sección "Mis Pedidos"\n• Ingresar el código de seguimiento que recibiste por email\n\nEstados posibles:\n• Pendiente → en espera de confirmación de pago\n• Preparando → el equipo está preparando tu pedido\n• Enviado → en camino, con código de seguimiento\n• Entregado → finalizado exitosamente',
      products: [],
      intent: 'orders',
      actions: [
        { type: 'navigate', label: 'Mis pedidos', url: '/mis-pedidos' },
        { type: 'navigate', label: 'Rastrear por código', url: '/rastrear' },
      ],
    }),
  },

  // ── Installation ─────────────────────────────────────────────────────────────
  {
    name: 'installation',
    regex: /\b(instal[aá]|instalaci[oó]n|montaje|lo\s+instalan|van\s+a\s+instalar|incluye\s+instalaci[oó]n|servicio\s+de\s+instalaci[oó]n|ponen|colocan)\b/i,
    respond: () => ({
      text: 'Sí, ofrecemos servicio de instalación profesional.\n\nDurante el proceso de compra podés agregar la instalación como servicio adicional directamente desde el carrito.\n\nSi necesitás una cotización personalizada para tu instalación, contactá a un asesor por WhatsApp.',
      products: [],
      intent: 'installation',
      actions: [
        { type: 'open_whatsapp', label: 'Consultar instalación', url: waUrl() },
        { type: 'navigate', label: 'Ver productos', url: '/productos' },
      ],
    }),
  },

  // ── Jobs / Bolsa de trabajo ──────────────────────────────────────────────────
  {
    name: 'jobs',
    regex: /\b(bolsa\s+de\s+trabajo|soy\s+t[eé]cnico|panel\s+de\s+t[eé]cnico|tomar\s+trabajo|trabajos\s+disponibles|hay\s+trabajo|empleo|busco\s+trabajo|trabajo\s+de\s+instalaci[oó]n|quiero\s+ser\s+t[eé]cnico)\b/i,
    respond: () => ({
      text: 'La bolsa de trabajo es una sección exclusiva para técnicos registrados.\n\nDesde el panel técnico podés:\n\n• Ver trabajos disponibles con cupos abiertos\n• Tomar uno o más cupos en un trabajo\n• Registrar avances y finalizar trabajos con fotos y observaciones\n• Consultar tu historial de liquidaciones\n\nPara acceder necesitás una cuenta con rol de técnico. Si ya tenés cuenta, ingresá a tu panel.',
      products: [],
      intent: 'jobs',
      actions: [
        { type: 'navigate', label: 'Panel técnico', url: '/tecnico' },
        { type: 'navigate', label: 'Iniciar sesión', url: '/login' },
        { type: 'open_whatsapp', label: 'Consultar por WhatsApp', url: waUrl() },
      ],
    }),
  },

  // ── Warranties / Claims ──────────────────────────────────────────────────────
  {
    name: 'warranty',
    regex: /\b(garant[ií]a|reclamo|reclamar|falla|defecto|devoluci[oó]n|cambio|roto|no\s+funciona|vino\s+mal|producto\s+da[nñ]ado)\b/i,
    respond: () => ({
      text: 'Para gestionar una garantía o reclamo:\n\n• Contactanos por WhatsApp con el código de tu pedido y una descripción del problema\n• Tenemos un sistema de seguimiento de trabajos con historial completo\n• Podemos coordinar visita técnica si el producto fue instalado por nuestro equipo\n\nResponderemos lo antes posible para resolver tu caso.',
      products: [],
      intent: 'warranty',
      actions: [
        { type: 'open_whatsapp', label: 'Gestionar garantía', url: waUrl() },
        { type: 'navigate', label: 'Mis pedidos', url: '/mis-pedidos' },
      ],
    }),
  },

  // ── Contact / Human agent ────────────────────────────────────────────────────
  {
    name: 'contact',
    regex: /\b(hablar\s+con|contactar|asesor(amiento)?|vendedor|persona|humano|whatsapp|llamar|quiero\s+ayuda|necesito\s+ayuda|atencion\s+al\s+cliente|atenci[oó]n\s+al\s+cliente)\b/i,
    respond: () => ({
      text: 'Con gusto te conecto con un asesor. Podés contactarnos por WhatsApp para recibir atención personalizada sobre productos, precios, disponibilidad e instalaciones.',
      products: [],
      intent: 'contact',
      actions: [
        { type: 'open_whatsapp', label: 'Contactar por WhatsApp', url: waUrl() },
      ],
    }),
  },

  // ── Price / Currency info ────────────────────────────────────────────────────
  {
    name: 'price_info',
    regex: /\b(precio\s+en\s+(pesos|d[oó]lares?)|cu[aá]nto\s+cuesta\s+(en\s+)?d[oó]lares?|precio\s+lista|precio\s+(para\s+)?gremio|precio\s+mayorista|precio\s+especial|precio\s+en\s+moneda)\b/i,
    respond: () => ({
      text: 'Los precios se muestran en pesos argentinos (ARS).\n\nSi necesitás un precio especial (gremio, instalador o mayorista), contactá directamente a un asesor para recibir una cotización personalizada.',
      products: [],
      intent: 'price_info',
      actions: [
        { type: 'open_whatsapp', label: 'Solicitar precio especial', url: waUrl() },
      ],
    }),
  },

  // ── Payment methods ──────────────────────────────────────────────────────────
  {
    name: 'payment',
    regex: /\b(c[oó]mo\s+pago|formas?\s+de\s+pago|m[eé]todos?\s+de\s+pago|pagar\s+con|mercado\s+pago|tarjeta|efectivo|transferencia|cuotas|financiaci[oó]n)\b/i,
    respond: () => ({
      text: 'Aceptamos los siguientes medios de pago:\n\n• Mercado Pago (tarjetas de crédito/débito, cuotas)\n• Transferencia bancaria (acordar con el vendedor vía WhatsApp)\n\nPodés elegir el método al finalizar tu compra en el checkout.',
      products: [],
      intent: 'payment',
      actions: [
        { type: 'navigate', label: 'Ver productos', url: '/productos' },
        { type: 'open_whatsapp', label: 'Consultar por WhatsApp', url: waUrl() },
      ],
    }),
  },

  // ── Shipping ─────────────────────────────────────────────────────────────────
  {
    name: 'shipping',
    regex: /\b(env[ií]os?|despacho|llega|demora|plazo\s+de\s+entrega|correo|andreani|oca|flete|retiro|lo\s+mandan|mandan\s+a|env[ií]an|entrega)\b/i,
    respond: () => ({
      text: 'Realizamos envíos a todo el país. Los plazos y costos varían según la zona y el servicio de correo.\n\nTambién podés consultar la opción de retiro en el local si estás cerca.\n\nPara calcular el costo de envío a tu ubicación, contactá a un asesor.',
      products: [],
      intent: 'shipping',
      actions: [
        { type: 'open_whatsapp', label: 'Consultar envío', url: waUrl() },
      ],
    }),
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check the message against all special intent patterns.
 * Returns a complete JSON response object if matched, or null to fall through
 * to the existing product-search logic in chatController.
 *
 * The response always includes a `context` field so the frontend can
 * pass it back in the next request for conversation continuity.
 *
 * @param {string} msg       Original message (used for regex, preserves case)
 * @param {string} msgNorm   Accent-stripped lowercase message (used for context-aware hints)
 * @param {object} context   Optional previous-turn context from the frontend
 * @returns {object|null}
 */
const detectSpecialIntent = (msg, msgNorm, context = {}) => {
  for (const def of INTENT_DEFINITIONS) {
    if (def.regex.test(msg)) {
      const response = def.respond(context);
      // Append conversation context so frontend can send it back next turn
      response.context = { lastIntent: response.intent };
      return response;
    }
  }
  return null;
};

module.exports = {
  getCategories,
  getDynamicKeywords,
  matchCategory,
  detectSpecialIntent,
  invalidateCategoryCache,
};
