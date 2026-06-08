import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    createPromocion,
    deletePromocion,
    getAllPromociones,
    updatePromocion
} from '../../services/api';

const today = () => new Date().toISOString().slice(0, 10);

const getPromoStatus = (promo) => {
  const currentDate = today();

  if (!promo.estado) return { label: 'Inactiva', className: 'badge-error' };
  if (promo.fecha_inicio && promo.fecha_inicio > currentDate) {
    return { label: 'Programada', className: 'badge-info' };
  }
  if (promo.fecha_fin && promo.fecha_fin < currentDate) {
    return { label: 'Expirada', className: 'badge-warning' };
  }
  if (promo.usos_maximos != null && promo.usos_actuales >= promo.usos_maximos) {
    return { label: 'Sin usos', className: 'badge-neutral' };
  }

  return { label: 'Activa', className: 'badge-success' };
};

const emptyForm = {
  codigo: '',
  titulo: '',
  descripcion: '',
  tipo: 'porcentaje',
  valor: '',
  minimo_compra: '',
  usos_maximos: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: '',
  estado: true,
};

const Promotions = () => {
  const [promos, setPromos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      const data = await getAllPromociones();
      setPromos(data);
    } catch (err) {
      toast.error(err.message || 'No se pudieron cargar las promociones');
      setPromos([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (promo) => {
    setForm({
      codigo: promo.codigo,
      titulo: promo.titulo,
      descripcion: promo.descripcion || '',
      tipo: promo.tipo,
      valor: String(promo.valor),
      minimo_compra: String(promo.minimo_compra ?? ''),
      usos_maximos: promo.usos_maximos != null ? String(promo.usos_maximos) : '',
      fecha_inicio: promo.fecha_inicio ?? new Date().toISOString().slice(0, 10),
      fecha_fin: promo.fecha_fin ?? '',
      estado: promo.estado === true,
    });
    setEditingId(promo.id);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const set = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentDate = today();

    if (form.fecha_fin && form.fecha_inicio && form.fecha_fin < form.fecha_inicio) {
      toast.error('La fecha fin no puede ser anterior a la fecha inicio');
      return;
    }

    if (form.estado && form.fecha_fin && form.fecha_fin < currentDate) {
      toast.error('Para activar una promoción, la fecha fin debe estar vigente');
      return;
    }

    const payload = {
      ...form,
      valor: parseFloat(form.valor),
      minimo_compra: parseFloat(form.minimo_compra || 0),
      usos_maximos: form.usos_maximos !== '' ? parseInt(form.usos_maximos) : null,
      fecha_fin: form.fecha_fin || null,
      estado: form.estado ? 1 : 0,
    };
    try {
      if (editingId) {
        await updatePromocion(editingId, payload);
        toast.success('Promoción actualizada');
      } else {
        await createPromocion(payload);
        toast.success('Promoción creada');
      }
      closeModal();
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar esta promoción?')) return;
    try {
      await deletePromocion(id);
      toast.success('Promoción desactivada');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const etiquetaValor = (promo) =>
    promo.tipo === 'porcentaje'
      ? `${promo.valor}%`
      : `S/ ${Number(promo.valor).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-coffee">Promociones</h1>
          <p className="text-sm text-base-content/60">Gestiona los códigos de descuento del sistema.</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={openCreate}>
          <Plus size={16} /> Nueva Promoción
        </button>
      </div>

      {/* Tabla */}
      <div className="card card-border bg-base-100 shadow-sm overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Código</th>
              <th>Título</th>
              <th>Descuento</th>
              <th>Mín. compra</th>
              <th>Usos</th>
              <th>Válido hasta</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-base-content/50 py-8">
                  No hay promociones registradas.
                </td>
              </tr>
            )}
            {promos.map((p) => {
              const status = getPromoStatus(p);

              return (
                <tr key={p.id}>
                  <td>
                    <span className="font-mono font-bold tracking-widest">{p.codigo}</span>
                  </td>
                  <td>{p.titulo}</td>
                  <td>
                    <span className="badge badge-secondary">{etiquetaValor(p)}</span>
                  </td>
                  <td>{p.minimo_compra > 0 ? `S/ ${Number(p.minimo_compra).toFixed(2)}` : '—'}</td>
                  <td>
                    {p.usos_maximos != null
                      ? `${p.usos_actuales} / ${p.usos_maximos}`
                      : `${p.usos_actuales} / ∞`}
                  </td>
                  <td>{p.fecha_fin ?? '—'}</td>
                  <td>
                    <span className={`badge badge-sm ${status.className}`}>{status.label}</span>
                  </td>
                  <td>
                    <div className="join">
                      <button
                        className="btn btn-ghost btn-xs join-item"
                        onClick={() => openEdit(p)}
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs join-item text-error"
                        onClick={() => handleDelete(p.id)}
                        aria-label="Desactivar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {showModal && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {editingId ? 'Editar Promoción' : 'Nueva Promoción'}
              </h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Código */}
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Código *</legend>
                  <input
                    className="input input-bordered w-full font-mono uppercase"
                    value={form.codigo}
                    onChange={set('codigo')}
                    placeholder="PROMO20"
                    maxLength={30}
                    required
                  />
                </fieldset>

                {/* Tipo */}
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Tipo *</legend>
                  <select className="select select-bordered w-full" value={form.tipo} onChange={set('tipo')}>
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="monto_fijo">Monto fijo (S/)</option>
                  </select>
                </fieldset>
              </div>

              {/* Título */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Título *</legend>
                <input
                  className="input input-bordered w-full"
                  value={form.titulo}
                  onChange={set('titulo')}
                  placeholder="Ej: Descuento de Bienvenida"
                  maxLength={100}
                  required
                />
              </fieldset>

              {/* Descripción */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Descripción</legend>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={form.descripcion}
                  onChange={set('descripcion')}
                  rows={2}
                  placeholder="Descripción visible al usuario"
                />
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Valor */}
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">
                    Valor * {form.tipo === 'porcentaje' ? '(%)' : '(S/)'}
                  </legend>
                  <input
                    className="input input-bordered w-full"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.valor}
                    onChange={set('valor')}
                    required
                  />
                </fieldset>

                {/* Compra mínima */}
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Mínimo (S/)</legend>
                  <input
                    className="input input-bordered w-full"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minimo_compra}
                    onChange={set('minimo_compra')}
                    placeholder="0"
                  />
                </fieldset>

                {/* Usos máximos */}
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Usos máx.</legend>
                  <input
                    className="input input-bordered w-full"
                    type="number"
                    min="1"
                    step="1"
                    value={form.usos_maximos}
                    onChange={set('usos_maximos')}
                    placeholder="Sin límite"
                  />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fecha inicio */}
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Fecha inicio *</legend>
                  <input
                    className="input input-bordered w-full"
                    type="date"
                    value={form.fecha_inicio}
                    onChange={set('fecha_inicio')}
                    required
                  />
                </fieldset>

                {/* Fecha fin */}
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Fecha fin</legend>
                  <input
                    className="input input-bordered w-full"
                    type="date"
                    value={form.fecha_fin}
                    onChange={set('fecha_fin')}
                  />
                </fieldset>
              </div>

              {/* Estado (solo al editar) */}
              {editingId && (
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={form.estado}
                      onChange={set('estado')}
                    />
                    <span className="label-text">Promoción activa</span>
                  </label>
                </div>
              )}

              <div className="modal-action mt-2">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar cambios' : 'Crear promoción'}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={closeModal}>Cerrar</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default Promotions;
