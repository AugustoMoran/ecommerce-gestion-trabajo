# 🧪 GUÍA COMPLETA - TESTS DE INSTALACIÓN POR UBICACIÓN

## 🎯 OBJETIVO

Validar que:
- ✅ Usuarios **DENTRO** de AMBA/CABA **VEN** opción de instalación
- ❌ Usuarios **FUERA** de AMBA/CABA **NO VEN** opción de instalación

## 📊 DIRECCIONES DE PRUEBA

### ✅ DENTRO DE AMBA/CABA (4 usuarios)

| Usuario | Email | Dirección | Zona | Esperado |
|---------|-------|-----------|------|----------|
| User AMBA 1 | moron.user@test.com | Calle Principal 123, Morón, BA | AMBA | ✅ Ver instalación |
| User AMBA 2 | sanisidro.user@test.com | Av. del Libertador 456, San Isidro, BA | AMBA | ✅ Ver instalación |
| User AMBA 3 | avellaneda.user@test.com | Mitre 789, Avellaneda, BA | AMBA | ✅ Ver instalación |
| User CABA | flores.user@test.com | Av. Rivadavia 321, Flores, CABA | CABA | ✅ Ver instalación |

**Password (todos):** `TestPassword123!`

### ❌ FUERA DE AMBA/CABA (4 usuarios)

| Usuario | Email | Dirección | Zona | Esperado |
|---------|-------|-----------|------|----------|
| User Fuera 1 | laplata.user@test.com | Calle 7 100, La Plata, BA | La Plata | ❌ NO ver |
| User Fuera 2 | mardel.user@test.com | Av. Luro 500, Mar del Plata, BA | Mar del Plata | ❌ NO ver |
| User Fuera 3 | cordoba.user@test.com | Calle 9 de Julio 200, Córdoba, Córdoba | Córdoba | ❌ NO ver |
| User Fuera 4 | mendoza.user@test.com | Av. San Martín 150, Mendoza, Mendoza | Mendoza | ❌ NO ver |

**Password (todos):** `TestPassword123!`

---

## 🚀 PASOS PARA EJECUTAR

### PASO 1: Levantar Backend

```bash
cd backend
npm run dev
```

**Espera hasta ver:**
```
✅ Database connected
✅ Server running on port 5000
```

### PASO 2: Crear Usuarios de Prueba

En **otra terminal**:

```bash
cd backend
node seeds/seed_test_addresses.js
```

**Output esperado:**
```
✅ Connected to MongoDB
🗑️  Usuarios de prueba anteriores eliminados

📍 CREANDO USUARIOS CON DIRECCIONES DENTRO DE AMBA/CABA

✅ Test User AMBA 1
   📍 Dirección: Calle Principal 123, Morón, Buenos Aires
   ✓ Esperado: AMBA

✅ Test User AMBA 2
   📍 Dirección: Avenida del Libertador 456, San Isidro, Buenos Aires
   ✓ Esperado: AMBA

✅ Test User AMBA 3
   📍 Dirección: Mitre 789, Avellaneda, Buenos Aires
   ✓ Esperado: AMBA

✅ Test User CABA
   📍 Dirección: Av. Rivadavia 321, Flores, Ciudad de Buenos Aires
   ✓ Esperado: CABA

❌ CREANDO USUARIOS CON DIRECCIONES FUERA DE AMBA/CABA

✅ Test User Fuera 1
   📍 Dirección: Calle 7 100, La Plata, Buenos Aires
   ✗ Esperado: NO CABA/AMBA

[... más usuarios ...]

🎉 SEED COMPLETADO EXITOSAMENTE
```

### PASO 3: Ejecutar Tests de Validación de Ubicación

En **otra terminal**:

```bash
cd backend
node test_installation_by_location.js
```

