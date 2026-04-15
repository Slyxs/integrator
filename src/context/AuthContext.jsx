import { createContext, useContext, useState } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '../services/api';

// createContext crea el "canal" por donde se comparten los datos de sesión.
// El null es el valor por defecto si alguien intenta usarlo fuera del provider.
const AuthContext = createContext(null);

// Hook personalizado para consumir el contexto desde cualquier componente.
// El chequeo de !context lanza un error claro si alguien olvida envolver
// la app con <AuthProvider> — evita fallos silenciosos difíciles de rastrear.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

// AuthProvider es el componente que envuelve la app y provee el estado de sesión.
// Todo lo que esté dentro de él puede acceder a user, login, logout, etc.
export const AuthProvider = ({ children }) => {
  // getCurrentUser() lee el usuario guardado en localStorage al cargar la página,
  // así la sesión persiste aunque el usuario recargue el navegador.
  const [user, setUser] = useState(getCurrentUser());

  // loading se activa mientras se espera respuesta del servidor al iniciar sesión,
  // para que los componentes puedan mostrar un spinner o deshabilitar botones.
  const [loading, setLoading] = useState(false);

  // Llama a la API para autenticar. Si tiene éxito, guarda el usuario en el estado
  // y lo retorna para que el componente que lo llamó pueda redirigir según el rol.
  const login = async (email, password) => {
    setLoading(true);
    try {
      const loggedUser = await apiLogin(email, password);
      setUser(loggedUser); // actualiza el estado global de sesión
      return loggedUser;
    } finally {
      // finally garantiza que loading siempre se desactiva, haya error o no
      setLoading(false);
    }
  };

  // Borra la sesión del localStorage (apiLogout) y limpia el estado local.
  // Al poner user en null todos los componentes que lo usen se actualizan solos.
  const logout = () => {
    apiLogout();
    setUser(null);
  };

  // Atajo para saber si el usuario actual es administrador.
  // El ?. evita errores si user es null (no hay sesión activa).
  const isAdmin = user?.rol === 'admin';

  // El Provider hace disponibles todos estos valores para cualquier componente hijo.
  // Si algún valor cambia (ej: user después del login), React re-renderiza
  // automáticamente los componentes que lo estén usando.
  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
