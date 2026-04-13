import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredRole }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.rol !== requiredRole) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
