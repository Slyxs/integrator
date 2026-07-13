import { Coffee, LogOut, Mail, MessageCircle, Settings, ShoppingCart, Sparkles, User, UserPlus, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import Chatbot from './pages/Chatbot';
import ComplaintsBook from './pages/ComplaintsBook';
import Contact from './pages/Contact';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Attendance from './pages/admin/Attendance';
import Backup from './pages/admin/Backup';
import Bonuses from './pages/admin/Bonuses';
import Categories from './pages/admin/Categories';
import Clients from './pages/admin/Clients';
import Complaints from './pages/admin/Complaints';
import Dashboard from './pages/admin/Dashboard';
import Machinery from './pages/admin/Machinery';
import Products from './pages/admin/Products';
import Promotions from './pages/admin/Promotions';
import QualityControl from './pages/admin/QualityControl';
import Reports from './pages/admin/Reports';
import Sales from './pages/admin/Sales';
import Suppliers from './pages/admin/Suppliers';
import Workers from './pages/admin/Workers';
import Cart from './pages/user/Cart';
import Menu from './pages/user/Menu';
import Profile from './pages/user/Profile';
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
      <li>
        <NavLink to="/contacto" className={linkClass} onClick={onNavigate}>
          <Mail size={18} />
          <span>Contacto</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/asistente" className={linkClass} onClick={onNavigate}>
          <Sparkles size={18} />
          <span>Asistente IA</span>
        </NavLink>
      </li>
      <li>
        <NavLink to="/reclamaciones" className={linkClass} onClick={onNavigate}>
          <MessageCircle size={18} />
          <span>Libro de Reclamaciones</span>
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
        <>
          {!isAdmin && (
            <li>
              <NavLink to="/perfil" className={linkClass} onClick={onNavigate}>
                <User size={18} />
                <span>Mi Perfil</span>
              </NavLink>
            </li>
          )}
          <li>
            <button type="button" className="gap-3 rounded-box text-error hover:bg-error/10" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </li>
        </>
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
              <Route path="/contacto" element={<Contact />} />
              <Route path="/reclamaciones" element={<ComplaintsBook />} />
              <Route path="/asistente" element={<Chatbot />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/carrito" element={<Cart />} />
                <Route path="/recibo/:id" element={<Receipt />} />
                <Route path="/perfil" element={<Profile />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="clientes" element={<Clients />} />
                <Route path="productos" element={<Products />} />
                <Route path="ventas" element={<Sales />} />
                {/* DONE: empieza ruta de reportes del administrador */}
                <Route path="reportes" element={<Reports />} />
                {/* DONE: termina ruta de reportes del administrador */}
                <Route path="categorias" element={<Categories />} />
                <Route path="promociones" element={<Promotions />} />
                <Route path="proveedores" element={<Suppliers />} />
                <Route path="trabajadores" element={<Workers />} />
                <Route path="asistencia" element={<Attendance />} />
                <Route path="bonos" element={<Bonuses />} />
                <Route path="maquinaria" element={<Machinery />} />
                <Route path="calidad" element={<QualityControl />} />
                <Route path="reclamaciones" element={<Complaints />} />
                <Route path="respaldo" element={<Backup />} />
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
