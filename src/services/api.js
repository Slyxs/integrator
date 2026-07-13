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

const toBoolean = (value, defaultValue = false) => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return ['1', 'true', 'activo', 'activa', 'on', 'yes', 'si'].includes(value.trim().toLowerCase());
  }
  return defaultValue;
};

const normalizePromocion = (promo) => ({
  ...promo,
  id: Number(promo.id),
  valor: Number(promo.valor ?? 0),
  minimo_compra: Number(promo.minimo_compra ?? 0),
  usos_actuales: Number(promo.usos_actuales ?? 0),
  usos_maximos:
    promo.usos_maximos === null || promo.usos_maximos === undefined || promo.usos_maximos === ''
      ? null
      : Number(promo.usos_maximos),
  estado: toBoolean(promo.estado, true),
});

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

export const createCategory = (data) =>
  request('/categorias.php', { method: 'POST', body: JSON.stringify(data) });

export const updateCategory = (id, data) =>
  request('/categorias.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteCategory = (id) =>
  request('/categorias.php', { method: 'DELETE', body: JSON.stringify({ id }) });

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

// Obtiene el cliente vinculado a un usuario por su usuario_id.
export const getClientByUserId = (userId) => request(`/clientes.php?usuario_id=${userId}`);

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

// Obtiene las ventas de un usuario específico por su ID.
export const getSalesByUserId = (userId) => request(`/ventas.php?usuario_id=${userId}`);

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

// ===================== PROMOCIONES =====================
// Obtiene todas las promociones activas y vigentes (para mostrar en la home).
export const getPromociones = () =>
  request('/promociones.php').then((data) => data.map(normalizePromocion));

// Obtiene todas las promociones para administración, incluyendo inactivas y vencidas.
export const getAllPromociones = () =>
  request('/promociones.php?all=1').then((data) => data.map(normalizePromocion));

// Valida un código de descuento. Devuelve el objeto promo si es válido,
// lanza Error si el código no existe, expiró o agotó sus usos.
export const validateCoupon = (codigo) =>
  request(`/promociones.php?codigo=${encodeURIComponent(codigo)}`).then(normalizePromocion);

// Incrementa el contador de usos de una promoción tras una venta exitosa.
export const usarPromocion = (id) =>
  request('/promociones.php', { method: 'POST', body: JSON.stringify({ action: 'usar', id }) });

// CRUD de administración de promociones
export const createPromocion = (data) =>
  request('/promociones.php', { method: 'POST', body: JSON.stringify(data) });

export const updatePromocion = (id, data) =>
  request('/promociones.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deletePromocion = (id) =>
  request('/promociones.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== PROVEEDORES =====================
// CRUD de proveedores del sistema (panel de administración).
export const getProveedores = () => request('/proveedores.php');

export const createProveedor = (data) =>
  request('/proveedores.php', { method: 'POST', body: JSON.stringify(data) });

export const updateProveedor = (id, data) =>
  request('/proveedores.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteProveedor = (id) =>
  request('/proveedores.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== TRABAJADORES =====================
// Mantenimiento del personal de la cafetería.
export const getTrabajadores = () => request('/trabajadores.php');

export const createTrabajador = (data) =>
  request('/trabajadores.php', { method: 'POST', body: JSON.stringify(data) });

export const updateTrabajador = (id, data) =>
  request('/trabajadores.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteTrabajador = (id) =>
  request('/trabajadores.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== MAQUINARIA =====================
// Mantenimiento de equipos y maquinaria.
export const getMaquinaria = () => request('/maquinaria.php');

export const createMaquina = (data) =>
  request('/maquinaria.php', { method: 'POST', body: JSON.stringify(data) });

export const updateMaquina = (id, data) =>
  request('/maquinaria.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteMaquina = (id) =>
  request('/maquinaria.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== CONTROL DE CALIDAD =====================
// Registro de inspecciones de control de calidad.
export const getControlCalidad = () => request('/control_calidad.php');

export const createInspeccion = (data) =>
  request('/control_calidad.php', { method: 'POST', body: JSON.stringify(data) });

export const updateInspeccion = (id, data) =>
  request('/control_calidad.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteInspeccion = (id) =>
  request('/control_calidad.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== LIBRO DE RECLAMACIONES =====================
// Registro público de reclamaciones y gestión administrativa.
export const getReclamaciones = () => request('/reclamaciones.php');

// Consulta pública del estado de una reclamación por su código.
export const getReclamacionByCodigo = (codigo) =>
  request(`/reclamaciones.php?codigo=${encodeURIComponent(codigo)}`);

// Registra una nueva reclamación (formulario público). Devuelve el código generado.
export const createReclamacion = (data) =>
  request('/reclamaciones.php', { method: 'POST', body: JSON.stringify(data) });

// Actualiza el estado y la respuesta de una reclamación (admin).
export const updateReclamacion = (id, data) =>
  request('/reclamaciones.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteReclamacion = (id) =>
  request('/reclamaciones.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== RESPALDO DE INFORMACIÓN =====================
// Genera un respaldo de los datos del sistema en formato JSON o SQL.
export const generarRespaldo = (formato = 'json', usuario = '') =>
  request(`/respaldo.php?formato=${formato}&usuario=${encodeURIComponent(usuario)}`);

// Obtiene el historial de respaldos generados.
export const getHistorialRespaldos = () => request('/respaldo.php?historial=1');

// ===================== CHATBOT (IA - DeepSeek) =====================
// Envía la conversación al asistente virtual y devuelve su respuesta.
export const sendChatMessage = (messages) =>
  request('/chatbot.php', { method: 'POST', body: JSON.stringify({ messages }) });

// ===================== ASISTENCIA DE EMPLEADOS =====================
export const getAsistencias = () => request('/asistencias.php');

export const createAsistencia = (data) =>
  request('/asistencias.php', { method: 'POST', body: JSON.stringify(data) });

export const updateAsistencia = (id, data) =>
  request('/asistencias.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteAsistencia = (id) =>
  request('/asistencias.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== BONOS DE EMPLEADOS =====================
export const getBonos = () => request('/bonos.php');

export const createBono = (data) =>
  request('/bonos.php', { method: 'POST', body: JSON.stringify(data) });

export const updateBono = (id, data) =>
  request('/bonos.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteBono = (id) =>
  request('/bonos.php', { method: 'DELETE', body: JSON.stringify({ id }) });
