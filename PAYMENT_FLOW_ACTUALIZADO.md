# 📋 FLUJO DE PAGOS - CONFIGURACIÓN ACTUALIZADA

## ✅ CAMBIOS REALIZADOS

Se corrigió el envío de emails para que se disparen en el momento correcto según el método de pago.

---

## 🔄 FLUJO ACTUAL (CORRECTO)

### **MERCADO PAGO**

```
1️⃣ CLIENTE COMPRA
   ↓
2️⃣ POST /api/orders (createOrder)
   ├─ Valida stock ✅
   ├─ Valida tallas/colores ✅
   ├─ Aplica cupón ✅
   ├─ Crea orden con:
   │  └─ estadoPago: 'pendiente'
   │  └─ estadoEnvio: 'pendiente'
   │  └─ stockDeducido: false
   ├─ ❌ NO ENVÍA EMAILS TODAVÍA
   └─ Devuelve mpData (preferenceId, initPoint)
   
3️⃣ Frontend REDIRIGE A CHECKOUT MP
   
4️⃣ CLIENTE PAGA EN MERCADO PAGO
   
5️⃣ MP ENVÍA WEBHOOK AL BACKEND
   └─ POST /api/webhook/mercadopago
   
6️⃣ WEBHOOK PROCESA:
   ├─ Valida firma ✅
   ├─ Obtiene datos de pago de MP
   ├─ Valida monto ✅
   └─ SI status = 'approved':
      ├─ order.estadoPago = 'aprobado'
      ├─ order.metodoPago = 'mercadopago'
      ├─ order.estadoEnvio = 'pendiente'
      ├─ Limpia carrito del usuario
      ├─ ✅ ENVÍA EMAIL AL CLIENTE (ahora dice "✅ PAGADO")
      ├─ ✅ ENVÍA EMAIL AL ADMIN (con estado aprobado)
      └─ Devuelve 200 OK
   
7️⃣ ADMIN VE ORDEN EN DASHBOARD (estado: aprobado)

8️⃣ ADMIN DESPACHA
   └─ POST /api/orders/dispatch
   ├─ order.estadoEnvio = 'enviado'
   ├─ ✅ ENVÍA EMAIL DE ENVÍO AL CLIENTE
   └─ Devuelve orden actualizada

9️⃣ ADMIN FINALIZA
   └─ POST /api/orders/{orderId}/finalize
   ├─ Descuenta stock ✅
   ├─ order.stockDeducido = true
   └─ Completa el flujo
```

---

### **WHATSAPP**

```
1️⃣ CLIENTE SELECCIONA MÉTODO "WHATSAPP"
   
2️⃣ POST /api/orders (createOrder)
   ├─ Valida stock ✅
   ├─ Aplica cupón ✅
   ├─ Crea orden con:
   │  └─ estadoPago: 'pendiente'
   │  └─ metodoPago: 'whatsapp'
   │  └─ estadoEnvio: 'pendiente'
   ├─ ✅ ENVÍA EMAIL AL CLIENTE (inmediatamente)
   │  └─ Contiene: "Te contactaremos por WhatsApp"
   ├─ ✅ ENVÍA EMAIL AL ADMIN (inmediatamente)
   │  └─ Contiene: "Nueva orden - En espera de confirmación"
   └─ Devuelve orden
   
3️⃣ ADMIN NEGOCIA POR WHATSAPP CON CLIENTE
   
4️⃣ ADMIN ACTUALIZA MANUALMENTE EN DASHBOARD
   └─ PUT /api/orders/{orderId}
   ├─ order.estadoPago = 'aprobado'
   ├─ order.estadoEnvio = 'pendiente'
   └─ Devuelve orden actualizada
   
5️⃣ ADMIN DESPACHA
   └─ POST /api/orders/dispatch
   ├─ order.estadoEnvio = 'enviado'
   ├─ ✅ ENVÍA EMAIL DE ENVÍO AL CLIENTE
   └─ Devuelve orden actualizada

6️⃣ ADMIN FINALIZA
   └─ POST /api/orders/{orderId}/finalize
   ├─ Descuenta stock ✅
   └─ Completa el flujo
```

