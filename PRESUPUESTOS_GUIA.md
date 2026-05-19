# 📋 GUÍA DE USO - SISTEMA DE PRESUPUESTOS (PRESUPUESTOS)

## 🎯 ¿QUÉ ES?
Sistema profesional para que **administradores creen presupuestos** y los **envíen a clientes por email** con PDF adjunto. Los clientes pueden ver sus presupuestos, descargar el PDF y aceptar/rechazar.

---

## 🏗️ ARQUITECTURA

### **ADMIN → Crea Presupuesto → Envía Email → CLIENTE recibe con PDF**

```
Admin Panel                Backend API                    Cliente
┌─────────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Crear Presupuesto   │──▶│ POST /api/quotes │──▶│ Guardar en BD    │
│ - Cliente ID        │   │                  │   │ - Estado: borrador│
│ - Productos         │   │ Generar PDF      │   └──────────────────┘
│ - Instalación       │   │ Enviar Email     │
│ - Monto             │   │                  │   ┌──────────────────┐
│ -Notas internas     │   └──────────────────┘──▶│ Email + PDF      │
└─────────────────────┘      ▼                    │ Notificación     │
      │                   POST /api/quotes/:id/   │                  │
      │                   enviar                  └──────────────────┘
      │                      │
      └─────── Ver todos ────┘
                              │
                              ▼
                    GET /api/quotes/admin/all
                    (Admin ve todos)
```

```
Cliente
┌──────────────────────────┐
│ /mis-presupuestos        │
│ GET /api/quotes/         │
│ mis-presupuestos         │
│                          │
│ Ver presupuestos         │
│ - Descargar PDF          │
│ - Aceptar/Rechazar       │
└──────────────────────────┘
```

---

## 🚀 CÓMO USAR - PASO A PASO

### **1️⃣ ADMIN: Acceder al panel de presupuestos**

1. Inicia sesión como administrador
2. Ve a: **`/admin/presupuestos`** (cuando agreggues el link)
3. Verás tabla con presupuestos existentes (si los hay)
4. Haz click en **"➕ Crear Presupuesto"**

### **2️⃣ ADMIN: Llenar formulario de presupuesto**

**Campos requeridos:**
- **ID de Cliente** (texto)
  - Obtén el ID del cliente desde:
    - `/admin/usuarios` (si existe)
    - Perfil del cliente en la tienda
  - Ejemplo: `507f1f77bcf86cd799439011`

- **Productos** (tabla dinámica)
  - Click **"+ Agregar Producto"**
  - Selecciona producto del dropdown
  - Cantidad (números)
  - Precio Unitario (números decimales)
  - Click ✕ para quitar fila

- **Instalación** (opcional)
  - Checkbox: ✓ "Incluir Instalación"
  - Monto (números decimales)
  - Descripción (texto, ej: "Instalación e puesta en marcha")

- **Notas Internas** (opcional)
  - Solo visible para admin
  - Ej: "Cliente pidió descuento en cantidad"

**Visualización en tiempo real:**
- Subtotal (suma de productos)
- Monto de instalación
- **TOTAL** (Subtotal + Instalación)

### **3️⃣ ADMIN: Guardar presupuesto**

1. Click **"Guardar Presupuesto"**
2. Se crea con estado **"borrador"**
3. Número auto-generado: `PSP-0001`, `PSP-0002`, etc.
4. Reaparece en tabla con badge **amarillo "borrador"**

### **4️⃣ ADMIN: Enviar por email**

1. En tabla, busca el presupuesto en estado "borrador"
2. Click en botón **"📧 Enviar"**
3. Sistema:
   - Genera PDF profesional con logo
   - Envía email con PDF adjunto
   - Cambia estado a **"enviado"** (badge azul)
   - Registra fecha de envío

### **5️⃣ CLIENTE: Recibe email**

Cliente recibe email con:
```
De: tu-email@gmail.com
Asunto: Presupuesto PSP-0001

Cuerpo:
- Logo de empresa
- Número presupuesto
- Datos cliente
- Tabla con productos
- Monto instalación
- TOTAL
- Opción de descarga PDF
- Contacto empresa

Adjunto: presupuesto-PSP-0001.pdf
```

### **6️⃣ CLIENTE: Ve presupuestos**

