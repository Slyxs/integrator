import { Pencil, Plus, Search, Trash2, UserCog, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createTrabajador,
  deleteTrabajador,
  getTrabajadores,
  updateTrabajador,
} from '../../services/api';

const emptyForm = {
  nombre: '',
  apellido: '',
  documento: '',
  cargo: '',
  telefono: '',
  email: '',
  salario: '',
  fechaIngreso: '',
  turno: 'mañana',
};

const turnoBadge = {
  'mañana': 'badge-warning',
  'tarde': 'badge-info',
  'noche': 'badge-neutral',
};

const Workers = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      const data = await getTrabajadores();
      setTrabajadores(data);
    } catch (err) {
      toast.error(err.message || 'No se pudieron cargar los trabajadores');
      setTrabajadores([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = trabajadores.filter((t) =>
    `${t.nombre} ${t.apellido} ${t.documento ?? ''} ${t.cargo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setForm({
      nombre: t.nombre || '',
      apellido: t.apellido || '',
      documento: t.documento || '',
      cargo: t.cargo || '',
      telefono: t.telefono || '',
      email: t.email || '',
      salario: t.salario != null ? String(t.salario) : '',
      fechaIngreso: t.fechaIngreso || '',
      turno: t.turno || 'mañana',
    });
    setEditingId(t.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      salario: parseFloat(form.salario || 0),
    };
    try {
      if (editingId) {
        await updateTrabajador(editingId, payload);
        toast.success('Trabajador actualizado');
      } else {
        await createTrabajador(payload);
        toast.success('Trabajador registrado');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Dar de baja a este trabajador?')) return;
    try {
      await deleteTrabajador(id);
      toast.success('Trabajador dado de baja');
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
            <UserCog size={26} /> Trabajadores
          </h1>
          <p className="text-sm text-base-content/70">Mantenimiento del personal de la cafetería.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="input input-bordered w-full sm:w-80">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar trabajador"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> Nuevo trabajador
          </button>
        </div>
      </section>

      {/* Tabla */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Cargo</th>
                <th>Turno</th>
                <th className="text-right">Salario</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-placeholder shrink-0">
                        <div className="bg-primary text-primary-content w-8 rounded-full">
                          <span className="text-xs leading-none">{t.nombre?.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                      <div>
                        <div>{t.nombre} {t.apellido}</div>
                        {t.email && <div className="text-xs text-base-content/50">{t.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-sm">{t.documento || '—'}</td>
                  <td>{t.cargo}</td>
                  <td>
                    <span className={`badge badge-sm capitalize ${turnoBadge[t.turno] || 'badge-ghost'}`}>
                      {t.turno}
                    </span>
                  </td>
                  <td className="text-right">S/ {Number(t.salario).toFixed(2)}</td>
                  <td className="text-right">
                    <div className="join">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="btn btn-ghost btn-sm join-item"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="btn btn-ghost btn-sm join-item text-error"
                        aria-label="Dar de baja"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-base-content/60 py-8">
                    No se encontraron trabajadores.
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
              <h2 className="text-xl font-bold">{editingId ? 'Editar trabajador' : 'Nuevo trabajador'}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Nombre *</legend>
                  <input required value={form.nombre} onChange={set('nombre')} className="input input-bordered w-full" placeholder="Ej. Lucía" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Apellido *</legend>
                  <input required value={form.apellido} onChange={set('apellido')} className="input input-bordered w-full" placeholder="Ej. Mendoza" />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Documento (DNI)</legend>
                  <input value={form.documento} onChange={set('documento')} className="input input-bordered w-full font-mono" placeholder="45678912" maxLength={20} />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Cargo *</legend>
                  <input required value={form.cargo} onChange={set('cargo')} className="input input-bordered w-full" placeholder="Ej. Barista" />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Teléfono</legend>
                  <input value={form.telefono} onChange={set('telefono')} className="input input-bordered w-full" placeholder="988-111-222" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Email</legend>
                  <input type="email" value={form.email} onChange={set('email')} className="input input-bordered w-full" placeholder="correo@juanvaldez.com" />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Salario (S/)</legend>
                  <input type="number" min="0" step="0.01" value={form.salario} onChange={set('salario')} className="input input-bordered w-full" placeholder="1500.00" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Fecha de ingreso</legend>
                  <input type="date" value={form.fechaIngreso} onChange={set('fechaIngreso')} className="input input-bordered w-full" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Turno</legend>
                  <select value={form.turno} onChange={set('turno')} className="select select-bordered w-full">
                    <option value="mañana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                  </select>
                </fieldset>
              </div>

              <div className="modal-action">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar cambios' : 'Registrar trabajador'}
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

export default Workers;
