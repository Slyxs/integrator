import { ClipboardCheck, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createInspeccion,
  deleteInspeccion,
  getControlCalidad,
  getProducts,
  updateInspeccion,
} from '../../services/api';

const emptyForm = {
  productoId: '',
  productoNombre: '',
  lote: '',
  fechaInspeccion: new Date().toISOString().slice(0, 10),
  inspector: '',
  temperatura: '',
  puntuacion: '',
  resultado: 'aprobado',
  observaciones: '',
};

const resultadoInfo = {
  aprobado: { label: 'Aprobado', className: 'badge-success' },
  observado: { label: 'Observado', className: 'badge-warning' },
  rechazado: { label: 'Rechazado', className: 'badge-error' },
};

const QualityControl = () => {
  const [inspecciones, setInspecciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      const [insp, prods] = await Promise.all([getControlCalidad(), getProducts()]);
      setInspecciones(insp);
      setProductos(prods);
    } catch (err) {
      toast.error(err.message || 'No se pudieron cargar las inspecciones');
      setInspecciones([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => {
    const total = inspecciones.length;
    const aprobados = inspecciones.filter((i) => i.resultado === 'aprobado').length;
    const rechazados = inspecciones.filter((i) => i.resultado === 'rechazado').length;
    const tasa = total ? Math.round((aprobados / total) * 100) : 0;
    return { total, aprobados, rechazados, tasa };
  }, [inspecciones]);

  const filtered = inspecciones.filter((i) =>
    `${i.productoNombre ?? ''} ${i.lote ?? ''} ${i.inspector ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleProductChange = (e) => {
    const id = e.target.value;
    const prod = productos.find((p) => String(p.id) === id);
    setForm((prev) => ({
      ...prev,
      productoId: id,
      productoNombre: prod ? prod.nombre : prev.productoNombre,
    }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (i) => {
    setForm({
      productoId: i.productoId != null ? String(i.productoId) : '',
      productoNombre: i.productoNombre || '',
      lote: i.lote || '',
      fechaInspeccion: i.fechaInspeccion || new Date().toISOString().slice(0, 10),
      inspector: i.inspector || '',
      temperatura: i.temperatura != null ? String(i.temperatura) : '',
      puntuacion: i.puntuacion != null ? String(i.puntuacion) : '',
      resultado: i.resultado || 'aprobado',
      observaciones: i.observaciones || '',
    });
    setEditingId(i.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      productoId: form.productoId ? Number(form.productoId) : null,
      temperatura: form.temperatura !== '' ? parseFloat(form.temperatura) : null,
      puntuacion: form.puntuacion !== '' ? parseInt(form.puntuacion, 10) : 0,
    };
    try {
      if (editingId) {
        await updateInspeccion(editingId, payload);
        toast.success('Inspección actualizada');
      } else {
        await createInspeccion(payload);
        toast.success('Inspección registrada');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta inspección?')) return;
    try {
      await deleteInspeccion(id);
      toast.success('Inspección eliminada');
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
            <ClipboardCheck size={26} /> Control de Calidad
          </h1>
          <p className="text-sm text-base-content/70">Inspecciones y evaluación de productos.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="input input-bordered w-full sm:w-80">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar inspección"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> Nueva inspección
          </button>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Inspecciones</div>
            <div className="stat-value text-2xl">{stats.total}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Aprobados</div>
            <div className="stat-value text-2xl text-success">{stats.aprobados}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Rechazados</div>
            <div className="stat-value text-2xl text-error">{stats.rechazados}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Tasa de aprobación</div>
            <div className="stat-value text-2xl">{stats.tasa}%</div>
          </div>
        </div>
      </section>

      {/* Tabla */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Lote</th>
                <th>Fecha</th>
                <th>Inspector</th>
                <th className="text-center">Puntuación</th>
                <th>Resultado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const info = resultadoInfo[i.resultado] || resultadoInfo.aprobado;
                return (
                  <tr key={i.id}>
                    <td className="font-medium">{i.productoNombre || '—'}</td>
                    <td className="font-mono text-sm">{i.lote || '—'}</td>
                    <td>{i.fechaInspeccion}</td>
                    <td>{i.inspector || '—'}</td>
                    <td className="text-center">
                      <span className="font-semibold">{i.puntuacion}</span>
                      <span className="text-base-content/50">/100</span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${info.className}`}>{info.label}</span>
                    </td>
                    <td className="text-right">
                      <div className="join">
                        <button type="button" onClick={() => openEdit(i)} className="btn btn-ghost btn-sm join-item" aria-label="Editar">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(i.id)} className="btn btn-ghost btn-sm join-item text-error" aria-label="Eliminar">
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
                    No hay inspecciones registradas.
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
              <h2 className="text-xl font-bold">{editingId ? 'Editar inspección' : 'Nueva inspección'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Producto</legend>
                  <select value={form.productoId} onChange={handleProductChange} className="select select-bordered w-full">
                    <option value="">— Selecciona —</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Lote</legend>
                  <input value={form.lote} onChange={set('lote')} className="input input-bordered w-full font-mono" placeholder="LT-2401" maxLength={40} />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Fecha de inspección *</legend>
                  <input type="date" required value={form.fechaInspeccion} onChange={set('fechaInspeccion')} className="input input-bordered w-full" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Inspector</legend>
                  <input value={form.inspector} onChange={set('inspector')} className="input input-bordered w-full" placeholder="Ej. Fiorella Ramos" />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Temperatura (°C)</legend>
                  <input type="number" step="0.1" value={form.temperatura} onChange={set('temperatura')} className="input input-bordered w-full" placeholder="68.5" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Puntuación (0-100)</legend>
                  <input type="number" min="0" max="100" value={form.puntuacion} onChange={set('puntuacion')} className="input input-bordered w-full" placeholder="95" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Resultado</legend>
                  <select value={form.resultado} onChange={set('resultado')} className="select select-bordered w-full">
                    <option value="aprobado">Aprobado</option>
                    <option value="observado">Observado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Observaciones</legend>
                <textarea value={form.observaciones} onChange={set('observaciones')} className="textarea textarea-bordered w-full" rows={2} placeholder="Notas de la inspección" />
              </fieldset>

              <div className="modal-action">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar cambios' : 'Registrar inspección'}
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

export default QualityControl;
