# 🧪 GUÍA PASO A PASO - EJECUTAR TESTS

## 🎯 OBJETIVO
Verificar que el sistema de geolocalización CABA/AMBA está 100% funcional

## 📋 PRERREQUISITOS
- [ ] Node.js instalado
- [ ] Backend en `backend/` con MongoDB
- [ ] Frontend en `frontend/` con React
- [ ] GOOGLE_MAPS_API_KEY en `.env` (opcional para tests básicos)

---

## 🚀 OPCIÓN 1: TEST INTEGRAL COMPLETO (RECOMENDADO)

### Paso 1: Abrir Terminal 1 (Backend)
```bash
cd backend
npm run dev
```

**Espera hasta ver:**
```
✅ Database connected
✅ Server running on port 5000
```

### Paso 2: Abrir Terminal 2 (Tests)
```bash
cd backend
node test_geovalidation_integral.js
```

**Verás output en vivo:**
```
⏳ Esperando que backend esté listo...

TEST 1: API /location/validate
✅ GET /health (server running)
✅ Validar Morón → esEnAMBA: true
✅ Validar San Isidro → esEnAMBA: true
✅ Validar CABA → caba: true
✅ Validar La Plata → esEnAMBA: false
✅ Validar Mar del Plata → esEnAMBA: false

TEST 2: API /location/check-installation-available
✅ Verificar disponibilidad en Morón
✅ Verificar NO disponibilidad en La Plata

TEST 3: Creación de órdenes con geolocalización
✅ Crear orden en Morón → esEnAMBA guardado
✅ Crear orden en La Plata → esEnAMBA guardado

TEST 4: Consulta de órdenes con geolocalización
✅ Obtener orden Morón y verificar campos geo
✅ Obtener orden La Plata y verificar campos geo

TEST 5: Casos Edge
✅ Dirección vacía → error 400
✅ Dirección inválida → fallback a búsqueda palabra clave

📊 RESUMEN DE TESTS
✅ Passed: 14
❌ Failed: 0
📊 Total: 14

🎉 TODOS LOS TESTS PASARON
```

**¿Qué significa?**
- ✅ Todos los endpoints funcionan
- ✅ Validación CABA/AMBA funciona
- ✅ Órdenes se guardan con geolocalización
- ✅ Sistema 100% funcional

---

## 🚀 OPCIÓN 2: TESTS FRONTEND

### Paso 1: Terminal 3 (Frontend)
```bash
cd frontend
npm run dev
```

**Espera hasta ver:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Paso 2: Terminal 4 (Tests Frontend)
```bash
cd frontend
npm run test -- geovalidation_frontend.test.js --watchAll=false
```

**Output esperado:**
```
PASS  src/__tests__/geovalidation_frontend.test.js (5.234s)

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
Snapshots:   0 total
Time:        5.234s
```

---

## 🚀 OPCIÓN 3: TEST MANUAL EN BROWSER

### Paso 1: Asegurate que todo está corriendo
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Paso 2: Abre Browser
```
http://localhost:5173
```

### Paso 3: Ve a la página de checkout (o integra componente)
```
http://localhost:5173/checkout
```

### Paso 4: Prueba direcciones diferentes

#### Test A: Morón (AMBA) ✅
```
1. Ingresa: "Morón"
2. Espera 2 segundos
3. Debe mostrar: Verde "Cobertura disponible"
4. Debe mostrar: "AMBA"
```

#### Test B: La Plata (Fuera AMBA) ❌
```
1. Ingresa: "La Plata"
2. Espera 2 segundos
3. Debe mostrar: Ámbar "Fuera de cobertura"
4. Debe decir: "CABA y AMBA"
```

#### Test C: San Isidro (AMBA) ✅
```
1. Ingresa: "San Isidro"
2. Espera 2 segundos
3. Debe mostrar: Verde "Cobertura disponible"
```

#### Test D: Córdoba (Fuera AMBA) ❌
```
1. Ingresa: "Córdoba"
2. Espera 2 segundos
3. Debe mostrar: Ámbar "Fuera de cobertura"
```

### Paso 5: DevTools - Console
```javascript
// Abre DevTools (F12)
// Vé a Console
// Ingresa una dirección en el input
// Deberías ver en console:
// 🗺️  Validando ubicación: Morón
// ✅ Geocodificación exitosa
// 🎯 Resultado: AMBA=true
```

---

## 📊 MATRIZ DE VALIDACIÓN

Después de ejecutar todos los tests, verificar:

| Item | Esperado | Actual | ✅/❌ |
|------|----------|--------|-------|
| Backend responde | 200 OK | ? | |
| Morón valida ✅ | esEnAMBA: true | ? | |
| La Plata rechaza ❌ | esEnAMBA: false | ? | |
| San Isidro valida ✅ | esEnAMBA: true | ? | |
| CABA valida ✅ | caba: true | ? | |
| Órdenes guardan geo | coordenadas + partido | ? | |
| Frontend renderiza | Sin errores | ? | |
| Componentes responden | Callbacks funcionan | ? | |

---

## 🐛 TROUBLESHOOTING

### Backend no responde
```bash
# Verificar
curl http://localhost:5000/health

# Si falla, reiniciar
cd backend
npm run dev
```

### Tests se quedan en timeout
```bash
# Aumentar espera inicial
sleep 5  # en macOS/Linux
timeout /t 5  # en Windows
node test_geovalidation_integral.js
```

### Google Maps API error
```bash
# Verificar key en .env
echo $GOOGLE_MAPS_API_KEY

# Si está vacío, es normal
# Sistema usa fallback a búsqueda por palabra clave
# Funciona pero menos preciso

# Para precisión máxima, agregar key:
GOOGLE_MAPS_API_KEY=your_actual_key_here
```

### Producto no existe para test de órdenes
```bash
# Seeds database primero
cd backend
npm run seed

# O usar id de producto real de tu BD
```

---

## ✅ VALIDACIÓN FINAL

Cuando TODOS los tests pasen:

```
✅ Backend integral: 14/14 tests ✅
✅ Frontend: 15/15 tests ✅
✅ Manual browser: Todas direcciones funcionan ✅

🎉 SISTEMA 100% FUNCIONAL
```

---

## 📝 NOTAS

- Tests toman ~30 segundos en total
- Google Maps API es opcional (fallback a búsqueda palabra clave)
- Componentes son totalmente funcionales sin API key
- Órdenes se guardan correctamente en todos los casos
- Sistema es no-blocking: si falla validación, orden se crea igual

---

## 🚀 PRÓXIMO PASO

Una vez que TODOS los tests pasen:

1. Integrar `LocationValidator` en tu checkout real
2. Integrar `InstallationZonesDisplay` en el header
3. Testear con usuarios reales
4. Deploy a producción

