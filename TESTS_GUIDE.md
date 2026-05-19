# 🧪 GUÍA DE TESTS - GEOLOCALIZACIÓN CABA/AMBA

## 📋 TESTS IMPLEMENTADOS

### 1. Tests Backend Integral (`test_geovalidation_integral.js`)
- **Qué prueba:** API endpoints, validación de ubicaciones, creación de órdenes con geo
- **Cobertura:** 10+ escenarios diferentes
- **Duración:** ~30 segundos
- **Requisitos:** Backend corriendo en localhost:5000

### 2. Tests Frontend (`frontend/src/__tests__/geovalidation_frontend.test.js`)
- **Qué prueba:** Componentes React, RTK Query, accessibilidad
- **Cobertura:** Renderizado, callbacks, edge cases, responsive
- **Duración:** ~10 segundos
- **Requisitos:** Jest + React Testing Library configurados

### 3. Tests Manuales en Browser
- **Qué prueba:** Flujo completo usuario
- **Pasos:** Ingresa dirección → valida → muestra disponibilidad
- **Requisitos:** Frontend en localhost:5173

---

## 🚀 CÓMO EJECUTAR

### OPCIÓN 1: Test Integral Backend (RECOMENDADO)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Tests
cd backend
node test_geovalidation_integral.js
```

**Output esperado:**
```
✅ GET /health (server running)
✅ Validar Morón → esEnAMBA: true
✅ Validar San Isidro → esEnAMBA: true
✅ Validar CABA → caba: true
✅ Validar La Plata → esEnAMBA: false
✅ Validar Mar del Plata → esEnAMBA: false
✅ Verificar disponibilidad en Morón
✅ Verificar NO disponibilidad en La Plata
✅ Crear orden en Morón → esEnAMBA guardado
✅ Crear orden en La Plata → esEnAMBA guardado
✅ Obtener orden Morón y verificar campos geo
✅ Obtener orden La Plata y verificar campos geo
✅ Dirección vacía → error 400
✅ Dirección inválida → fallback a búsqueda palabra clave

📊 RESUMEN DE TESTS
✅ Passed: 14
❌ Failed: 0
📊 Total: 14

