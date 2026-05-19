# ⚡ INSTALACIÓN RÁPIDA - SISTEMA DE PRESUPUESTOS

## ✅ LO QUE ESTÁ COMPLETO

- ✓ Modelo Quote en MongoDB
- ✓ Rutas API REST (8 endpoints)
- ✓ Controlador con lógica CRUD
- ✓ Generación PDF con PDFKit
- ✓ Envío email con Nodemailer
- ✓ RTK Query para frontend
- ✓ Admin Panel (AdminQuotes.jsx)
- ✓ Formulario de creación (QuoteForm.jsx)
- ✓ Tarjetas de presupuesto (QuoteCard.jsx)
- ✓ Sección cliente (MyQuotes.jsx)

## 🎯 3 PASOS PARA ACTIVAR

### 1. Configurar Email (.env backend)
```bash
# backend/.env
GMAIL_USER=tu-email@gmail.com
GMAIL_PASSWORD=tu-contraseña-app
```

**Nota sobre Gmail:**
- No uses contraseña regular
- Ve a: https://myaccount.google.com/apppasswords
- Genera "App Password" para Mail
- Copia esa contraseña

### 2. Agregar navegación

**Admin navbar** (`frontend/src/components/AdminNav.jsx` o similar):
```jsx
<NavLink to="/admin/presupuestos" className="...">
  📋 Presupuestos
</NavLink>
```

**User dropdown** (`frontend/src/components/UserMenu.jsx` o similar):
```jsx
<DropdownItem>
  <Link to="/mis-presupuestos">Mis Presupuestos</Link>
</DropdownItem>
```

### 3. Importar rutas en App.jsx

```jsx
// frontend/src/App.jsx
import MyQuotes from './pages/MyQuotes';

// En router:
{
  path: '/mis-presupuestos',
  element: <MyQuotes />,
}
```

## 🚀 USAR

### Admin
1. Ve a `/admin/presupuestos`
2. Click "Crear Presupuesto"
3. Llena formulario (cliente ID, productos, instalación)
4. Click "Guardar"
5. En tabla, click "📧 Enviar"
6. Cliente recibe email con PDF

### Cliente
1. Recibe email con PDF
2. Va a `/mis-presupuestos`
3. Ve presupuesto
4. Click "Aceptar" o "Rechazar"
5. Admin ve estado actualizado

## 📂 ARCHIVOS CREADOS

**Backend:**
- `backend/src/models/Quote.js` - Modelo MongoDB
- `backend/src/services/quoteService.js` - PDF + Email
- `backend/src/controllers/quoteGeneratorController.js` - Lógica
- `backend/src/routes/quotes.js` - Rutas

**Frontend:**
- `frontend/src/services/quotesApi.js` - RTK Query
- `frontend/src/pages/admin/AdminQuotes.jsx` - Panel admin
- `frontend/src/pages/MyQuotes.jsx` - Sección cliente
- `frontend/src/components/quotes/QuoteForm.jsx` - Formulario
- `frontend/src/components/quotes/QuoteCard.jsx` - Botones acción

## 📋 FLUJO ACTUAL

```
Admin crea → Presupuesto (borrador)
    ↓
Admin envía → Email + PDF
    ↓
Estado → "enviado" + fecha registrada
    ↓
Cliente recibe → Email con PDF
    ↓
Cliente ve → /mis-presupuestos
    ↓
Cliente acepta/rechaza → Estado actualizado
    ↓
Admin ve → Estado en tabla
```

## 🔧 DETALLES TÉCNICOS

**Autenticación:**
- ✓ Solo admin puede crear/editar presupuestos
- ✓ Clientes solo ven sus presupuestos
- ✓ Validación de permisos en cada endpoint

**Datos presupuesto:**
```
- Número (PSP-0001, PSP-0002...)
- Cliente (incrustado)
- Items (array de productos)
- Instalación (opcional)
- Totales (subtotal, instalación, total)
- Estado (borrador, enviado, aceptado, rechazado)
- Email tracking (fecha envío, descarga)
```

**PDF:**
- Logo (si existe en `backend/public/logo.png`)
- Datos cliente
- Tabla de productos
- Totales profesionales
- Footer con contacto

## ✨ CARACTERÍSTICAS

- ✓ Auto-incremento de números (PSP-0001, etc)
- ✓ Cálculo automático de totales
- ✓ Historial de envío y descarga
- ✓ Notas internas para admin
- ✓ Control de acceso por rol
- ✓ Cache inteligente (RTK Query)
- ✓ UI responsiva
- ✓ Toast de confirmación

## 📞 SOPORTE RÁPIDO

**¿Cliente no recibe email?**
- Verifica App Password en .env
- Revisa spam

**¿No aparece presupuesto en tabla?**
- Refresh navegador
- Verifica ID cliente existe

**¿PDF no se descarga?**
- Presupuesto debe estar en "enviado"
- Debes ser admin o cliente dueño

## 🎉 ¡LISTO!

Tu sistema de presupuestos está 100% funcional. Solo necesitas:
1. Configurar email
2. Agregar navegación
3. ¡Empezar a usar!

Para más detalles, ve: [PRESUPUESTOS_GUIA.md](./PRESUPUESTOS_GUIA.md)
