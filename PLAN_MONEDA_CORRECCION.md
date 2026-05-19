# 🔧 Plan de Corrección: Lógica de Moneda (USD vs ARS)

## ✅ Completado
- ✅ Funciones `getCurrencyByRole()` y `getPriceWithCurrency()` creadas
- ✅ Precios en blanco en ProductDetail
- ✅ Precios en blanco en ProductCard (lista)
- ✅ Indicadores de moneda (USD/ARS) visibles

## ⏳ Pendiente - Implementación

### 1. **Almacenar moneda en carrito** (useCart hook)
- Cuando se agrega un producto: guardar `currency` junto con precio
- Modificar: `frontend/src/hooks/useCart.js`

### 2. **Enviar moneda a backend en orden**
- En Checkout: incluir `currency` para cada item
- Modificar: `frontend/src/pages/Checkout.jsx`

### 3. **Modelo de Order - agregar campo currency**
- Agregar `currency: { type: String, enum: ['USD', 'ARS'] }` a cada item
- Modificar: `backend/src/models/Order.js`

### 4. **Mercado Pago - leer currency dinámicamente**
- Cambiar `currency_id: 'ARS'` → `currency_id: item.currency === 'USD' ? 'USD' : 'ARS'`
- **⚠️ IMPORTANTE**: MP solo acepta ARS en Argentina normalmente
- Modificar: `backend/src/services/mercadopagoService.js`

### 5. **Facturación - usar currency correcto**
- En admin/despachante: usar `item.currency` para facturar correctamente
- Asegurar que se genere factura en la moneda correcta

---

## 📋 Opción A seleccionada (por request del usuario)
Cada item tiene su moneda independiente:
```javascript
{
  producto: "123",
  cantidad: 2,
  precio: 100,
  currency: "USD"  // O "ARS"
}
```

---

## 🚨 Notas importantes
- MP cobra en ARS por defecto en Argentina
- Si el item es USD, probablemente hay que convertir a ARS para MP
- Internamente se guarda USD/ARS para facturación correcta
- El usuario ve siempre su moneda según rol (admin=USD, user=ARS)