---

## 📧 EMAILS ENVIADOS EN CADA FASE

### **MERCADO PAGO - Email Cliente**
**CUÁNDO:** Cuando webhook confirma pago aprobado  
**CONTENIDO:**
- Nombre del cliente
- ✅ Código de orden (grande y destacado)
- ✅ **Estado: PAGADO** ← Ahora dice PAGADO, no Pendiente
- Detalles de items
- Total
- Método de pago: "Mercado Pago"

### **MERCADO PAGO - Email Admin**
**CUÁNDO:** Cuando webhook confirma pago aprobado  
**CONTENIDO:**
- Código de orden
- Datos del cliente (nombre, email, teléfono, dirección)
- ✅ **Método: Mercado Pago - APROBADO** ← Ahora aparece APROBADO
- Items completos
- Total

### **WHATSAPP - Email Cliente**
**CUÁNDO:** Al crear la orden  
**CONTENIDO:**
- Nombre del cliente
- Código de orden
- ⏳ **Estado: Pago pendiente** ← Es correcto para WhatsApp
- Detalles de items
- "Te contactaremos por WhatsApp para confirmar tu pago"

### **WHATSAPP - Email Admin**
**CUÁNDO:** Al crear la orden  
**CONTENIDO:**
- Código de orden
- Datos del cliente
- ⏳ **Método: WhatsApp - pendiente** ← Esperando negociación
- Items y total

### **ENVÍO - Email Cliente**
**CUÁNDO:** Admin hace dispatch  
**CONTENIDO:**
- Código de seguimiento
- Estado: "Enviado"
- "Tu pedido está en camino"

---

## 🔐 VALIDACIONES CRÍTICAS

### **En createOrder (POST /api/orders):**
- ❌ Stock insuficiente → Error 400
- ❌ Talla no disponible → Error 400
- ❌ Color no disponible → Error 400
- ❌ Cupón inválido → Error 400
- ❌ Sin datos del comprador → Error 400

### **En webhook (Mercado Pago):**
- ✅ Valida firma (si MP_WEBHOOK_SECRET está configurado)
- ✅ Si pago no aprobado → Actualiza estado, NO envía emails
- ✅ Si orden no existe → Ignora silenciosamente (200 OK)
- ✅ Si monto no coincide → Rechaza (400)
- ✅ Si orden ya procesada → Ignora (200 OK, evita duplicados)

### **En dispatchOrder:**
- ❌ Orden ya fue despachada → Error 400
- ✅ Marca como "enviado"
- ✅ Envía email de envío

### **En finalizeOrder:**
- ❌ Pago no aprobado → Error 400
- ❌ Envío no "enviado" o "entregado" → Error 400
- ❌ Stock insuficiente (sin force) → Error 400
- ✅ Con force=true → Permite stock negativo
- ✅ Descuenta stock

---

## 📊 CICLO DE VIDA DEL STOCK

### **No se descuenta al crear la orden**
```
⏱️ CREACIÓN → estadoPago: 'pendiente', stockDeducido: false
```

### **No se descuenta al aprobar pago (MP)**
```
💳 WEBHOOK APROBADO → estadoPago: 'aprobado', stockDeducido: false
```

### **SE DESCUENTA cuando admin FINALIZA**
```
✅ Admin: POST /api/orders/{orderId}/finalize

// Backend resta stock:
for each item {
  Product.stock -= item.cantidad
  Product.vendidos += item.cantidad
}

order.stockDeducido = true
```

---

## 🧪 CÓMO TESTEAR