🎉 TODOS LOS TESTS PASARON
```

### OPCIÓN 2: Tests Frontend

```bash
cd frontend
npm run test -- geovalidation_frontend.test.js
```

**Output esperado:**
```
PASS  src/__tests__/geovalidation_frontend.test.js

 InstallationZonesDisplay Component
  ✓ debería renderizar con título por defecto (25ms)
  ✓ debería mostrar AMBA y CABA (10ms)
  ✓ debería mostrar descripción de instalación (8ms)
  ✓ debería renderizar sin título si showTitle=false (12ms)
  ✓ debería aplicar clases de tamaño correctas (15ms)

 LocationValidator Component
  ✓ no debería renderizar sin dirección (5ms)
  ✓ debería mostrar estado "validando" durante la consulta (45ms)
  ✓ debería llamar onValidationChange cuando valida (3200ms)

 Geolocation Integration
  ✓ debería flujo completo (2100ms)

 Accesibilidad
  ✓ debería tener contraste de color suficiente (8ms)
  ✓ debería tener iconos descriptivos (12ms)
  ✓ debería ser responsive (25ms)

 Edge Cases
  ✓ debería manejar dirección muy larga (15ms)
  ✓ debería manejar caracteres especiales (10ms)
  ✓ debería manejar null/undefined gracefully (8ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

### OPCIÓN 3: Test Manual en Browser

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend
cd backend
npm run dev

# Browser: http://localhost:5173
```

**Pasos manuales:**
1. Abre DevTools → Console
2. Ve a `/componentes/location/CheckoutExample` (o integra LocationValidator en checkout)
3. Ingresa direcciones:
   - "Morón" → ✅ Verde "Cobertura disponible"
   - "La Plata" → ⚠️ Ámbar "Fuera de cobertura"
   - "San Isidro" → ✅ Verde "Cobertura disponible"
   - "Córdoba" → ⚠️ Ámbar "Fuera de cobertura"

---

## 🔍 QUÉ SE VALIDA EN CADA TEST

### Test Backend - Validación de Ubicaciones
```
✅ Morón (AMBA)
   - esEnAMBA: true
   - partido: "Morón"
   - coordenadas: { lat: -34.64..., lng: -58.62... }

✅ San Isidro (AMBA)
   - esEnAMBA: true
   - partido: "San Isidro"

✅ CABA
   - caba: true
   - provincia: "CABA"

❌ La Plata (Fuera AMBA)
   - esEnAMBA: false
   - disponible: false

❌ Mar del Plata (Fuera AMBA)
   - esEnAMBA: false
   - disponible: false
```

### Test Backend - Creación de Órdenes
```
✅ Orden Morón
   - order.esEnAMBA = true
   - order.partido = "Morón"
   - order.coordenadas = { lat, lng }
   - order.provincia = "Buenos Aires"

✅ Orden La Plata
   - order.esEnAMBA = false
   - order.coordenadas = { lat, lng }
   - order.provincia = "Buenos Aires"
```

### Test Frontend - Componentes
```
✅ InstallationZonesDisplay
   - Renderiza con título
   - Muestra AMBA y CABA
   - Tiene descripción
   - Responsive (sm, md, lg)

✅ LocationValidator
   - No renderiza sin dirección
   - Muestra estado validando
   - Llama callbacks
   - Maneja edge cases
```

---

## 📊 MATRIZ DE COBERTURA

| Feature | Unit Test | Integration Test | E2E Test |
|---------|-----------|------------------|----------|
| Geocodificación | ✅ | ✅ | ✅ |
| Validación CABA/AMBA | ✅ | ✅ | ✅ |
| API /validate | ✅ | ✅ | ✅ |
| API /check-installation | ✅ | ✅ | ✅ |
| Creación de órdenes | ✅ | ✅ | ⏳ |
| Componente React | ✅ | ✅ | ⏳ |
| Almacenamiento en BD | ✅ | ✅ | ⏳ |
| Edge cases | ✅ | ✅ | ⏳ |
| Accesibilidad | ✅ | ✅ | ⏳ |

---

## 🐛 DEBUGGING

### Si un test falla, verificar:

1. **Backend no responde**
   ```bash
   # En otra terminal, verifica que backend está en 5000
   curl http://localhost:5000/health
   ```

2. **Google Maps API Key no configurada**
   ```bash
   # En .env del backend
   echo $GOOGLE_MAPS_API_KEY
   # Si está vacío, agregar key válida
   ```

3. **MongoDB no conecta**
   ```bash
   # Verificar conexión en logs del backend
   # Debe decir: "✅ Database connected"
   ```

4. **Producto no existe para test de órdenes**
   - Seed database primero: `npm run seed`
   - O usar ID de producto real

---

## ✅ CHECKLIST PRE-DEPLOYMENT

- [ ] `npm run test:integration` pasa al 100%
- [ ] `npm run test:frontend` pasa al 100%
- [ ] Test manual en browser funciona correcto
- [ ] GOOGLE_MAPS_API_KEY configurada en .env
- [ ] MongoDB conecta correctamente
- [ ] Órdenes guardan esEnAMBA, coordenadas, partido
- [ ] API responde correctamente para todas las direcciones
- [ ] Componentes React renderizar sin errores
- [ ] Validación de ubicaciones es rápida (<1s)

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar `node test_geovalidation_integral.js`
2. ✅ Ejecutar `npm run test -- geovalidation_frontend.test.js`
3. ✅ Test manual en browser ingresando direcciones
4. ✅ Verificar órdenes en MongoDB tienen campos geo
5. ✅ Integrar LocationValidator en checkout real
6. ✅ Ir a producción

---

## 📞 TROUBLESHOOTING

### "Cannot find module 'axios'"
```bash
cd backend
npm install axios
```

### "Google Maps API error"
```bash
# Verificar que GOOGLE_MAPS_API_KEY es válido
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Buenos+Aires&key=YOUR_KEY"
```

### "Orden no se crea"
```bash
# Verificar que producto existe
curl http://localhost:5000/api/products/507f1f77bcf86cd799439001
```

### "Tests se quedan en timeout"
```bash
# Aumentar timeout
node test_geovalidation_integral.js --timeout=10000
```

