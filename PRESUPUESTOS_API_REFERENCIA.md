# 🔌 EJEMPLOS DE API - PRESUPUESTOS

## Testeo Manual (Postman / cURL)

Todos los endpoints requieren autenticación JWT en header:
```
Authorization: Bearer <tu_jwt_token>
```

---

## 1️⃣ CREAR PRESUPUESTO (Admin)

**Endpoint:**
```
POST /api/quotes
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "clientId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "producto": "507f1f77bcf86cd799439010",
      "nombre": "Aire Acondicionado 2500W",
      "cantidad": 2,
      "precioUnitario": 450.00
    },
    {
      "producto": "507f1f77bcf86cd799439009",
      "nombre": "Filtro",
      "cantidad": 4,
      "precioUnitario": 25.00
    }
  ],
  "instalacion": {
    "incluye": true,
    "monto": 200.00,
    "descripcion": "Instalación completa"
  },
  "notas": "Cliente VIP - dar seguimiento"
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "numero": "PSP-0001",
  "client": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+5491198765432",
    "direccion": {...}
  },
  "items": [...],
  "totales": {
    "subtotal": 1000.00,
    "instalacion": 200.00,
    "descuento": 0,
    "total": 1200.00
  },
  "estado": "borrador",
  "createdAt": "2026-05-16T18:29:33.562Z"
}
```

---

## 2️⃣ OBTENER TODOS LOS PRESUPUESTOS (Admin)

**Endpoint:**
```
GET /api/quotes/admin/all
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "numero": "PSP-0001",
    "client": {
      "nombre": "Juan Pérez",
      "email": "juan@example.com"
    },
    "totales": {
      "total": 1200.00
    },
    "estado": "enviado",
    "createdAt": "2026-05-16T18:29:33.562Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "numero": "PSP-0002",
    "client": {
      "nombre": "María García",
      "email": "maria@example.com"
    },
    "totales": {
      "total": 800.50
    },
    "estado": "borrador",
    "createdAt": "2026-05-16T18:30:00.000Z"
  }
]
```

---

## 3️⃣ OBTENER PRESUPUESTO POR ID

**Endpoint:**
```
GET /api/quotes/:id
Authorization: Bearer <token>

Ejemplo: GET /api/quotes/507f1f77bcf86cd799439012
```

**Validación:**
- Admin: puede ver cualquiera
- Cliente: solo el suyo

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "numero": "PSP-0001",
  "client": {...},
  "items": [...],
  "instalacion": {...},
  "totales": {...},
  "estado": "enviado",
  "enviado": {
    "fecha": "2026-05-16T18:29:33.562Z",
    "email": "juan@example.com",
    "visto": false,
    "descargadoFecha": "2026-05-16T19:30:00.000Z"
  },
  "notas": "Cliente VIP",
  "createdAt": "2026-05-16T18:29:33.562Z"
}
```

---

## 4️⃣ EDITAR PRESUPUESTO (Admin - solo en borrador)

**Endpoint:**
```
PUT /api/quotes/:id
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "items": [
    {
      "producto": "507f1f77bcf86cd799439010",
      "nombre": "Aire Acondicionado 3000W",
      "cantidad": 1,
      "precioUnitario": 550.00
    }
  ],
  "instalacion": {
    "incluye": false,
    "monto": 0
  },
  "notas": "Cliente cambió de opinión"
}
```

**Response (200):** Presupuesto actualizado

---

## 5️⃣ ENVIAR PRESUPUESTO POR EMAIL (Admin)

**Endpoint:**
```
POST /api/quotes/:id/enviar
Authorization: Bearer <token>
```

**Qué hace:**
1. Genera PDF profesional
2. Envía email a cliente
3. Cambia estado a "enviado"
4. Registra fecha y email

**Response (200):**
```json
{
  "message": "Presupuesto enviado",
  "quote": {
    "numero": "PSP-0001",
    "estado": "enviado",
    "enviado": {
      "fecha": "2026-05-16T18:29:33.562Z",
      "email": "juan@example.com",
      "visto": false
    }
  }
}
```

**Email que recibe cliente:**
```
De: tu-email@gmail.com
Asunto: Presupuesto PSP-0001

Cuerpo HTML con:
- Logo (si existe)
- Número presupuesto
- Datos cliente
- Tabla productos
- TOTAL
- Botones de acción
```

---

## 6️⃣ DESCARGAR PDF

**Endpoint:**
```
GET /api/quotes/:id/pdf
Authorization: Bearer <token>

Ejemplo: GET /api/quotes/507f1f77bcf86cd799439012/pdf
```

**Headers:**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="presupuesto-PSP-0001.pdf"
```

**Response:** Archivo PDF binario

