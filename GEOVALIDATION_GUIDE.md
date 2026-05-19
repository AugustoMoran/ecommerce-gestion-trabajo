# 🗺️ SISTEMA DE VALIDACIÓN GEOLOCALIZACIÓN - CABA/AMBA

## 📋 RESUMEN

Sistema automático que valida si una dirección está dentro de **CABA o AMBA** (Gran Buenos Aires).

**Sin depender de lo que escriba el usuario** - El backend usa Google Maps Geocoding para:
1. Convertir dirección en coordenadas (latitud/longitud)
2. Validar contra límites geográficos reales
3. Identificar el partido/localidad automáticamente

---

## 🏗️ ARQUITECTURA

### Backend
```
┌─────────────────────────────────────┐
│ POST /api/location/validate         │
│ GET /api/location/check-...         │
└────────────────┬────────────────────┘
                 │
         ┌───────▼────────┐
         │ geovalidation  │ ← Lógica core
         │ - geocodify()  │
         │ - validate()   │
         └───────┬────────┘
                 │
         ┌───────▼────────────────┐
         │ Google Maps Geocoding  │
         │ API                    │
         └────────────────────────┘
```

### Frontend
```
┌──────────────────────────┐
│ CheckoutPage             │
│ - Ingresa dirección      │
└────────────┬─────────────┘
             │
     ┌───────▼──────────┐
     │ LocationValidator│ ← Componente React
     │ - Muestra estado │
     │ - Valida AMBA    │
     └───────┬──────────┘
             │
     ┌───────▼──────────┐
     │ locationApi      │ ← RTK Query hooks
     │ RTK Query        │
     └──────────────────┘
```

---

## 🔧 IMPLEMENTACIÓN

### 1. Backend - Validación de Ubicación

**Archivo:** `backend/src/utils/geovalidation.js`

```javascript
// Función principal
const result = await validateLocationAMBA(direccion);
// Retorna: {
//   esEnAMBA: true/false,
//   caba: boolean,
//   coordenadas: { lat, lng },
//   partido: string,
//   provincia: string,
//   detalle: string
// }
```

**Lógica:**
1. Geocodifica la dirección (Google Maps)
2. Extrae partido y provincia
3. Valida coordenadas contra límites
4. Valida nombre del partido contra lista AMBA
5. Retorna resultado combinado

### 2. Backend - API Endpoints

**POST /api/location/validate**
```bash
curl -X POST http://localhost:5000/api/location/validate \
  -H "Content-Type: application/json" \
  -d '{"direccion": "Morón, Buenos Aires"}'
```

**Response:**
```json
{
  "esEnAMBA": true,
  "caba": false,
  "coordenadas": {
    "lat": -34.6458,
    "lng": -58.6200
  },
  "partido": "Morón",
  "provincia": "Buenos Aires",
  "formattedAddress": "Morón, Buenos Aires, Argentina",
  "detalle": "Ubicación dentro de CABA/AMBA",
  "error": false
}
```

**GET /api/location/check-installation-available**
```bash
curl "http://localhost:5000/api/location/check-installation-available?direccion=Morón,Buenos%20Aires"
```

**Response:**
```json
{
  "disponible": true,
  "razon": "Instalación disponible en tu zona",
  "esCABA": false,
  "partido": "Morón"
}
```

### 3. Backend - Integración con Órdenes

**Archivo:** `backend/src/services/orderService.js`

Cuando se crea una orden:

```javascript
// Automáticamente valida la ubicación
const locationData = await validateLocationAMBA(direccion);

// Guarda en la orden
const order = await Order.create({
  // ... otros campos ...
  esEnAMBA: locationData.esEnAMBA,
  coordenadas: locationData.coordenadas,
  partido: locationData.partido,
  provincia: locationData.provincia,
});
```

### 4. Frontend - Hook RTK Query

**Archivo:** `frontend/src/services/locationApi.js`

