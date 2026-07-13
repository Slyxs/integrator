import { Coins, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createBono,
  deleteBono,
  getBonos,
  getTrabajadores,
  updateBono,
} from '../../services/api';

const emptyForm = {
  trabajadorId: '',
  tipo: 'productividad',
  concepto: '',
  monto: '',
  fecha: new Date().toISOString().slice(0, 10),
  estado: 'pendiente',
  observaciones: '',
};

const tipoLabel = {
  productividad: 'Productividad',
  puntualidad: 'Puntualidad',
  ventas: 'Ventas',
  antiguedad: 'Antigüedad',
  otro: 'Otro',
};

const estadoInfo = {
  pendiente: { label: 'Pendiente', className: 'badge-warning' },
  pagado: { label: 'Pagado', className: 'badge-success' },
};

const formatMonto = (valor) =>
  `S/ ${Number(valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Bonuses = () => {
  const [bonos, setBonos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      const [bns, trabs] = await Promise.all([getBonos(), getTrabajadores()]);
      setBonos(bns);
      setTrabajadores(trabs);
    } catch (err) {
      toast.error(err.message || 'No se pudieron cargar los bonos');
      setBonos([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => {
    const total = bonos.length;
    const montoTotal = bonos.reduce((sum, b) => sum + Number(b.monto || 0), 0);
    const pendientes = bonos.filter((b) => b.estado === 'pendiente').length;
    const montoPendiente = bonos
      .filter((b) => b.estado === 'pendiente')
      .reduce((sum, b) => sum + Number(b.monto || 0), 0);
    return { total, montoTotal, pendientes, montoPendiente };
  }, [bonos]);

  const filtered = bonos.filter((b) =>
    `${b.trabajadorNombre ?? ''} ${b.tipo ?? ''} ${b.concepto ?? ''} ${b.estado ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (b) => {
    setForm({
      trabajadorId: b.trabajadorId != null ? String(b.trabajadorId) : '',
      tipo: b.tipo || 'productividad',
      concepto: b.concepto || '',
      monto: b.monto != null ? String(b.monto) : '',
      fecha: b.fecha || new Date().toISOString().slice(0, 10),
      estado: b.estado || 'pendiente',
      observaciones: b.observaciones || '',
    });
    setEditingId(b.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.trabajadorId) {
      toast.error('Selecciona un trabajador');
      return;
    }
    const payload = {
      ...form,
      trabajadorId: Number(form.trabajadorId),
      monto: form.monto !== '' ? parseFloat(form.monto) : 0,
    };
    try {
      if (editingId) {
        await updateBono(editingId, payload);
        toast.success('Bono actualizado');
      } else {
        await createBono(payload);
        toast.success('Bono registrado');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este bono?')) return;
    try {
      await deleteBono(id);
      toast.success('Bono eliminado');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-coffee">
            <Coins size={26} /> Bonos
          </h1>
          <p className="text-sm text-base-content/70">Incentivos y bonificaciones del personal.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="input input-bordered w-full sm:w-80">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar por trabajador o tipo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> Nuevo bono
          </button>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Bonos</div>
            <div className="stat-value text-2xl">{stats.total}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Monto total</div>
            <div className="stat-value text-xl">{formatMonto(stats.montoTotal)}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Pendientes</div>
            <div className="stat-value text-2xl text-warning">{stats.pendientes}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Monto pendiente</div>
            <div className="stat-value text-xl text-warning">{formatMonto(stats.montoPendiente)}</div>
          </div>
        </div>
      </section>

      {/* Tabla */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th className="text-right">Monto</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const info = estadoInfo[b.estado] || estadoInfo.pendiente;
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="font-medium">{b.trabajadorNombre || '—'}</div>
                      {b.trabajadorCargo && (
                        <div className="text-xs text-base-content/60">{b.trabajadorCargo}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm">{tipoLabel[b.tipo] || b.tipo}</span>
                    </td>
                    <td className="max-w-xs truncate text-sm text-base-content/70">{b.concepto || '—'}</td>
                    <td className="text-right font-semibold">{formatMonto(b.monto)}</td>
                    <td>{b.fecha}</td>
                    <td>
                      <span className={`badge badge-sm ${info.className}`}>{info.label}</span>
                    </td>
                    <td className="text-right">
                      <div className="join">
                        <button type="button" onClick={() => openEdit(b)} className="btn btn-ghost btn-sm join-item" aria-label="Editar">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(b.id)} className="btn btn-ghost btn-sm join-item text-error" aria-label="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-base-content/60 py-8">
                    No hay bonos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{editingId ? 'Editar bono' : 'Nuevo bono'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Trabajador *</legend>
                  <select value={form.trabajadorId} onChange={set('trabajadorId')} className="select select-bordered w-full" required>
                    <option value="">— Selecciona —</option>
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} {t.apellido}
                      </option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Tipo</legend>
                  <select value={form.tipo} onChange={set('tipo')} className="select select-bordered w-full">
                    <option value="productividad">Productividad</option>
                    <option value="puntualidad">Puntualidad</option>
                    <option value="ventas">Ventas</option>
                    <option value="antiguedad">Antigüedad</option>
                    <option value="otro">Otro</option>
                  </select>
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Concepto</legend>
                <input value={form.concepto} onChange={set('concepto')} className="input input-bordered w-full" placeholder="Motivo del bono" maxLength={150} />
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Monto (S/) *</legend>
                  <input type="number" min="0" step="0.01" required value={form.monto} onChange={set('monto')} className="input input-bordered w-full" placeholder="150.00" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Fecha *</legend>
                  <input type="date" required value={form.fecha} onChange={set('fecha')} className="input input-bordered w-full" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Estado</legend>
                  <select value={form.estado} onChange={set('estado')} className="select select-bordered w-full">
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                  </select>
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Observaciones</legend>
                <textarea value={form.observaciones} onChange={set('observaciones')} className="textarea textarea-bordered w-full" rows={2} placeholder="Notas del bono" />
              </fieldset>

              <div className="modal-action">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar cambios' : 'Registrar bono'}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setShowModal(false)}>Cerrar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Bonuses;