**Output esperado:**
```
🔌 VERIFICANDO BACKEND
✅ Backend respondiendo en http://localhost:5000

═══════════════════════════════════════════════════════════════════
✅ TEST 1: DIRECCIONES DENTRO DE AMBA/CABA
═══════════════════════════════════════════════════════════════════

✅ [1/4] Morón, Buenos Aires
       Ubicación: AMBA
       Partido: Morón
       Coordenadas: -34.6458, -58.6200
       ✨ Instalación: DISPONIBLE (SÍ mostrar)

✅ [2/4] San Isidro, Buenos Aires
       Ubicación: AMBA
       Partido: San Isidro
       Coordenadas: -34.4769, -58.5316
       ✨ Instalación: DISPONIBLE (SÍ mostrar)

✅ [3/4] Avellaneda, Buenos Aires
       Ubicación: AMBA
       Partido: Avellaneda
       Coordenadas: -34.7637, -58.3634
       ✨ Instalación: DISPONIBLE (SÍ mostrar)

✅ [4/4] Flores, Ciudad de Buenos Aires
       Ubicación: CABA
       Coordenadas: -34.6306, -58.4462
       ✨ Instalación: DISPONIBLE (SÍ mostrar)

═══════════════════════════════════════════════════════════════════
❌ TEST 2: DIRECCIONES FUERA DE AMBA/CABA
═══════════════════════════════════════════════════════════════════

✅ [1/4] La Plata, Buenos Aires
       Ubicación: NO CABA/AMBA
       ⚠️  Instalación: NO disponible (NO mostrar)

✅ [2/4] Mar del Plata, Buenos Aires
       Ubicación: NO CABA/AMBA
       ⚠️  Instalación: NO disponible (NO mostrar)

✅ [3/4] Córdoba, Córdoba
       Ubicación: NO CABA/AMBA
       ⚠️  Instalación: NO disponible (NO mostrar)

✅ [4/4] Mendoza, Mendoza
       Ubicación: NO CABA/AMBA
       ⚠️  Instalación: NO disponible (NO mostrar)

═══════════════════════════════════════════════════════════════════
📊 RESUMEN DE TESTS
═══════════════════════════════════════════════════════════════════

✅ DENTRO DE AMBA/CABA:
   Pasados: 4/4
   Fallidos: 0/4

❌ FUERA DE AMBA/CABA:
   Pasados: 4/4
   Fallidos: 0/4

📈 TOTAL:
   Pasados: 8/8
   Fallidos: 0/8

🎉 TODOS LOS TESTS PASARON
✨ Sistema de instalación por ubicación está funcionando correctamente
```

### PASO 4: Levantar Frontend

```bash
cd frontend
npm run dev
```

**Espera hasta ver:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### PASO 5: Test Manual en Browser (OPCIONAL)

Abre: **http://localhost:5173**

#### Test A: Usuario DENTRO (Morón)

1. Click en "Login" o "Mi Cuenta"
2. Email: `moron.user@test.com`
3. Password: `TestPassword123!`
4. Login
5. Ir a "Checkout" o "Carrito"
6. Ingresa dirección o usa la del usuario
7. **Debe mostrar:** ✅ Verde "Cobertura disponible" + checkbox "✨ Instalación a domicilio"

#### Test B: Usuario FUERA (La Plata)

1. Logout
2. Login con: `laplata.user@test.com`
3. Password: `TestPassword123!`
4. Ir a "Checkout"
5. **Debe mostrar:** ❌ Ámbar "Fuera de cobertura" + SIN checkbox de instalación

---

## 🧪 OPCIÓN: Tests Automatizados React

Si quieres ejecutar tests Jest:

```bash
cd frontend
npm run test -- test_installation_display.test.js
```