```javascript
import { useCheckInstallationAvailableQuery } from './locationApi';

// En tu componente
const { data, isLoading, error } = useCheckInstallationAvailableQuery(direccion);

// data = { disponible, razon, esCABA, partido }
```

### 5. Frontend - Componente React

**Archivo:** `frontend/src/components/location/LocationValidator.jsx`

```jsx
<LocationValidator
  direccion="Morón, Buenos Aires"
  onValidationChange={(disponible, data) => {
    console.log('¿Disponible?', disponible);
    console.log('Datos:', data);
  }}
  showInstallationOption={true}
/>
```

---

## 📊 MODELO DE DATOS

### Order Schema (MongoDB)

```javascript
{
  // ... campos existentes ...
  
  // Geolocalización
  esEnAMBA: Boolean,           // true: en CABA/AMBA, false: fuera, null: sin validar
  coordenadas: {
    lat: Number,               // Latitud obtenida de Google Maps
    lng: Number,               // Longitud obtenida de Google Maps
  },
  partido: String,             // Ej: "Morón", "San Isidro", null si CABA
  provincia: String,           // Ej: "Buenos Aires", "CABA"
}
```

---

## 🗺️ ÁREA DE COBERTURA DEFINIDA

### CABA - Límites geográficos
```
Norte: -34.5630
Sur: -34.7773
Este: -58.3616
Oeste: -58.5121
```

### AMBA Expandido (partidos)
```javascript
[
  'CABA',
  'Avellaneda',
  'Berazategui',
  'Ezeiza',
  'Florencio Varela',
  'Lanús',
  'Lomas de Zamora',
  'Quilmes',
  'Almirante Brown',
  'Morón',
  'Hurlingham',
  'Ituzaingó',
  'La Matanza',
  'Merlo',
  'Tres de Febrero',
  'San Martín',
  'San Isidro',
  'Vicente López',
  // ... más partidos ...
]
```

---

## 🔐 VARIABLES DE ENTORNO NECESARIAS

```bash
# Google Maps Geocoding API
GOOGLE_MAPS_API_KEY=your_api_key_here

# El resto del .env (no cambia)
```

**Cómo obtener Google Maps API Key:**
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto
3. Habilita "Geocoding API"
4. Crea credenciales (API Key)
5. Copia la key a `.env`

---

## 💻 EJEMPLOS DE USO

### Ejemplo 1: Componente en Checkout

```jsx
import LocationValidator from './location/LocationValidator';

export default function Checkout() {
  const [direccion, setDireccion] = useState('');
  const [esEnAMBA, setEsEnAMBA] = useState(null);

  return (
    <div>
      <input
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        placeholder="Ingresa tu dirección"
      />
      
      <LocationValidator
        direccion={direccion}
        onValidationChange={(disponible, data) => {
          setEsEnAMBA(disponible);
          
          // Si NO está en cobertura, ocultar opción de instalación
          if (!disponible) {
            // Mostrar solo envío estándar
          } else {
            // Mostrar envío + instalación
          }
        }}
        showInstallationOption={true}
      />

      {/* Mostrar opciones según esEnAMBA */}
      {esEnAMBA === true && (
        <button>✨ Agregar instalación a domicilio</button>
      )}
    </div>
  );
}
```

### Ejemplo 2: Directamente desde API

```javascript
// Backend
const { validateLocationAMBA } = require('./utils/geovalidation');

const result = await validateLocationAMBA('Morón, Buenos Aires');
console.log(result.esEnAMBA); // true
console.log(result.partido);  // "Morón"

// Frontend - Fetch directo
const response = await fetch('/api/location/validate', {
  method: 'POST',
  body: JSON.stringify({ direccion: 'Morón' }),
});
const data = await response.json();
if (data.esEnAMBA) {
  // Mostrar instalación
}
```

---

## 🧪 TESTING

### Test Manual

