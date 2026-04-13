// =============================================
// Barra de navegación principal
// TODO: Considerar añadir un banner de promociones arriba del navbar
// =============================================
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, UserPlus, LogOut, Settings, Coffee, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logo from '../assets/imgs/juan-valdez-cafe-seeklogo.png';

const Navbar = ({ drawerOpen = false, onToggleDrawer = () => {} }) => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Helper para clases de link activo en el dock
  const isDockActive = (path) => location.pathname === path;

  return (
    <>
      {/* ===== NAVBAR PRINCIPAL ===== */}
      <div className="navbar bg-base-100 shadow-md sticky top-0 z-50">

        {/* ---- Inicio: Logo + hamburger móvil ---- */}
        <div className="navbar-start">
          {/* Botón que ahora sí controla el drawer/sidebar móvil */}
          <button
            type="button"
            className="btn btn-ghost lg:hidden"
            onClick={onToggleDrawer}
            aria-label={drawerOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
          >
            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center ml-1">
            <img src={logo} alt="Juan Valdez Café" className="h-10" />
          </Link>
        </div>

        {/* ---- Centro: Links de navegación desktop ---- */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-1">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-primary bg-primary/10 rounded-lg' : 'font-medium'
                }
              >
                Inicio
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/menu"
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-primary bg-primary/10 rounded-lg' : 'font-medium'
                }
              >
                Menú
              </NavLink>
            </li>
          </ul>
        </div>

        {/* ---- Fin: Acciones del usuario ---- */}
        <div className="navbar-end gap-1">
          {user ? (
            <>
              {/* Botón carrito con badge — solo para clientes, no admins */}
              {!isAdmin && (
                <Link to="/carrito" className="btn btn-ghost btn-circle relative">
                  <ShoppingCart size={21} />
                  {itemCount > 0 && (
                    <span className="badge badge-primary badge-xs absolute -top-1 -right-1">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Dropdown de perfil de usuario */}
              {/* TODO: Añadir avatar con foto de perfil cuando esté disponible */}
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost gap-2">
                  <div className="avatar avatar-placeholder">
                    <div className="bg-primary text-primary-content w-8 rounded-full">
                      <span className="text-xs leading-none">
                        {user.nombre?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className="hidden sm:inline font-medium text-sm">{user.nombre}</span>
                </div>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg border border-base-200"
                >
                  {isAdmin && (
                    <li>
                      <Link to="/admin" className="gap-2">
                        <Settings size={15} />
                        Panel Admin
                      </Link>
                    </li>
                  )}
                  {/* TODO: Añadir link a "Mi perfil" aquí */}
                  <li>
                    <button onClick={handleLogout} className="gap-2 text-error">
                      <LogOut size={15} />
                      Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-primary btn-sm">
                Iniciar Sesión
              </Link>
              <Link to="/registro" className="btn btn-outline btn-primary btn-sm hidden sm:inline-flex">
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ===== DOCK MÓVIL — navegación rápida inferior ===== */}
      {/* Solo visible en pantallas pequeñas, oculto en md+ */}
      {/* Nota: position fixed, no ocupa espacio en el flujo normal */}
      <div className="dock md:hidden z-40">
        <Link to="/" className={isDockActive('/') ? 'dock-active' : ''}>
          <Coffee size={20} />
          <span className="dock-label">Inicio</span>
        </Link>

        <Link to="/menu" className={isDockActive('/menu') ? 'dock-active' : ''}>
          <UtensilsCrossed size={20} />
          <span className="dock-label">Menú</span>
        </Link>

        {/* Carrito — solo si hay sesión y no es admin */}
        {user && !isAdmin && (
          <Link to="/carrito" className={isDockActive('/carrito') ? 'dock-active' : ''}>
            <div className="relative inline-flex">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="badge badge-primary badge-xs absolute -top-2 -right-2">
                  {itemCount}
                </span>
              )}
            </div>
            <span className="dock-label">Carrito</span>
          </Link>
        )}

        {/* Admin panel en el dock */}
        {user && isAdmin && (
          <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'dock-active' : ''}>
            <Settings size={20} />
            <span className="dock-label">Admin</span>
          </Link>
        )}

        {/* Login o perfil */}
        {!user ? (
          <Link to="/login" className={isDockActive('/login') || isDockActive('/registro') ? 'dock-active' : ''}>
            <User size={20} />
            <span className="dock-label">Entrar</span>
          </Link>
        ) : (
          // Cerrar sesión rápido desde el dock
          <button onClick={handleLogout}>
            <LogOut size={20} />
            <span className="dock-label">Salir</span>
          </button>
        )}
      </div>
    </>
  );
};

export default Navbar;
