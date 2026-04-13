import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiUsers, FiPackage, FiFileText, FiLogOut, FiCoffee, FiHome } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/admin/usuarios', label: 'Usuarios', icon: FiUsers },
  { to: '/admin/productos', label: 'Productos', icon: FiPackage },
  { to: '/admin/ventas', label: 'Ventas', icon: FiFileText },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-coffee text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FiCoffee size={24} />
            <div>
              <h2 className="font-bold">Juan Valdez</h2>
              <p className="text-xs text-gray-400">Panel de Administración</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition ${
                  isActive ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <NavLink to="/" className="flex items-center gap-2 text-gray-300 hover:text-white mb-3 text-sm">
            <FiHome size={16} /> Ir al Sitio
          </NavLink>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{user?.nombre}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
