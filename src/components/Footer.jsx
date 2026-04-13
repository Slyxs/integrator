// =============================================
// Footer principal del sitio
// TODO: Añadir sección de newsletter cuando tengamos el backend listo
// TODO: Añadir mapa embedido de Google Maps con la ubicación
// =============================================
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
// Lucide no incluye iconos de marcas registradas — usamos react-icons/fa para redes sociales
import { FaInstagram, FaFacebook, FaXTwitter } from 'react-icons/fa6';
import logo from '../assets/imgs/juan-valdez-cafe-seeklogo.png';

const Footer = () => (
  // Footer con daisyui, poner pb-16 en mobile para no tapar el dock
  <footer className="bg-coffee text-white pb-16 md:pb-0">

    {/* ---- Columnas de información ---- */}
    <div className="footer footer-vertical sm:footer-horizontal p-10 max-w-7xl mx-auto">

      {/* Columna: logo + descripción + redes sociales */}
      <aside className="max-w-xs">
        <img
          src={logo}
          alt="Juan Valdez Café"
          className="h-12 brightness-0 invert mb-3"
        />
        <p className="text-gray-300 text-sm leading-relaxed">
          La tradición cafetera de Colombia en el corazón de Lima.
          Sede Perú — Juan Valdez Café.
        </p>

        {/* Redes sociales — TODO: poner links reales */}
        <div className="flex gap-2 mt-4">
          <a
            href="#"
            aria-label="Instagram"
            className="btn btn-ghost btn-circle btn-sm text-gray-400 hover:text-white hover:bg-white/10"
          >
            <FaInstagram size={17} />
          </a>
          <a
            href="#"
            aria-label="Facebook"
            className="btn btn-ghost btn-circle btn-sm text-gray-400 hover:text-white hover:bg-white/10"
          >
            <FaFacebook size={17} />
          </a>
          <a
            href="#"
            aria-label="Twitter / X"
            className="btn btn-ghost btn-circle btn-sm text-gray-400 hover:text-white hover:bg-white/10"
          >
            <FaXTwitter size={17} />
          </a>
        </div>
      </aside>

      {/* Columna: Links de navegación */}
      <nav>
        <h6 className="footer-title opacity-60">Navegación</h6>
        <Link to="/" className="link link-hover text-gray-300 hover:text-white">
          Inicio
        </Link>
        <Link to="/menu" className="link link-hover text-gray-300 hover:text-white">
          Menú
        </Link>
        <Link to="/login" className="link link-hover text-gray-300 hover:text-white">
          Iniciar Sesión
        </Link>
      </nav>

      {/* Columna: Contacto */}
      <nav>
        <h6 className="footer-title opacity-60">Contacto</h6>
        <span className="flex items-center gap-2 text-gray-300 text-sm">
          <MapPin size={14} className="shrink-0" /> Av. Perú 123, Lima
        </span>
        <span className="flex items-center gap-2 text-gray-300 text-sm">
          <Phone size={14} className="shrink-0" /> +51 1 234 5678
        </span>
        <span className="flex items-center gap-2 text-gray-300 text-sm">
          <Mail size={14} className="shrink-0" /> contacto@juanvaldez.pe
        </span>
      </nav>

      {/* Columna: Horario de atención */}
      <nav>
        <h6 className="footer-title opacity-60">Horario</h6>
        <span className="flex items-start gap-2 text-gray-300 text-sm">
          <Clock size={14} className="shrink-0 mt-0.5" />
          <span>
            Lun – Vie: 7:00 AM – 9:00 PM<br />
            Sáb: 8:00 AM – 10:00 PM<br />
            Dom: 9:00 AM – 8:00 PM
          </span>
        </span>
      </nav>
    </div>

    {/* ---- Copyright ---- */}
    <div className="footer footer-center border-t border-white/10 p-4 text-gray-500 text-xs">
      <p>© 2026 Juan Valdez Café Perú · Todos los derechos reservados.</p>
    </div>
  </footer>
);

export default Footer;

