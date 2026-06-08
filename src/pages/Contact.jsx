import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const MAP_CENTER = { lat: -12.0464, lng: -77.0428 }; // Lima, Perú
const MAP_STYLE  = { width: '100%', height: '420px', borderRadius: '0.75rem' };

const Contact = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const mapCenter     = useMemo(() => MAP_CENTER, []);
  const mapStyle      = useMemo(() => MAP_STYLE, []);
  const formRef       = useRef(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    // Simula envío — aquí se conectaría un endpoint real
    setTimeout(() => {
      toast.success('¡Mensaje enviado! Te responderemos pronto.');
      formRef.current?.reset();
      setSending(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════
          HERO: Formulario + info lateral
      ══════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <div className="hero">
          <div className="hero-content flex-col lg:flex-row lg:gap-16 items-start w-full">

            {/* ── Columna izquierda: texto + datos de contacto ── */}
            <div className="lg:w-5/12 w-full">
              <h1 className="text-4xl font-bold leading-tight">
                Ponte en Contacto
              </h1>
              <p className="text-base-content/60 mt-3 text-lg leading-relaxed">
                ¿Tienes preguntas, sugerencias o quieres hacer una reserva?<br />
                Estamos aquí para ayudarte.
              </p>

              <div className="divider my-6" />

              {/* Tarjetas de datos */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary rounded-box p-3">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">Dirección</p>
                    <p className="text-base-content/60 text-sm">Av. Perú 123, Lima, Perú</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary rounded-box p-3">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">Teléfono</p>
                    <p className="text-base-content/60 text-sm">+51 1 234 5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary rounded-box p-3">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">Correo</p>
                    <p className="text-base-content/60 text-sm">contacto@juanvaldez.pe</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary rounded-box p-3">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">Horario</p>
                    <p className="text-base-content/60 text-sm">
                      Lun – Vie: 7:00 AM – 9:00 PM<br />
                      Sáb: 8:00 AM – 10:00 PM<br />
                      Dom: 9:00 AM – 8:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Columna derecha: formulario ── */}
            <div className="lg:w-7/12 w-full">
              <div className="card border border-base-300 bg-base-100 shadow-sm">
                <div className="card-body gap-5">
                  <div>
                    <h2 className="card-title text-2xl">Envíanos un mensaje</h2>
                    <p className="text-base-content/60 text-sm">Responderemos en menos de 24 horas.</p>
                  </div>

                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <fieldset className="fieldset">
                        <legend className="fieldset-legend">Nombre *</legend>
                        <input
                          name="nombre"
                          type="text"
                          placeholder="Tu nombre"
                          className="input input-bordered w-full"
                          required
                        />
                      </fieldset>

                      <fieldset className="fieldset">
                        <legend className="fieldset-legend">Correo electrónico *</legend>
                        <input
                          name="email"
                          type="email"
                          placeholder="tu@correo.com"
                          className="input input-bordered w-full"
                          required
                        />
                      </fieldset>
                    </div>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Asunto</legend>
                      <select name="asunto" className="select select-bordered w-full">
                        <option value="">Selecciona un tema</option>
                        <option value="reserva">Reserva de mesa</option>
                        <option value="pedido">Consulta sobre pedido</option>
                        <option value="sugerencia">Sugerencia</option>
                        <option value="reclamo">Reclamo</option>
                        <option value="otro">Otro</option>
                      </select>
                    </fieldset>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Mensaje *</legend>
                      <textarea
                        name="mensaje"
                        placeholder="Escribe tu mensaje aquí..."
                        className="textarea textarea-bordered w-full"
                        rows={5}
                        required
                      />
                    </fieldset>

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={sending}
                    >
                      {sending
                        ? <span className="loading loading-spinner loading-sm" />
                        : <Send size={16} />
                      }
                      {sending ? 'Enviando...' : 'Enviar mensaje'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SECCIÓN: ¿Dónde encontrarnos? + Mapa
      ══════════════════════════════════════════ */}
      <div className="bg-base-200 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">¿Dónde encontrarnos?</h2>
            <p className="text-base-content/60 mt-2 max-w-xl mx-auto">
              Visítanos en nuestra sede principal o contáctanos por cualquiera de nuestros canales digitales.
            </p>
          </div>

          {/* Mapa */}
          <div className="rounded-box overflow-hidden shadow-md mb-10">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapStyle}
                center={mapCenter}
                zoom={14}
                options={{ disableDefaultUI: true, zoomControl: true }}
              >
                <Marker position={mapCenter} />
              </GoogleMap>
            ) : (
              <div className="h-[420px] w-full bg-base-300 flex items-center justify-center text-base-content/50">
                <span className="loading loading-spinner loading-md mr-2" />
                Cargando mapa...
              </div>
            )}
          </div>

          {/* Stats de contacto rápido */}
          <div className="stats stats-vertical sm:stats-horizontal shadow w-full bg-base-100">
            <div className="stat">
              <div className="stat-figure text-primary">
                <Phone size={28} />
              </div>
              <div className="stat-title">Teléfono</div>
              <div className="stat-value text-lg">+51 1 234 5678</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-primary">
                <Mail size={28} />
              </div>
              <div className="stat-title">Email</div>
              <div className="stat-value text-lg">contacto@juanvaldez.pe</div>
            </div>

            <div className="stat">
              <div className="stat-figure text-primary">
                <MapPin size={28} />
              </div>
              <div className="stat-title">Dirección</div>
              <div className="stat-value text-lg">Av. Perú 123, Lima</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Contact;
