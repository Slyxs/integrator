import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiCoffee } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { createUser } from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
  // Campos del formulario — cada useState guarda lo que el usuario escribe en tiempo real
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // se usa solo para validar, no se envía a la API

  // Controla el estado de carga mientras se espera respuesta del servidor
  const [loading, setLoading] = useState(false);

  // login viene del contexto de autenticación: hace el inicio de sesión automático post-registro
  const { login } = useAuth();

  // navigate permite redirigir al usuario a otra página sin recargar el sitio
  const navigate = useNavigate();

  // Se ejecuta cuando el usuario envía el formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // evita que la página se recargue al hacer submit

    // Validación local antes de llamar a la API — ahorra una petición innecesaria
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setLoading(true); // activa el indicador de carga en el botón
    try {
      // Crea el usuario en la base de datos con rol "usuario" por defecto
      await createUser({ nombre, email, password, rol: 'usuario' });

      // Después del registro hace login automático para no obligar al usuario a volver a ingresar sus datos
      const user = await login(email, password);
      toast.success(`¡Bienvenido, ${user.nombre}!`);
      navigate('/menu'); // lleva al menú directamente
    } catch (err) {
      toast.error(err.message); // muestra el mensaje de error que devuelva la API
    } finally {
      setLoading(false); // siempre desactiva el loading, haya error o no
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-cream px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <FiCoffee size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-coffee">Crear Cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Únete a Juan Valdez Café</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Tu nombre"
                required
                minLength={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="••••••••"
                required
                minLength={4}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="••••••••"
                required
                minLength={4}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Iniciar Sesión
          </Link>
        </p>

        <p className="text-center text-sm text-gray-500 mt-2">
          <Link to="/" className="text-primary hover:underline">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
