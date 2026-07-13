import { BookText, CheckCircle2, Search, Send } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { createReclamacion, getReclamacionByCodigo } from '../services/api';

const emptyForm = {
  tipo: 'reclamo',
  nombre: '',
  apellido: '',
  tipoDocumento: 'DNI',
  documento: '',
  email: '',
  telefono: '',
  direccion: '',
  menorEdad: false,
  tipoBien: 'producto',
  montoReclamado: '',
  descripcionBien: '',
  detalle: '',
  pedido: '',
};

const estadoLabel = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado',
};

const ComplaintsBook = () => {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Consulta de estado por código
  const [codigoConsulta, setCodigoConsulta] = useState('');
  const [consulta, setConsulta] = useState(null);
  const [consultando, setConsultando] = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const payload = {
        ...form,
        montoReclamado: form.montoReclamado !== '' ? parseFloat(form.montoReclamado) : null,
      };
      const res = await createReclamacion(payload);
      setResultado(res);
      setForm(emptyForm);
      toast.success('Reclamación registrada correctamente');
    } catch (err) {
      toast.error(err.message || 'No se pudo registrar la reclamación');
    } finally {
      setSending(false);
    }
  };

  const handleConsulta = async (e) => {
    e.preventDefault();
    if (!codigoConsulta.trim()) return;
    setConsultando(true);
    setConsulta(null);
    try {
      const data = await getReclamacionByCodigo(codigoConsulta.trim());
      setConsulta(data);
    } catch (err) {
      toast.error(err.message || 'No se encontró la reclamación');
    } finally {
      setConsultando(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200/40">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-box bg-primary/10 p-4 text-primary mb-3">
            <BookText size={32} />
          </div>
          <h1 className="text-4xl font-bold">Libro de Reclamaciones</h1>
          <p className="text-base-content/60 mt-2 max-w-2xl mx-auto">
            Conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571).
            Registra tu reclamo o queja y recibirás un código para dar seguimiento.
          </p>
        </div>

        {/* Confirmación tras enviar */}
        {resultado && (
          <div className="alert alert-success mb-8 flex-col items-start sm:flex-row sm:items-center">
            <CheckCircle2 size={22} />
            <div>
              <p className="font-semibold">¡Tu {resultado.codigo?.startsWith('REC') ? 'registro' : 'reclamación'} fue recibida!</p>
              <p className="text-sm">
                Guarda tu código de seguimiento: <span className="font-mono font-bold">{resultado.codigo}</span>.
                Te responderemos en un plazo máximo de 30 días calendario.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title">Formulario de reclamación</h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Tipo */}
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Tipo de solicitud *</legend>
                    <div className="join">
                      <input
                        type="radio"
                        name="tipo"
                        className="join-item btn btn-sm"
                        aria-label="Reclamo"
                        checked={form.tipo === 'reclamo'}
                        onChange={() => setForm((p) => ({ ...p, tipo: 'reclamo' }))}
                      />
                      <input
                        type="radio"
                        name="tipo"
                        className="join-item btn btn-sm"
                        aria-label="Queja"
                        checked={form.tipo === 'queja'}
                        onChange={() => setForm((p) => ({ ...p, tipo: 'queja' }))}
                      />
                    </div>
                    <p className="text-xs text-base-content/50 mt-1">
                      Reclamo: disconformidad con el producto/servicio. Queja: malestar con la atención.
                    </p>
                  </fieldset>

                  {/* Identificación */}
                  <div className="divider text-sm text-base-content/60">Datos del consumidor</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Nombres *</legend>
                      <input required value={form.nombre} onChange={set('nombre')} className="input input-bordered w-full" placeholder="Tus nombres" />
                    </fieldset>
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Apellidos *</legend>
                      <input required value={form.apellido} onChange={set('apellido')} className="input input-bordered w-full" placeholder="Tus apellidos" />
                    </fieldset>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Tipo doc.</legend>
                      <select value={form.tipoDocumento} onChange={set('tipoDocumento')} className="select select-bordered w-full">
                        <option value="DNI">DNI</option>
                        <option value="CE">C. Extranjería</option>
                        <option value="pasaporte">Pasaporte</option>
                        <option value="RUC">RUC</option>
                      </select>
                    </fieldset>
                    <fieldset className="fieldset sm:col-span-2">
                      <legend className="fieldset-legend">Número de documento</legend>
                      <input value={form.documento} onChange={set('documento')} className="input input-bordered w-full font-mono" placeholder="12345678" maxLength={20} />
                    </fieldset>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Correo electrónico</legend>
                      <input type="email" value={form.email} onChange={set('email')} className="input input-bordered w-full" placeholder="tu@correo.com" />
                    </fieldset>
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Teléfono</legend>
                      <input value={form.telefono} onChange={set('telefono')} className="input input-bordered w-full" placeholder="999-999-999" />
                    </fieldset>
                  </div>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Domicilio</legend>
                    <input value={form.direccion} onChange={set('direccion')} className="input input-bordered w-full" placeholder="Tu dirección" />
                  </fieldset>

                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" className="checkbox checkbox-sm" checked={form.menorEdad} onChange={set('menorEdad')} />
                    <span className="label-text">El consumidor es menor de edad</span>
                  </label>

                  {/* Bien contratado */}
                  <div className="divider text-sm text-base-content/60">Identificación del bien contratado</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Tipo de bien</legend>
                      <select value={form.tipoBien} onChange={set('tipoBien')} className="select select-bordered w-full">
                        <option value="producto">Producto</option>
                        <option value="servicio">Servicio</option>
                      </select>
                    </fieldset>
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Monto reclamado (S/)</legend>
                      <input type="number" min="0" step="0.01" value={form.montoReclamado} onChange={set('montoReclamado')} className="input input-bordered w-full" placeholder="Opcional" />
                    </fieldset>
                  </div>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Descripción del bien</legend>
                    <input value={form.descripcionBien} onChange={set('descripcionBien')} className="input input-bordered w-full" placeholder="Ej. Frappé de Café, atención en caja..." />
                  </fieldset>

                  {/* Detalle */}
                  <div className="divider text-sm text-base-content/60">Detalle de la reclamación</div>
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Detalle *</legend>
                    <textarea required value={form.detalle} onChange={set('detalle')} className="textarea textarea-bordered w-full" rows={4} placeholder="Describe lo sucedido con el mayor detalle posible" />
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Pedido concreto</legend>
                    <textarea value={form.pedido} onChange={set('pedido')} className="textarea textarea-bordered w-full" rows={2} placeholder="¿Qué solicitas? (devolución, reposición, etc.)" />
                  </fieldset>

                  <button type="submit" className="btn btn-primary w-full" disabled={sending}>
                    {sending ? <span className="loading loading-spinner loading-sm" /> : <Send size={16} />}
                    {sending ? 'Enviando...' : 'Enviar reclamación'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Consulta de estado + info */}
          <div className="space-y-6">
            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-lg">Consultar estado</h2>
                <p className="text-sm text-base-content/60">Ingresa tu código de seguimiento.</p>
                <form onSubmit={handleConsulta} className="space-y-2">
                  <label className="input input-bordered w-full">
                    <Search size={16} className="opacity-70" />
                    <input
                      type="text"
                      placeholder="REC-000001"
                      value={codigoConsulta}
                      onChange={(e) => setCodigoConsulta(e.target.value)}
                      className="font-mono uppercase"
                    />
                  </label>
                  <button type="submit" className="btn btn-outline btn-primary w-full btn-sm" disabled={consultando}>
                    {consultando ? <span className="loading loading-spinner loading-xs" /> : 'Consultar'}
                  </button>
                </form>

                {consulta && (
                  <div className="mt-3 rounded-box bg-base-200 p-3 text-sm space-y-1">
                    <p><span className="text-base-content/60">Código:</span> <span className="font-mono font-bold">{consulta.codigo}</span></p>
                    <p><span className="text-base-content/60">Estado:</span> <span className="badge badge-sm badge-primary">{estadoLabel[consulta.estado] || consulta.estado}</span></p>
                    {consulta.respuesta && (
                      <p><span className="text-base-content/60">Respuesta:</span> {consulta.respuesta}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-lg">Información</h2>
                <ul className="text-sm text-base-content/70 space-y-2 list-disc list-inside">
                  <li>El proveedor responderá en un plazo máximo de 30 días calendario.</li>
                  <li>La formulación del reclamo no impide acudir a otras vías de solución.</li>
                  <li>Este es un canal virtual del Libro de Reclamaciones.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsBook;
