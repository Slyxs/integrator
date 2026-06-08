import { ChevronDown, ChevronUp, Clock, Mail, MapPin, Pencil, Phone, ReceiptText, ShieldCheck, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getClientByUserId, getSalesByUserId } from '../../services/api';

const METODO_LABEL = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', yape: 'Yape' };
const ESTADO_CLASS = { completada: 'badge-success', anulada: 'badge-error' };

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [clienteData, ventasData] = await Promise.all([
          getClientByUserId(user.id),
          getSalesByUserId(user.id),
        ]);
        setCliente(clienteData);
        setVentas(ventasData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  const openEdit = () => {
    setEditForm({ nombre: user.nombre, email: user.email, password: '', confirmPassword: '' });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        nombre: editForm.nombre,
        email: editForm.email,
        password: editForm.password || undefined,
      });
      toast.success('Perfil actualizado');
      setShowEdit(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <>
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-sm text-base-content/60">Información de tu cuenta y historial de pedidos.</p>
      </div>

      {/* ── Tarjeta de información ── */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body gap-4">
          {/* Avatar + nombre + botón editar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="avatar avatar-placeholder">
                <div className="bg-primary text-primary-content w-16 rounded-full">
                  <span className="text-2xl font-bold">
                    {user.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {cliente ? `${cliente.nombre} ${cliente.apellido}` : user.nombre}
                </h2>
                <span className={`badge badge-sm ${user.rol === 'admin' ? 'badge-warning' : 'badge-neutral'}`}>
                  {user.rol === 'admin' ? 'Administrador' : 'Cliente'}
                </span>
              </div>
            </div>
            <button type="button" onClick={openEdit} className="btn btn-outline btn-sm gap-2">
              <Pencil size={14} />
              Editar
            </button>
          </div>

          <div className="divider my-0" />

          {/* Campos de info */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoRow icon={<Mail size={16} />} label="Correo" value={user.email} />
            <InfoRow icon={<ShieldCheck size={16} />} label="Rol" value={user.rol === 'admin' ? 'Administrador' : 'Usuario'} />
            {cliente && (
              <>
                <InfoRow icon={<Phone size={16} />} label="Teléfono" value={cliente.telefono || '—'} />
                <InfoRow icon={<User size={16} />} label="Documento" value={cliente.documento || '—'} />
                <InfoRow
                  icon={<MapPin size={16} />}
                  label="Dirección"
                  value={cliente.direccion || '—'}
                  className="sm:col-span-2"
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Historial de pedidos ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ReceiptText size={20} className="text-primary" />
          <h2 className="text-xl font-bold">Historial de pedidos</h2>
          <span className="badge badge-neutral badge-sm ml-1">{ventas.length}</span>
        </div>

        {ventas.length === 0 ? (
          <div className="card border border-base-300 bg-base-100">
            <div className="card-body items-center py-10 text-base-content/50">
              <ReceiptText size={36} strokeWidth={1.2} />
              <p className="mt-2">Aún no tienes pedidos registrados.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {ventas.map((venta) => (
              <div key={venta.id} className="card border border-base-300 bg-base-100 shadow-sm">
                {/* Fila de resumen — siempre visible */}
                <button
                  type="button"
                  className="card-body flex-row items-center justify-between gap-3 p-4 text-left hover:bg-base-200/50 transition-colors rounded-box"
                  onClick={() => toggleExpand(venta.id)}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">{venta.numero}</span>
                    <span className="text-xs text-base-content/50 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(venta.fecha).toLocaleDateString('es-PE', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`badge badge-sm ${ESTADO_CLASS[venta.estado] ?? 'badge-ghost'}`}>
                      {venta.estado}
                    </span>
                    <span className="font-bold text-primary">${Number(venta.total).toFixed(2)}</span>
                    <span className="badge badge-outline badge-sm hidden sm:inline-flex">
                      {METODO_LABEL[venta.metodoPago] ?? venta.metodoPago}
                    </span>
                    {expandedId === venta.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* Detalle — visible al expandir */}
                {expandedId === venta.id && (
                  <div className="px-4 pb-4">
                    <div className="overflow-x-auto rounded-box border border-base-200">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th className="text-center">Cant.</th>
                            <th className="text-right">Precio</th>
                            <th className="text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {venta.items.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.nombre}</td>
                              <td className="text-center">{item.cantidad}</td>
                              <td className="text-right">${Number(item.precioUnitario).toFixed(2)}</td>
                              <td className="text-right font-medium">${Number(item.subtotal).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-right font-bold">Total</td>
                            <td className="text-right font-bold text-primary">${Number(venta.total).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>

    {/* ── Modal editar perfil ── */}
    {showEdit && (
      <div className="modal modal-open">
        <div className="modal-box max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Editar perfil</h2>
              <p className="text-sm text-base-content/60">Actualiza tu nombre, correo o contraseña.</p>
            </div>
            <button type="button" onClick={() => setShowEdit(false)} className="btn btn-ghost btn-sm btn-circle" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nombre *</legend>
              <input
                type="text"
                className="input input-bordered w-full"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Correo electrónico *</legend>
              <input
                type="email"
                className="input input-bordered w-full"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </fieldset>

            <div className="divider text-xs text-base-content/40">Contraseña (opcional)</div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nueva contraseña</legend>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="Dejar en blanco para no cambiar"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                minLength={editForm.password ? 6 : undefined}
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Confirmar contraseña</legend>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="Repite la nueva contraseña"
                value={editForm.confirmPassword}
                onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
              />
            </fieldset>

            <div className="modal-action mt-2">
              <button type="button" onClick={() => setShowEdit(false)} className="btn btn-ghost">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <span className="loading loading-spinner loading-xs" />}
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
        <div className="modal-backdrop" onClick={() => setShowEdit(false)} />
      </div>
    )}
  </>
  );
};

const InfoRow = ({ icon, label, value, className = '' }) => (
  <div className={`flex items-start gap-2 ${className}`}>
    <span className="mt-0.5 text-base-content/50">{icon}</span>
    <div>
      <p className="text-xs text-base-content/50">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

export default Profile;
