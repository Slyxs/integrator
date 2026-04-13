/* ===========================================================
   Juan Valdez Café - Servicio API (Conectado a MySQL via PHP)
   ===========================================================
   Backend PHP en /api/ servido por Apache (XAMPP).
   Vite proxy redirige /api → http://localhost/api
   =========================================================== */

const API_BASE = '/api';

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
// Ya no se necesita; los datos viven en MySQL.
export const initializeApp = () => {};

// ===================== AUTENTICACIÓN =====================

const USER_KEY = 'jv_current_user';

export const login = async (email, password) => {
  const user = await request('/login.php', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const logout = () => {
  localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = () => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// ===================== CATEGORÍAS =====================

export const getCategories = () => request('/categorias.php');

// ===================== PRODUCTOS =====================

export const getProducts = () => request('/productos.php');

export const getProductById = (id) => request(`/productos.php?id=${id}`);

export const createProduct = (data) =>
  request('/productos.php', { method: 'POST', body: JSON.stringify(data) });

export const updateProduct = (id, data) =>
  request('/productos.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteProduct = (id) =>
  request('/productos.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== CLIENTES =====================

export const getClients = () => request('/clientes.php');

export const getClientById = (id) => request(`/clientes.php?id=${id}`);

export const createClient = (data) =>
  request('/clientes.php', { method: 'POST', body: JSON.stringify(data) });

export const updateClient = (id, data) =>
  request('/clientes.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteClient = (id) =>
  request('/clientes.php', { method: 'DELETE', body: JSON.stringify({ id }) });

// ===================== VENTAS =====================

export const getSales = () => request('/ventas.php');

export const getSaleById = (id) => request(`/ventas.php?id=${id}`);

export const createSale = (saleData) =>
  request('/ventas.php', { method: 'POST', body: JSON.stringify(saleData) });

// ===================== USUARIOS =====================

export const getUsers = () => request('/usuarios.php');

export const createUser = (data) =>
  request('/usuarios.php', { method: 'POST', body: JSON.stringify(data) });

export const updateUser = (id, data) =>
  request('/usuarios.php', { method: 'PUT', body: JSON.stringify({ id, ...data }) });

export const deleteUser = (id) =>
  request('/usuarios.php', { method: 'DELETE', body: JSON.stringify({ id }) });