```bash
# 1. Backend debe estar corriendo
npm run dev # en /backend

# 2. Prueba API directamente
curl -X POST http://localhost:5000/api/location/validate \
  -H "Content-Type: application/json" \
  -d '{"direccion": "Morón, Buenos Aires"}'

# Debe retornar: esEnAMBA: true, partido: "Morón"

curl -X POST http://localhost:5000/api/location/validate \
  -H "Content-Type: application/json" \
  -d '{"direccion": "La Plata, Buenos Aires"}'

# Debe retornar: esEnAMBA: false
```

### Test en Frontend

```jsx
// 1. Ir a http://localhost:5173
// 2. Abrir DevTools → Console
// 3. Navega al componente LocationValidator
// 4. Ingresa direcciones:
//    - "Morón" → debe validar ✅
//    - "La Plata" → debe rechazar ❌
//    - "San Isidro" → debe validar ✅
//    - "Córdoba" → debe rechazar ❌
```

---

## 📋 CICLO COMPLETO

```
1️⃣ USUARIO INGRESA DIRECCIÓN EN CHECKOUT
   ↓
2️⃣ LocationValidator RECIBE dirección
   ↓
3️⃣ Llama GET /api/location/check-installation-available?direccion=...
   ↓
4️⃣ Backend:
   ├─ Geocodifica con Google Maps
   ├─ Valida coordenadas
   ├─ Valida partido
   └─ Retorna { disponible: true/false, partido, ... }
   ↓
5️⃣ Frontend:
   ├─ Si disponible=true:
   │  └─ MUESTRA botón "Agregar instalación"
   └─ Si disponible=false:
      └─ OCULTA botón "Agregar instalación"
   ↓
6️⃣ Usuario CONFIRMA COMPRA
   ↓
7️⃣ POST /api/orders CREA orden con:
   ├─ esEnAMBA: true/false (guardado en BD)
   ├─ coordenadas: { lat, lng }
   └─ partido: "Morón" | "San Isidro" | etc
   ↓
8️⃣ Admin VE en dashboard si es CABA/AMBA
   └─ Para determinar método de envío
```

---

## 🚨 LOGS PARA DEBUGGING

### Validación exitosa
```
🗺️  Validando ubicación: Morón, Buenos Aires
✅ Geocodificación exitosa:
   Coordenadas: -34.6458, -58.6200
   Partido: Morón
   Provincia: Buenos Aires
🎯 Resultado:
   En CABA: false
   En AMBA (coordenadas): true
   Partido en AMBA: true
   RESULTADO FINAL: ✅ SÍ
```

### Validación fallida
```
🗺️  Validando ubicación: La Plata
✅ Geocodificación exitosa:
   Coordenadas: -34.9205, -57.9537
   Partido: La Plata
   Provincia: Buenos Aires
🎯 Resultado:
   En CABA: false
   En AMBA (coordenadas): false
   Partido en AMBA: false
   RESULTADO FINAL: ❌ NO
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Crear `geovalidation.js` con lógica de validación
- [x] Actualizar modelo Order (agregar campos geolocalización)
- [x] Integrar validación en `orderService.createOrder()`
- [x] Crear `locationController.js` con endpoints
- [x] Crear rutas en `location.js`
- [x] Registrar rutas en `app.js`
- [x] Crear RTK Query hooks (`locationApi.js`)
- [x] Crear componente React `LocationValidator.jsx`
- [x] Crear ejemplo de uso (`CheckoutExample.jsx`)
- [ ] Integrar en página de checkout real
- [ ] Testear con direcciones reales
- [ ] Agregar Google Maps API Key a variables de entorno

---

## 🎯 PRÓXIMOS PASOS

1. **Agregar API Key de Google Maps** a `.env`
2. **Integrar LocationValidator** en tu página de checkout
3. **Mostrar/ocultar opción de instalación** según validación
4. **Admin dashboard** - Mostrar mapa con órdenes por zona

---

## 📞 SUPPORT

Si necesitas ajustar el área de cobertura:
- Editar `AMBA_PARTIDOS` en `geovalidation.js`
- Editar límites en `CABA_BOUNDS` y `AMBA_EXPANDED_BOUNDS`
- Agregar más partidos según necesidad

