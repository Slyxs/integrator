import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Coffee, UtensilsCrossed, ShoppingCart, User, UserPlus, LogOut, Settings } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/admin/Dashboard';
import Clients from './pages/admin/Clients';
import Products from './pages/admin/Products';
import Sales from './pages/admin/Sales';
import Menu from './pages/user/Menu';
import Cart from './pages/user/Cart';
import Receipt from './pages/user/Receipt';
import { initializeApp } from './services/api';

initializeApp();

const PublicSidebar = ({ onNavigate }) => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();

  const handleLogout = () => {
    logout();
    onNavigate();
  };

  const linkClass = ({ isActive }) =>
    `gap-3 rounded-box ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`;

  return (
    <ul className="menu min-h-full w-72 bg-base-100 p-4 text-base-content border-r border-base-200">
      {/* Nota visual: sidebar móvil inspirado en el patrón responsive drawer */}
      <li className="menu-title text-coffee/60">Navegación</li>
      <li>
        <NavLink to="/" end className={linkClass} onClick={onNavigate}>
          <Coffee size={18} />
          <span>Inicio</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/menu" className={linkClass} onClick={onNavigate}>
          <UtensilsCrossed size={18} />
          <span>Menú</span>
        </NavLink>
      </li>
      {user && !isAdmin && (
        <li>
          <NavLink to="/carrito" className={linkClass} onClick={onNavigate}>
            <ShoppingCart size={18} />
            <span>Carrito</span>
            {itemCount > 0 && <span className="badge badge-primary badge-sm ml-auto">{itemCount}</span>}
          </NavLink>
        </li>
      )}
      {user && isAdmin && (
        <li>
          <Link to="/admin" className="gap-3 rounded-box hover:bg-base-200" onClick={onNavigate}>
            <Settings size={18} />
            <span>Panel Admin</span>
          </Link>
        </li>
      )}
      <li className="menu-title mt-4 text-coffee/60">Cuenta</li>
      {!user ? (
        <>
          <li>
            <NavLink to="/login" className={linkClass} onClick={onNavigate}>
              <User size={18} />
              <span>Iniciar Sesión</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/registro" className={linkClass} onClick={onNavigate}>
              <UserPlus size={18} />
              <span>Registrarse</span>
            </NavLink>
          </li>
        </>
      ) : (
        <li>
          <button type="button" className="gap-3 rounded-box text-error hover:bg-error/10" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </li>
      )}
    </ul>
  );
};

const PublicLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="public-sidebar-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(event) => setDrawerOpen(event.target.checked)}
      />

      <div className="drawer-content flex min-h-screen flex-col">
        <Navbar
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen((current) => !current)}
        />
        {/* pb-16 en móvil para que el dock no tape el contenido del footer */}
        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
        <Footer />
      </div>

      <div className="drawer-side z-[60] lg:hidden">
        <label
          htmlFor="public-sidebar-drawer"
          aria-label="Cerrar menú lateral"
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        ></label>
        <PublicSidebar onNavigate={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/menu" element={<Menu />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/carrito" element={<Cart />} />
                <Route path="/recibo/:id" element={<Receipt />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="usuarios" element={<Clients />} />
                <Route path="productos" element={<Products />} />
                <Route path="ventas" element={<Sales />} />
              </Route>
            </Route>

            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
                  <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
                  <p className="text-gray-600 mb-6">Página no encontrada</p>
                  <a href="/" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark">
                    Volver al Inicio
                  </a>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App
