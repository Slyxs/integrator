import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Componente que protege rutas según autenticación y rol.
// Se usa como wrapper en el enrutador: cualquier ruta anidada dentro
// de <ProtectedRoute> solo es accesible si el usuario cumple las condiciones.
const ProtectedRoute = ({ requiredRole }) => {
  const { user } = useAuth();

  // Si no hay sesión activa, redirige al login
  if (!user) return <Navigate to="/login" replace />;

  // Si la ruta requiere un rol específico y el usuario no lo tiene,
  // lo manda al inicio en vez de mostrar un error
  if (requiredRole && user.rol !== requiredRole) return <Navigate to="/" replace />;

  // Todo en orden: renderiza la ruta solicitada
  return <Outlet />;
};

export default ProtectedRoute;