**Output esperado:**
```
PASS  src/__tests__/test_installation_display.test.js

 🌍 TESTS - Opción de Instalación por Ubicación
  ✅ Usuarios DENTRO de AMBA/CABA
    ✓ Morón (AMBA): DEBERÍA mostrar opción de instalación
    ✓ San Isidro (AMBA): DEBERÍA mostrar opción de instalación
    ✓ Avellaneda (AMBA): DEBERÍA mostrar opción de instalación
    ✓ Flores (CABA): DEBERÍA mostrar opción de instalación
    ✓ todos los usuarios DENTRO deberían poder ver instalación

  ❌ Usuarios FUERA de AMBA/CABA
    ✓ La Plata: NO debería mostrar opción de instalación
    ✓ Mar del Plata: NO debería mostrar opción de instalación
    ✓ Córdoba: NO debería mostrar opción de instalación
    ✓ Mendoza: NO debería mostrar opción de instalación
    ✓ todos los usuarios FUERA no deberían ver instalación

  🔧 Componente InstallationOption
    ✓ debería renderizar cuando disponible=true
    ✓ NO debería renderizar cuando disponible=false
    ✓ debería actualizar precio cuando checkbox se selecciona

  🔗 Integración Completa
    ✓ flujo completo: usuario DENTRO → valida → muestra instalación
    ✓ flujo completo: usuario FUERA → valida → NO muestra instalación

  ⚠️ Edge Cases
    ✓ debería manejar null/undefined ubicación
    ✓ debería manejar dirección mal escrita
    ✓ debería manejar zoom en dirección

  📊 RESUMEN DE TESTS - MATRIZ DE VALIDACIÓN
    ✓ genera matriz de validación completa

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
```

---

## 📋 CHECKLIST DE VALIDACIÓN

Después de ejecutar todos los tests:

- [ ] Backend corre sin errores
- [ ] Usuarios de prueba creados exitosamente
- [ ] Test de ubicación: 8/8 pasados ✅
- [ ] 4 usuarios DENTRO de AMBA/CABA
- [ ] 4 usuarios FUERA de AMBA/CABA
- [ ] Dentro muestran: ✅ Verde + checkbox de instalación
- [ ] Fuera muestran: ❌ Ámbar + SIN checkbox
- [ ] Tests de React pasan 19/19 ✅
- [ ] Test manual en browser confirma el comportamiento

---

## 🎯 RESULTADOS ESPERADOS

### Matriz de Validación

| Usuario/Zona | Email | Dirección | Ubicación | Mostrar Instalación | Estado |
|---|---|---|---|---|---|
| **Morón** | moron.user@test.com | Calle Principal 123, Morón | AMBA | ✅ SÍ | ✅ PASS |
| **San Isidro** | sanisidro.user@test.com | Av. Libertador 456, San Isidro | AMBA | ✅ SÍ | ✅ PASS |
| **Avellaneda** | avellaneda.user@test.com | Mitre 789, Avellaneda | AMBA | ✅ SÍ | ✅ PASS |
| **Flores** | flores.user@test.com | Av. Rivadavia 321, Flores | CABA | ✅ SÍ | ✅ PASS |
| **La Plata** | laplata.user@test.com | Calle 7 100, La Plata | No CABA/AMBA | ❌ NO | ✅ PASS |
| **Mar del Plata** | mardel.user@test.com | Av. Luro 500, Mar del Plata | No CABA/AMBA | ❌ NO | ✅ PASS |
| **Córdoba** | cordoba.user@test.com | Calle 9 de Julio 200, Córdoba | No CABA/AMBA | ❌ NO | ✅ PASS |
| **Mendoza** | mendoza.user@test.com | Av. San Martín 150, Mendoza | No CABA/AMBA | ❌ NO | ✅ PASS |

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar todos los tests
2. ✅ Validar que aparezca/desaparezca la opción de instalación
3. ✅ Deploy a producción
4. ⏳ Integración con sistema de pagos (webhook MP)
5. ⏳ Admin dashboard con mapa de zonas

---

## 📞 TROUBLESHOOTING

### Backend no conecta a MongoDB
```bash
# Verificar que MongoDB está corriendo
mongod --version

# O en Docker
docker ps
```

### Tests fallan con error de conexión
```bash
# Reiniciar backend
cd backend
npm run dev
```

### Usuario no se crea
```bash
# Verificar modelo User
cat backend/src/models/User.js

# Verificar conexión a BD
node backend/seeds/seed_test_addresses.js
```

### Opción de instalación no aparece/desaparece
1. Verificar que LocationValidator está integrado en checkout
2. Verificar que LocationValidator llama a onValidationChange
3. Verificar que InstallationOption recibe esEnAMBA correcto
4. Revisar console del browser para errores

