/* ===========================================================
   Juan Valdez Café - Servicio API (Conectado a MySQL via PHP)
   ===========================================================
   Este archivo es la capa de comunicación entre el frontend React
   y el backend PHP que corre en XAMPP (Apache + MySQL).

   Flujo general:
     1. El componente React importa una función de este archivo.
     2. La función llama a `request()` con la ruta y el método HTTP.
     3. Vite proxy (vite.config.js) redirige /api → http://localhost/api
        para evitar errores de CORS durante el desarrollo.
     4. El archivo PHP correspondiente procesa la petición y devuelve JSON.
     5. Si el servidor responde con un código de error (4xx / 5xx),
        `request()` lanza un Error que el componente puede capturar.
   =========================================================== */

// Prefijo base de todas las rutas del API.
// El proxy de Vite lo redirige a http://localhost/api en desarrollo.
const API_BASE = '/api';

// ===================== FUNCIÓN BASE =====================
// Envuelve fetch() con lógica común a todas las peticiones:
//   - Agrega el header Content-Type: application/json
//   - Parsea la respuesta como JSON
//   - Lanza un Error si el servidor devuelve un código HTTP de error,
//     usando el campo "error" del JSON si está disponible.
async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

// ===================== INICIALIZACIÓN =====================
// Función vacía que mantiene compatibilidad con código legado.
// Los datos ya viven en MySQL; no hay inicialización local necesaria.
export const initializeApp = () => {};

// ===================== AUTENTICACIÓN =====================
// Clave usada para guardar el usuario activo en localStorage.
// Persiste entre recargas de página para mantener la sesión.
const USER_KEY = 'jv_current_user';

// Envía las credenciales al backend, y si son correctas guarda
// el objeto usuario en localStorage para que la app sepa quién está logueado.
export const login = async (email, password) => {
  const user = await request('/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

// Elimina el usuario del localStorage, cerrando la sesión local.
// No hace una petición al servidor porque no hay sesiones server-side.
export const logout = () => {
  localStorage.removeItem(USER_KEY);
};

// Lee el usuario activo desde localStorage.
// Devuelve el objeto usuario o null si no hay nadie logueado.
// El try/catch protege contra JSON malformado en el storage.
export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// ===================== CATEGORÍAS =====================
// Obtiene todas las categorías activas.
// Se usa para poblar el selector de categoría en el formulario de productos
// y para agrupar productos en el menú del cliente.
export const getCategories = () => request('/categorias.php');

// ===================== PRODUCTOS =====================
// Obtiene todos los productos activos del menú.
export const getProducts = () => request('/productos.php');

// Obtiene un producto específico por su ID.
export const getProductById = (id) => request(`/productos.php?id=${id}`);

// Crea un producto nuevo. `data` debe incluir: nombre, precio, categoriaId, stock.
export const createProduct = (data) =>
  request('/productos.php', { method: 'POST', body: JSON.stringify(data) });

// Actualiza los datos de un producto existente por su ID.
export const updateProduct = (id, data) =>
  request('/productos.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

// Elimina lógicamente un producto (soft delete; no se borra de la BD).
export const deleteProduct = (id) =>
  request('/productos.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== CLIENTES =====================
// Obtiene todos los clientes activos registrados.
export const getClients = () => request('/clientes.php');

// Obtiene un cliente específico por su ID.
export const getClientById = (id) => request(`/clientes.php?id=${id}`);

// Registra un nuevo cliente. `data` debe incluir: nombre, apellido.
// El resto de campos (email, teléfono, dirección, documento) son opcionales.
export const createClient = (data) =>
  request('/clientes.php', { method: 'POST', body: JSON.stringify(data) });

// Actualiza los datos de un cliente existente.
export const updateClient = (id, data) =>
  request('/clientes.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

// Elimina lógicamente un cliente (soft delete).
export const deleteClient = (id) =>
  request('/clientes.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== VENTAS =====================
// Obtiene todas las ventas registradas, cada una con su array de items.
export const getSales = () => request('/ventas.php');

// Obtiene una venta específica con todos sus items de detalle.
export const getSaleById = (id) => request(`/ventas.php?id=${id}`);

// Crea una nueva venta. El backend inserta la cabecera, el detalle
// y descuenta el stock en una sola transacción.
// `saleData` debe incluir: usuarioId, total, items[], metodoPago, etc.
export const createSale = (saleData) =>
  request('/ventas.php', { method: 'POST', body: JSON.stringify(saleData) });

// ===================== USUARIOS =====================
// Obtiene todos los usuarios activos del sistema (sin contraseñas).
export const getUsers = () => request('/usuarios.php');

// Crea un nuevo usuario. `data` debe incluir: nombre, email, password, rol.
export const createUser = (data) =>
  request('/usuarios.php', { method: 'POST', body: JSON.stringify(data) });

// Actualiza los datos de un usuario. Si se incluye `password` en `data`,
// también se actualiza la contraseña; de lo contrario se deja igual.
export const updateUser = (id, data) =>
  request('/usuarios.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

// Elimina lógicamente un usuario (soft delete).
export const deleteUser = (id) =>
  request('/usuarios.php', { method: 'DELETE', body: JSON.stringify({ id }) });
