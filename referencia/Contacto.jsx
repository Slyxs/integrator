import { Search, Phone, Menu, User, CircleUserRound } from "lucide-react"; 
import "./App.css"; 
import { Link, useNavigate } from 'react-router-dom'; 
import familiaImg from './assets/img/contacto/familia.png';
import { useMemo, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

function Contacto() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const mapCenter = useMemo(() => ({ lat: -3.745, lng: -38.523 }), []);
  const mapContainerStyle = useMemo(
    () => ({ width: '100%', height: '420px', borderRadius: '0.75rem' }),
    []
  );

  // --- Estado y funciones de autenticación ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const tipo = localStorage.getItem("tipo");
    if (token) {
      setIsLoggedIn(true);
      setUserType(tipo || "");
    }
  }, []);

  // Función para obtener el enlace de perfil según el tipo de usuario
  const getProfileLink = () => {
    if (!isLoggedIn) return "/login";
    return userType === "doctor" ? "/perfil-doctor" : "/perfil";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tipo");
    localStorage.removeItem("nombres");
    localStorage.removeItem("apellidos");
    setIsLoggedIn(false);
    setUserType("");
    navigate("/login");
  };

  // --- 🧩 Función para manejar el envío del formulario ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const tipo_usuario = e.target.tipo_usuario.value;
    const email = e.target.email.value;
    const mensaje = e.target.mensaje.value;

    if (!tipo_usuario || !email || !mensaje) {
      alert("Por favor completa todos los campos.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo_usuario, email, mensaje }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Mensaje enviado con éxito. ¡Gracias por contactarnos!");
        e.target.reset();
      } else {
        alert(`❌ Error: ${data.message || "No se pudo enviar el mensaje"}`);
      }
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      alert("❌ Error de conexión con el servidor.");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(90deg,_rgba(34,193,195,0.06),_rgba(253,187,45,0.1))] font-['Rubik'] text-[#0A3C3F]">
      {/* Navbar */}
      <div className="pt-4 md:pt-6 lg:pt-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="navbar bg-[#0A3C3F] text-white rounded-lg shadow-md px-6 lg:px-8 py-3">
            <div className="navbar-start">
              <Link to="/" className="text-4xl font-bold font-['DM_Sans'] tracking-tight">
                Doctoralia
              </Link>
            </div>

            <div className="navbar-center hidden lg:flex">
              <ul className="menu menu-horizontal px-1">
                <li>
                  <Link to="/" className="hover:text-[#A9E8E0] text-[1.125rem] font-['DM_Sans']">Inicio</Link>
                </li>
                <li>
                  <Link to="/buscar-doctores" className="hover:text-[#A9E8E0] text-[1.125rem] font-['DM_Sans']">Doctores</Link>
                </li>
                <li>
                  <Link to="/chatbot" className="hover:text-[#A9E8E0] text-[1.125rem] font-['DM_Sans']">Asistente IA</Link>
                </li>
                <li>
                  <Link to="/contacto" className="hover:text-[#A9E8E0] text-[1.125rem] font-['DM_Sans']">Contacto</Link>
                </li>
              </ul>
            </div>

            <div className="navbar-end">
              {/* --- Versión de escritorio --- */}
              {!isLoggedIn ? (
                <div className="hidden lg:flex items-center space-x-4">
                  <button className="text-white hover:text-[#A9E8E0] p-2">
                    <Search size={22} />
                  </button>
                  <Link
                    to="/login"
                    className="button rounded border border-white text-white px-5 py-2 hover:bg-white hover:text-[#0A3C3F] flex items-center"
                  >
                    <User size={16} className="inline mr-2" />
                    Iniciar Sesión
                  </Link>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-4">
                  <button className="text-white hover:text-[#A9E8E0] p-2">
                    <Search size={22} />
                  </button>
                  <Link to={getProfileLink()} className="text-white hover:text-[#A9E8E0] p-2">
                    <CircleUserRound size={25} />
                  </Link>
                </div>
              )}

              {/* --- Dropdown móvil --- */}
              <div className="dropdown dropdown-end lg:hidden">
                <button tabIndex={0} role="button" className="btn btn-ghost hover:bg-transparent text-white p-1">
                  <Menu size={24} />
                </button>
                <ul
                  tabIndex={0}
                  className="menu dropdown-content bg-[#0A3C3F] text-white rounded-box z-[50] mt-3 w-64 p-4 shadow-lg"
                >
                  <li><Link to="/" className="hover:text-[#A9E8E0] text-lg py-2">Inicio</Link></li>
                  <li><Link to="/buscar-doctores" className="hover:text-[#A9E8E0] text-lg py-2">Doctores</Link></li>
                  <li><Link to="/chatbot" className="hover:text-[#A9E8E0] text-lg py-2">Asistente IA</Link></li>
                  <li><Link to="/contacto" className="hover:text-[#A9E8E0] text-lg py-2">Contacto</Link></li>

                  <div className="pt-3 mt-3 border-t border-white">
                    <li className="py-1">
                      <a href="#" className="hover:text-[#A9E8E0] flex items-center text-lg p-2">
                        <Search size={20} className="mr-3" /> Buscar
                      </a>
                    </li>

                    {isLoggedIn ? (
                      <>
                        <li className="mt-2">
                          <Link
                            to={getProfileLink()}
                            className="button rounded border border-white text-white px-5 py-2 text-base hover:bg-white hover:text-[#0A3C3F] flex items-center justify-center w-full"
                          >
                            Mi Perfil
                          </Link>
                        </li>
                        <li className="mt-2">
                          <button
                            onClick={handleLogout}
                            className="button rounded border border-white text-white px-5 py-2 text-base hover:bg-white hover:text-[#0A3C3F] flex items-center justify-center w-full"
                          >
                            Cerrar Sesión
                          </button>
                        </li>
                      </>
                    ) : (
                      <li className="mt-2">
                        <Link
                          to="/login"
                          className="button rounded border border-white text-white px-5 py-2 text-base hover:bg-white hover:text-[#0A3C3F] flex items-center justify-center w-full"
                        >
                          Iniciar Sesión
                        </Link>
                      </li>
                    )}
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Hero + Formulario */}
      <div className="hero max-w-6xl mx-auto pt-7 md:pt-12 lg:pt-11 pb-12 md:pb-16 lg:pb-25">
        <div className="hero-content flex-col lg:flex-row lg:gap-12 xl:gap-16 items-center lg:items-start w-full">
          <div className="lg:w-6/12 mt-0">
            <img src={familiaImg} className="rounded-lg object-cover w-full" alt="Seguridad de datos médicos online" />
          </div>

          <div className="lg:w-6/12">
            <h3 className="pt-8 text-3xl lg:text-4xl font-['DM_Sans'] text-gray-700 mb-5 leading-tight">
              Ponte en Contacto <br />
              <span className="font-semibold">Estamos Listos Para Ayudarte</span>
            </h3>
            <p className="text-base lg:text-lg text-gray-700 opacity-80 mb-6">
              ¿Tienes preguntas o necesitas asistencia? Nuestro equipo está disponible para ayudarte. 
              Completa el formulario o utiliza nuestros canales de contacto directo.
            </p>
            <hr className="my-6 border-t border-gray-200 w-full" />

            {/* --- Formulario funcional --- */}
            <form className="mt-6" onSubmit={handleSubmit}>
              <select
                name="tipo_usuario"
                className="w-full p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A3C3F] text-[#0A3C3F] bg-[#d4f3ef] mb-2"
                required
              >
                <option disabled selected value="">Cuéntanos más sobre ti</option>
                <option value="doctor_cliente">Soy un doctor y un cliente</option>
                <option value="doctor_no_cliente">Soy un doctor y no un cliente</option>
                <option value="usuario_doctoralia">Soy un usuario de Doctoralia</option>
                <option value="medio_comunicacion">Soy de un medio de comunicación</option>
                <option value="admin_clinica">Soy un administrador de clinica</option>
              </select>

              <input
                name="email"
                className="w-full p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A3C3F] text-[#0A3C3F] bg-[#d4f3ef] mt-4 mb-4"
                type="email"
                required
                placeholder="Correo electrónico"
              />

              <textarea
                name="mensaje"
                className="w-full p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0A3C3F] text-[#0A3C3F] bg-[#d4f3ef] mt-4 mb-4"
                placeholder="Escribe tu mensaje aqui..."
                required
              ></textarea>

              <button
                className="w-full px-6 py-2.5 bg-[#0A3C3F] text-white font-medium rounded-lg hover:bg-[#083032] transition-colors duration-300"
                type="submit"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="py-14 sm:py-14 md:py-16 lg:py-16 xl:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12 lg:mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold font-['DM_Sans'] text-[#0A3C3F] mb-3">
              ¿Donde Encontrarnos?
            </h2>
            <p className="text-lg text-[#0A3C3F] opacity-80 max-w-2xl mx-auto">
              Estamos listos para ayudarte. Visítanos en nuestra oficina principal o contáctanos a través de nuestros canales digitales.
            </p>
          </div>

          <div className="max-w-5xl mx-auto mb-10 lg:mb-10">
            {isLoaded ? (
              <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={12} options={{ disableDefaultUI: true }}>
                <Marker position={mapCenter} />
              </GoogleMap>
            ) : (
              <div className="h-[420px] w-full rounded-xl bg-[#d4f3ef] flex items-center justify-center text-[#0A3C3F]">
                Cargando mapa...
              </div>
            )}
          </div>

          <div className="flex w-full flex-col lg:flex-row max-w-5xl mx-auto">
            <div className="card rounded-box h-20 grow flex flex-col items-center justify-center gap-1">
              <h3 className="text-lg font-['DM_Sans'] font-bold">Teléfono</h3>
              <p className="text-base font-['DM_Sans'] text-center">+51 123 456 789</p>
            </div>
            <div className="divider lg:divider-horizontal"></div>
            <div className="card rounded-box h-20 grow flex flex-col items-center justify-center gap-1">
              <h3 className="text-lg font-['DM_Sans'] font-bold">Email</h3>
              <p className="text-base font-['DM_Sans'] text-center">contacto@doctoralia.com</p>
            </div>
            <div className="divider lg:divider-horizontal"></div>
            <div className="card rounded-box h-20 grow flex flex-col items-center justify-center gap-1">
              <h3 className="text-lg font-['DM_Sans'] font-bold">Dirección</h3>
              <p className="text-base font-['DM_Sans'] text-center">Calle Josep Pla 2 - Building B2<br /> Piso 13, Barcelona</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#0A3C3F]">
        <footer className="footer sm:footer-horizontal bg-[#0A3C3F] text-white px-10 py-15 max-w-7xl mx-auto">
          <aside>
            <img src="https://files.catbox.moe/9bs8p9.png" alt="Logo Doctoralia" width="70" height="70" />
            <p className="text-lg font-['DM_Sans']">
              Doctoralia Internet SL
              <br />
              Proveyendo soluciones medicas desde 2007
            </p>
          </aside>
          <nav>
            <h6 className="footer-title text-lg font-['DM_Sans']">Servicios</h6>
            <a className="link link-hover text-base font-['DM_Sans']">Marca</a>
            <a className="link link-hover text-base font-['DM_Sans']">Diseño</a>
            <a className="link link-hover text-base font-['DM_Sans']">Marketing</a>
            <a className="link link-hover text-base font-['DM_Sans']">Publicidad</a>
          </nav>
          <nav>
            <h6 className="footer-title text-lg font-['DM_Sans']">Compañía</h6>
            <a className="link link-hover text-base font-['DM_Sans']">Sobre nosotros</a>
            <a className="link link-hover text-base font-['DM_Sans']">Contacto</a>
            <a className="link link-hover text-base font-['DM_Sans']">Empleo</a>
            <a className="link link-hover text-base font-['DM_Sans']">Kit de prensa</a>
          </nav>
          <nav>
            <h6 className="footer-title text-lg font-['DM_Sans']">Legal</h6>
            <a className="link link-hover text-base font-['DM_Sans']">Términos de uso</a>
            <a className="link link-hover text-base font-['DM_Sans']">Política de privacidad</a>
            <a className="link link-hover text-base font-['DM_Sans']">Política de cookies</a>
          </nav>
        </footer>
      </div>
    </div>
  );
}

export default Contacto;
