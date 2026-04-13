# Juan Valdez Café - Sistema de Gestión

Sistema web para gestión de cafetería Juan Valdez con control de ventas, productos y clientes.

## Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## Cuentas de Prueba

| Rol     | Email                    | Contraseña |
|---------|--------------------------|------------|
| Admin   | admin@juanvaldez.com     | admin123   |
| Usuario | usuario@juanvaldez.com   | user123    |

## Estructura del Proyecto

```
src/
├── assets/imgs/           # Logos e imágenes
├── components/            # Componentes reutilizables
│   ├── Navbar.jsx         # Barra de navegación
│   ├── Footer.jsx         # Pie de página
│   ├── AdminLayout.jsx    # Layout del panel admin
│   └── ProtectedRoute.jsx # Protección de rutas
├── context/               # Contextos de React
│   ├── AuthContext.jsx    # Autenticación
│   └── CartContext.jsx    # Carrito de compras
├── pages/                 # Páginas
│   ├── Home.jsx           # Página de inicio
│   ├── Login.jsx          # Inicio de sesión
│   ├── admin/             # Páginas de administrador
│   │   ├── Dashboard.jsx  # Panel principal
│   │   ├── Clients.jsx    # Gestión de clientes
│   │   ├── Products.jsx   # Gestión de productos
│   │   └── Sales.jsx      # Historial de ventas
│   └── user/              # Páginas de usuario
│       ├── Menu.jsx       # Catálogo de productos
│       ├── Cart.jsx       # Carrito de compras
│       └── Receipt.jsx    # Comprobante de venta
├── services/
│   └── api.js             # Servicio API (mock con localStorage)
├── App.jsx                # Componente principal con rutas
├── main.jsx               # Punto de entrada
└── index.css              # Estilos globales
database/
└── schema.sql             # Esquema de base de datos MySQL
```

## Base de Datos

El esquema SQL está en `database/schema.sql`. Diseñado para MySQL/MariaDB.

### Tablas:
- **usuarios** - Autenticación y roles (admin/usuario)
- **clientes** - Gestión de clientes
- **categorias** - Categorías de productos
- **productos** - Catálogo de productos
- **ventas** - Comprobantes de venta
- **detalle_ventas** - Detalle de cada venta

## Conectar Base de Datos Real

El archivo `src/services/api.js` usa localStorage como mock. Para conectar un backend:

1. Crear backend (Express, FastAPI, etc.)
2. Instalar axios: `npm install axios`
3. Reemplazar funciones en `api.js` con llamadas HTTP

```js
// ANTES (mock):
export const getProducts = async () => {
  await delay();
  return getStore(KEYS.PRODUCTS);
};

// DESPUÉS (API real):
import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3001/api' });

export const getProducts = async () => {
  const { data } = await API.get('/productos');
  return data;
};
```

## Portabilidad (USB)

Para usar en otra máquina:

1. Copia toda la carpeta del proyecto al USB
2. En la nueva máquina (necesita Node.js instalado):
   ```bash
   cd ruta/al/proyecto
   npm install
   npm run dev
   ```

## Tecnologías

- React 19 + Vite 8
- Tailwind CSS 4
- React Router 7
- React Icons + React Hot Toast
