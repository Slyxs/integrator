// =============================================
// Página principal / Landing page de Juan Valdez
// TODO: Añadir sección de acordeón con preguntas frecuentes
// TODO: Añadir carrusel de productos destacados cuando tengamos imágenes
// =============================================
import { Link } from 'react-router-dom';
import { Coffee, Award, Heart, ArrowRight, Star, ChevronDown, Leaf } from 'lucide-react';
import heroBg from '../assets/imgs/home-hero.jpg';

// Características principales del café — podría venir de la BD después
const features = [
  {
    icon: Coffee,
    title: 'Origen Colombiano',
    desc: 'Granos 100% colombianos de las mejores regiones cafeteras, traídos directamente a Perú.',
  },
  {
    icon: Award,
    title: 'Calidad Garantizada',
    desc: 'Cada grano pasa por estrictos controles de calidad para asegurar la mejor experiencia en cada taza.',
  },
  {
    icon: Heart,
    title: 'Sabor en Lima',
    desc: 'Nuestros baristas peruanos preparan con dedicación la tradición cafetera colombiana.',
  },
];

// Reseñas de clientes — TODO: conectar con reseñas reales de la BD
const reseñas = [
  { nombre: 'María R.', texto: 'El mejor café que he tomado en Lima. ¡La crema de los Andes!' },
  { nombre: 'Carlos P.', texto: 'Ambiente increíble, baristas muy profesionales. Vuelvo siempre.' },
  { nombre: 'Lucía T.', texto: 'El cold brew es una obra de arte. Totalmente recomendado.' },
];

const Home = () => {
  return (
    <div>

      {/* ===== HÉROE PRINCIPAL ===== */}
      {/* TODO: Quizás añadir un video de fondo o parallax aquí */}
      <div
        className="hero min-h-[85vh] relative overflow-hidden"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Overlay oscuro para que el texto se lea bien sobre cualquier foto */}
        <div className="hero-overlay bg-black/55"></div>

        <div className="hero-content text-center text-white z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              El Café de Colombia, Ahora en Perú
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-xl mx-auto leading-relaxed">
              El auténtico café colombiano Juan Valdez llega a Lima.
              Origen, tradición y pasión en cada taza.
            </p>

            {/* Botones de acción principal */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/menu" className="btn btn-secondary btn-lg gap-2">
                Ver Menú <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="btn btn-outline btn-lg border-white text-white hover:bg-white/10 hover:border-white"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>

        {/* Flecha animada para indicar scroll — detalle pequeño que queda bien */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <ChevronDown size={30} />
        </div>
      </div>

      {/* ===== SECCIÓN: ¿POR QUÉ ELEGIRNOS? ===== */}
      {/* TODO: Añadir acordeón de preguntas frecuentes justo debajo */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4">

          {/* Encabezado de sección */}
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-coffee">
              ¿Por qué Juan Valdez Perú?
            </h2>
            <div className="divider divider-primary max-w-xs mx-auto mt-1 mb-0"></div>
            <p className="text-base-content/60 mt-3 max-w-lg mx-auto">
              La marca cafetera más icónica de Colombia, ahora con sede propia en Lima.
            </p>
          </div>

          {/* Cards de características — layout en 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((item, i) => {
              // Capitalizamos para poder usarlo como componente JSX
              const FeatureIcon = item.icon;
              return (
                <div
                  key={i}
                  className="card bg-base-100 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-base-200"
                >
                  <div className="card-body items-center text-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <FeatureIcon size={28} className="text-primary" />
                    </div>
                    <h2 className="card-title text-coffee">{item.title}</h2>
                    <p className="text-base-content/70 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN: BADGE DE ORIGEN ===== */}
      {/* Pequeña sección para reforzar el origen peruano — simple pero efectiva */}
      <section className="py-12 bg-base-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="stats stats-vertical sm:stats-horizontal shadow w-full border border-base-200">
            <div className="stat place-items-center">
              <div className="stat-figure text-primary">
                <Leaf size={28} />
              </div>
              <div className="stat-title">Origen</div>
              <div className="stat-value text-primary text-2xl">100%</div>
              <div className="stat-desc">Colombiano</div>
            </div>
            <div className="stat place-items-center">
              <div className="stat-figure text-secondary">
                <Coffee size={28} />
              </div>
              <div className="stat-title">Variedades</div>
              <div className="stat-value text-secondary text-2xl">12+</div>
              <div className="stat-desc">En nuestro menú</div>
            </div>
            <div className="stat place-items-center">
              <div className="stat-figure text-warning">
                <Star size={28} />
              </div>
              <div className="stat-title">Calificación</div>
              <div className="stat-value text-warning text-2xl">4.9</div>
              <div className="stat-desc">De nuestros clientes</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECCIÓN: RESEÑAS DE CLIENTES ===== */}
      {/* TODO: Conectar con reseñas reales de la BD cuando estén disponibles */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-coffee mb-10">
            Lo que dicen nuestros clientes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reseñas.map((review, i) => (
              <div key={i} className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body gap-3">
                  {/* Rating readonly de daisyUI en vez de iconos sueltos */}
                  <div className="rating rating-sm pointer-events-none">
                    <input type="radio" name={`rating-${i}`} className="mask mask-star-2 bg-warning" aria-label="1 estrella" />
                    <input type="radio" name={`rating-${i}`} className="mask mask-star-2 bg-warning" aria-label="2 estrellas" />
                    <input type="radio" name={`rating-${i}`} className="mask mask-star-2 bg-warning" aria-label="3 estrellas" />
                    <input type="radio" name={`rating-${i}`} className="mask mask-star-2 bg-warning" aria-label="4 estrellas" />
                    <input type="radio" name={`rating-${i}`} className="mask mask-star-2 bg-warning" aria-label="5 estrellas" defaultChecked />
                  </div>
                  <p className="text-sm italic text-base-content/75 leading-relaxed">
                    "{review.texto}"
                  </p>
                  <p className="text-sm font-semibold text-coffee">— {review.nombre}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <div className="hero py-20 bg-primary text-white">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para tu primer sorbo?
            </h2>
            <p className="text-lg mb-8 text-gray-200 leading-relaxed">
              Explora nuestro menú y descubre el café colombiano que ya conquistó Lima.
            </p>
            <Link
              to="/menu"
              className="btn btn-lg bg-white text-primary hover:bg-gray-100 border-none gap-2"
            >
              Explorar Menú <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;