Cliente accede a: **`/mis-presupuestos`**

Muestra:
- Tarjeta por cada presupuesto
- **Presupuesto #PSP-0001**
- Fecha creación
- Badge estado:
  - 🟡 `borrador`
  - 🔵 `enviado`
  - 🟢 `aceptado`
  - 🔴 `rechazado`
- Tabla con productos
- TOTAL
- Fecha de envío + descarga
- **Botones:**
  - `📄 Descargar PDF`
  - `✅ Aceptar` (si estado = enviado)
  - `❌ Rechazar` (si estado = enviado)

### **7️⃣ CLIENTE: Acepta o rechaza**

Click en **"✅ Aceptar"** o **"❌ Rechazar"**
- Estado cambia a `aceptado` o `rechazado`
- Se registra fecha
- Admin puede ver cambio en panel

---

## 🔌 ENDPOINTS API

| Método | Ruta | Quién | Función |
|--------|------|-------|---------|
| `POST` | `/api/quotes` | Admin | Crear presupuesto |
| `GET` | `/api/quotes/admin/all` | Admin | Ver todos |
| `GET` | `/api/quotes/:id` | Admin/Cliente | Ver uno (control acceso) |
| `PUT` | `/api/quotes/:id` | Admin | Editar (solo borrador) |
| `POST` | `/api/quotes/:id/enviar` | Admin | Enviar email + PDF |
| `GET` | `/api/quotes/:id/pdf` | Admin/Cliente | Descargar PDF |
| `PUT` | `/api/quotes/:id/status` | Cliente | Cambiar a aceptado/rechazado |
| `GET` | `/api/quotes/mis-presupuestos` | Cliente | Ver mis presupuestos |

---

## 📊 EJEMPLO DE PRESUPUESTO

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "numero": "PSP-0001",
  "client": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "+5491198765432",
    "direccion": {
      "calle": "Av. Corrientes 1234",
      "ciudad": "Buenos Aires",
      "provincia": "CABA"
    }
  },
  "items": [
    {
      "producto": "507f1f77bcf86cd799439010",
      "nombre": "Aire Acondicionado 2500W",
      "cantidad": 2,
      "precioUnitario": 450.00,
      "subtotal": 900.00
    },
    {
      "producto": "507f1f77bcf86cd799439009",
      "nombre": "Filtro de Aire",
      "cantidad": 4,
      "precioUnitario": 25.00,
      "subtotal": 100.00
    }
  ],
  "instalacion": {
    "incluye": true,
    "monto": 200.00,
    "descripcion": "Instalación completa e puesta en marcha"
  },
  "totales": {
    "subtotal": 1000.00,
    "instalacion": 200.00,
    "descuento": 0,
    "total": 1200.00
  },
  "notas": "Cliente requiere instalación urgente",
  "estado": "enviado",
  "enviado": {
    "fecha": "2026-05-16T18:29:33.562Z",
    "email": "juan@example.com",
    "visto": false,
    "descargadoFecha": "2026-05-16T19:30:00.000Z"
  },
  "createdBy": "507f1f77bcf86cd799439008",
  "createdAt": "2026-05-16T18:29:33.562Z"
}
```

---

## ⚙️ CONFIGURACIÓN NECESARIA

### **1. Variables de entorno (.env backend)**

```bash
# Email (para enviar presupuestos)
GMAIL_USER=tu-email@gmail.com
GMAIL_PASSWORD=tu-password-app