### **1. MERCADO PAGO - Test Completo**

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Test
node backend/test_mp_integration.js
```

**Esto hace:**
1. ✅ Crea orden (estado: pendiente)
2. ✅ Verifica que NO se envían emails
3. ✅ Simula webhook de pago aprobado
4. ✅ Verifica que orden actualiza a "aprobado"
5. ✅ Verifica que SE ENVÍAN emails (cliente + admin)
6. ✅ Verifica que emails dicen "PAGADO" y "APROBADO"

### **2. WHATSAPP - Test Completo**

```bash
node backend/test_whatsapp_flow.js
```

**Esto hace:**
1. ✅ Crea orden (estado: pendiente)
2. ✅ Verifica que SE ENVÍAN emails (cliente + admin)
3. ✅ Admin actualiza manualmente a "aprobado"
4. ✅ Verifica que orden está "aprobado"

### **3. UI - Prueba Manual**

```bash
# En http://localhost:5173
# 1. Ir a /productos
# 2. Agregar producto a carrito
# 3. Ir a checkout
# 4. Seleccionar "Mercado Pago"
# 5. Pagar con tarjeta de prueba
# 6. Verificar en admin que orden aparece con estado "aprobado"
# 7. Revisar email: debe decir "✅ PAGADO"
```

---

## 🚨 LOGS CLAVE PARA DEBUGGING

### **Cuando se CREA una orden (MP):**
```
✅ Validation passed, creating order...
✅ Order created: 507f1f77bcf86cd799439012
   Order code: ORD-2024051303456
💳 Creating Mercado Pago preference...
✅ MP preference linked: 1234567890
```
⚠️ **NO debe haber:** "Enviando email"

### **Cuando WEBHOOK llega (MP pagado):**
```
🔔 Webhook recibido: { type: 'payment', data: { id: 123 } }
📊 Procesando pago ID: 123
✅ Pago aprobado para orden ORD-2024051303456
📦 Orden encontrada: ORD-2024051303456
💾 Orden actualizada: ORD-2024051303456
📧 Enviando emails para orden aprobada: ORD-2024051303456
✅ Email de confirmación enviado a cliente: juan@example.com
✅ Notificación admin enviada para orden ORD-2024051303456
```

### **Cuando se CREA una orden (WhatsApp):**
```
✅ Validation passed, creating order...
✅ Order created: 507f1f77bcf86cd799439013
   Order code: ORD-2024051303457
✅ Email confirmación enviado a juan@example.com
✅ Notificación admin enviada para orden ORD-2024051303457
```
✅ **DEBE haber:** "Email confirmación enviado" y "Notificación admin"

---

## 🔧 ARCHIVOS MODIFICADOS

1. **`backend/src/services/orderService.js`**
   - Cambio: Emails de admin solo para WhatsApp (no para MP)
   - Razón: Para MP, los emails se envían desde el webhook

2. **`backend/src/controllers/webhookController.js`**
   - Cambio: Agregado envío de email a admin cuando webhook confirma pago
   - Razón: Para que el admin reciba notificación con estado "aprobado"

---

## ⚠️ NOTAS IMPORTANTES

1. **Los emails para Mercado Pago se envían DESDE EL WEBHOOK**, no cuando se crea la orden
2. **Los emails para WhatsApp se envían INMEDIATAMENTE**, porque la orden se confirma manualmente
3. **El stock NO se descuenta** hasta que admin finaliza la orden (permite control administrativo)
4. **El webhook debe ser accesible desde internet** (HTTPS con certificado válido)
   - En desarrollo: usa ngrok para exponer http://localhost:5000
5. **MP_WEBHOOK_SECRET es opcional** - si no está, la firma no se valida en desarrollo

---

## 📝 RESUMEN DE CAMBIOS POR MÉTODO

| Fase | Mercado Pago | WhatsApp |
|------|--------------|----------|
| **Crear Orden** | Estado: pendiente, ❌ NO envía emails | Estado: pendiente, ✅ Envía emails |
| **Webhook / Admin confirma** | Webhook confirma, ✅ **Envía emails** | Admin actualiza, NO envía emails |
| **Dispatch** | ✅ Envía email de envío | ✅ Envía email de envío |
| **Finalize** | ✅ Descuenta stock | ✅ Descuenta stock |

