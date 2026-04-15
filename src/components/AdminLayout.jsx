import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Coffee,
  House,
  LayoutDashboard,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/ventas', label: 'Ventas', icon: ReceiptText },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `gap-3 rounded-box ${
      isActive ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'
    }`;

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200/40">
      <input
        id="admin-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(event) => setDrawerOpen(event.target.checked)}
      />

      {/* Contenido principal del panel (sección derecha) */}
      <div className="drawer-content flex min-h-screen flex-col">
        {/* Barra superior móvil para abrir/cerrar el menú lateral */}
        <header className="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100 px-4 lg:hidden">
          <div className="flex-1 items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-square"
              onClick={() => setDrawerOpen((current) => !current)}
              aria-label={drawerOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral'}
            >
              {drawerOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <span className="font-semibold">Panel de Administración</span>
          </div>
          <div className="flex-none">
            <span className="badge badge-neutral badge-sm">{user?.nombre || 'Administrador'}</span>
          </div>
        </header>

        {/* Vista interna de cada módulo administrativo */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* Menú lateral del panel administrativo */}
      <div className="drawer-side z-40">
        <label
          htmlFor="admin-drawer"
          aria-label="Cerrar menú lateral"
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        ></label>

        <aside className="flex min-h-full w-80 max-w-full flex-col border-r border-base-300 bg-base-100">
          {/* Cabecera de marca del menú */}
          <div className="border-b border-base-300 p-5">
            <div className="flex items-center gap-3">
                  <Coffee size={20} />
              <div>
                <h2 className="font-bold leading-tight">Juan Valdez</h2>
                <p className="text-xs text-base-content/60">Panel de administración</p>
              </div>
            </div>
          </div>

          {/* Navegación principal entre módulos */}
          <nav className="flex-1 p-4">
            <ul className="menu gap-1 p-0 text-sm">
              {links.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} className={linkClass} onClick={() => setDrawerOpen(false)}>
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Acciones rápidas del usuario logueado */}
          <div className="space-y-3 border-t border-base-300 p-4">

            {/* Botón para volver al sitio público */}
            <NavLink to="/" className="btn btn-ghost btn-sm w-full justify-start" onClick={() => setDrawerOpen(false)}>
              <House size={16} />
              Ir al sitio
            </NavLink>

            {/* Sección del usuario activo: avatar, nombre y botón de salida */}
            <ul className="list rounded-box bg-base-200">
              <li className="list-row items-center px-3 py-2">

                {/* Avatar con la inicial del nombre del usuario */}
                <div className="avatar avatar-placeholder shrink-0">
                  <div className="bg-primary text-primary-content w-8 rounded-full">
                    <span className="text-xs">{user?.nombre?.charAt(0).toUpperCase() || 'A'}</span>
                  </div>
                </div>

                {/* Nombre del usuario, ocupa el espacio restante */}
                <div className="list-col-grow min-w-0">
                  <p className="truncate text-sm font-medium">{user?.nombre || 'Administrador'}</p>
                </div>

                {/* Botón para cerrar sesión */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost btn-sm btn-square text-error shrink-0"
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={17} />
                </button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminLayout;