# Nota: Para Gmail usar "App Password" (contraseña de aplicación)
# No es la contraseña regular de tu cuenta
```

### **2. Logo (opcional pero recomendado)**

Coloca logo en: `backend/public/logo.png`
- Tamaño recomendado: 150x150px
- Formatos: PNG, JPG

Si no existe, el PDF se genera sin logo (pero funciona igual)

### **3. Vinculación en UI (TODO)**

**Admin panel navbar:**
```javascript
// Agregar link en navbar admin
<NavLink to="/admin/presupuestos">Presupuestos</NavLink>
```

**User menu (cliente):**
```javascript
// Agregar link en dropdown usuario
<DropdownItem to="/mis-presupuestos">Mis Presupuestos</DropdownItem>
```

---

## 🎨 FLUJO VISUAL

### Admin Panel
```
┌─────────────────────────────────────────────────────────────┐
│  PRESUPUESTOS                                      [➕ Crear] │
├─────┬───────────────┬──────────┬──────────┬─────────┬─────────┤
│ Nº  │ Cliente       │ Total    │ Estado   │ Fecha   │ Acciones│
├─────┼───────────────┼──────────┼──────────┼─────────┼─────────┤
│ 001 │ Juan Pérez    │ $1200.00 │ 🟢 acepta│ 16/05   │ 📧📄   │
│ 002 │ María García  │ $800.50  │ 🔵 enviado│ 15/05  │ 📧📄   │
│ 003 │ Carlos López  │ $2500.00 │ 🟡 borrador│ 16/05 │ 📧📄   │
└─────┴───────────────┴──────────┴──────────┴─────────┴─────────┘
```

### Cliente - Mis Presupuestos
```
┌────────────────────────────────────────────────────────┐
│ Presupuesto #PSP-0001                      🟢 Aceptado │
├────────────────────────────────────────────────────────┤
│ Creado: 16/05/2026                                     │
│ Enviado: 15/05/2026                                    │
│ Descargado: 16/05/2026                                 │
│                                                        │
│ Productos:                                             │
│ • Aire Acondicionado 2500W x2    $900.00              │
│ • Filtro de Aire x4              $100.00              │
│ • Instalación                    $200.00              │
│                                                        │
│ TOTAL: $1200.00                                        │
│                                                        │
│ [📄 Descargar PDF]  [✅ Aceptar]  [❌ Rechazar]        │
└────────────────────────────────────────────────────────┘
```

---

## 📝 PDF Generado

El PDF incluye:
- ✓ Logo de empresa (si existe en `backend/public/logo.png`)
- ✓ Número presupuesto: `PSP-0001`
- ✓ Datos cliente (nombre, email, teléfono, dirección)
- ✓ Tabla profesional:
  - Producto | Cantidad | Precio Unit. | Subtotal
- ✓ Línea de instalación (si aplica)
- ✓ **TOTALES** en rojo/destacado
- ✓ Footer con contacto empresa
- ✓ Fecha de generación

---

## 🛠️ TROUBLESHOOTING

### Email no se envía
**Problema:** "Invalid login"
**Solución:**
1. Verifica GMAIL_USER y GMAIL_PASSWORD en .env
2. Para Gmail: Necesitas "Contraseña de aplicación" (App Password), NO la contraseña regular
3. Pasos:
   - Abre https://myaccount.google.com/apppasswords
   - Genera contraseña para "Mail" en "Windows Computer"
   - Copia esa contraseña a GMAIL_PASSWORD

### Cliente no recibe email
1. Verifica dirección email en datos del cliente
2. Revisa spam/correo no deseado
3. Verifica logs del servidor para errores

### PDF no se descarga
1. Asegura que el presupuesto tiene estado `enviado` o superior
2. Verifica permisos de acceso (admin o cliente dueño del presupuesto)
3. Revisa logs para errores de generación

### Presupuesto no aparece en tabla
1. Refresh la página
2. Verifica en consola del navegador si hay errores
3. Asegura que el cliente existe (verifica ID)

---

## 📱 RESPONSIVIDAD

- ✓ Desktop: Tabla completa
- ✓ Tablet: Tabla scrolleable
- ✓ Mobile: Convertir a cards

---

## 🔐 SEGURIDAD

- ✓ Solo admin puede crear/editar presupuestos
- ✓ Clientes solo ven sus presupuestos
- ✓ No se puede editar presupuesto si no está en "borrador"
- ✓ Validación de rol en cada endpoint
- ✓ PDF solo descargable por admin o cliente dueño

---

## 🎓 PRÓXIMOS PASOS

1. **Agregar links en UI:**
   - Admin navbar: `/admin/presupuestos`
   - User menu: `/mis-presupuestos`

2. **Configurar email:**
   - App Password de Gmail en .env

3. **Agregar logo:**
   - Colocar en `backend/public/logo.png`

4. **Testear flujo completo:**
   - Crear presupuesto
   - Enviar email
   - Cliente acepta/rechaza
   - Admin ve cambio

---

**¡Tu sistema de presupuestos está listo para usar! 🎉**