**Qué registra:**
- Si el cliente descarga: registra descargadoFecha

---

## 7️⃣ VER MIS PRESUPUESTOS (Cliente)

**Endpoint:**
```
GET /api/quotes/mis-presupuestos
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "numero": "PSP-0001",
    "client": {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan Pérez"
    },
    "items": [...],
    "totales": {
      "total": 1200.00
    },
    "estado": "enviado",
    "enviado": {
      "fecha": "2026-05-16T18:29:33.562Z",
      "descargadoFecha": "2026-05-16T19:30:00.000Z"
    }
  }
]
```

---

## 8️⃣ CAMBIAR ESTADO (Cliente - Aceptar/Rechazar)

**Endpoint:**
```
PUT /api/quotes/:id/status
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "estado": "aceptado"
}
```

**Estados válidos:**
- `"aceptado"`
- `"rechazado"`

**Response (200):**
```json
{
  "message": "Presupuesto marcado como aceptado",
  "quote": {
    "numero": "PSP-0001",
    "estado": "aceptado"
  }
}
```

---

## 🧪 EJEMPLOS CURL

### Crear presupuesto
```bash
curl -X POST http://localhost:5000/api/quotes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "507f1f77bcf86cd799439011",
    "items": [{
      "producto": "507f1f77bcf86cd799439010",
      "nombre": "Aire",
      "cantidad": 1,
      "precioUnitario": 450
    }],
    "instalacion": {
      "incluye": true,
      "monto": 200
    }
  }'
```

### Enviar presupuesto
```bash
curl -X POST http://localhost:5000/api/quotes/507f1f77bcf86cd799439012/enviar \
  -H "Authorization: Bearer <token>"
```

### Descargar PDF
```bash
curl -X GET http://localhost:5000/api/quotes/507f1f77bcf86cd799439012/pdf \
  -H "Authorization: Bearer <token>" \
  -o presupuesto.pdf
```

### Aceptar presupuesto
```bash
curl -X PUT http://localhost:5000/api/quotes/507f1f77bcf86cd799439012/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"estado": "aceptado"}'
```

---

## 🔍 CÓDIGOS DE RESPUESTA

| Código | Significado |
|--------|-------------|
| `200` | OK - Éxito |
| `201` | CREATED - Presupuesto creado |
| `400` | Bad Request - Datos inválidos |
| `403` | Forbidden - No tienes permiso |
| `404` | Not Found - Presupuesto no existe |
| `500` | Server Error - Error interno |

---

## 🛡️ ERRORES COMUNES

**404 - Presupuesto no encontrado:**
```json
{
  "message": "Presupuesto no encontrado"
}
```
→ Verifica que el ID es correcto

**403 - No autorizado:**
```json
{
  "message": "No autorizado"
}
```
→ Solo admin puede hacer esto O no es tu presupuesto

**400 - Cliente no encontrado:**
```json
{
  "message": "Cliente no encontrado"
}
```
→ Verifica que el clientId existe

**400 - Solo se pueden editar presupuestos en borrador:**
```json
{
  "message": "Solo se pueden editar presupuestos en borrador"
}
```
→ Presupuesto ya fue enviado

---

## 🔐 VALIDACIONES

- ✓ Cliente ID debe existir
- ✓ Items array no puede estar vacío
- ✓ Cantidad y precioUnitario deben ser > 0
- ✓ Solo admin puede crear/editar
- ✓ Solo cliente dueño puede aceptar/rechazar
- ✓ Estado debe ser "aceptado" o "rechazado"

---

## 📊 ESTRUCTURA DE DATOS

```javascript
Quote {
  _id: ObjectId,
  numero: String (PSP-0001),
  client: {
    _id: ObjectId,
    nombre: String,
    email: String,
    telefono: String,
    direccion: {
      calle: String,
      ciudad: String,
      provincia: String
    }
  },
  items: [{
    producto: ObjectId,
    nombre: String,
    cantidad: Number,
    precioUnitario: Decimal,
    subtotal: Decimal
  }],
  instalacion: {
    incluye: Boolean,
    monto: Decimal,
    descripcion: String
  },
  totales: {
    subtotal: Decimal,
    instalacion: Decimal,
    descuento: Decimal,
    total: Decimal
  },
  notas: String,
  estado: String (borrador|enviado|aceptado|rechazado),
  enviado: {
    fecha: Date,
    email: String,
    visto: Boolean,
    descargadoFecha: Date
  },
  createdBy: ObjectId (User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📝 NOTAS

- Los números de presupuesto se generan automáticamente
- No se pueden editar presupuestos después de "enviado"
- Los clientes solo pueden ver sus presupuestos
- Los emails se envían vía Gmail (configurable en .env)
- Los PDFs se generan sobre la marcha (no se guardan)
