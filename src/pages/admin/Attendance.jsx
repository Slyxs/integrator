import { CalendarCheck, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createAsistencia,
  deleteAsistencia,
  getAsistencias,
  getTrabajadores,
  updateAsistencia,
} from '../../services/api';

const emptyForm = {
  trabajadorId: '',
  fecha: new Date().toISOString().slice(0, 10),
  horaEntrada: '',
  horaSalida: '',
  estado: 'presente',
  observaciones: '',
};

const estadoInfo = {
  presente: { label: 'Presente', className: 'badge-success' },
  tardanza: { label: 'Tardanza', className: 'badge-warning' },
  falta: { label: 'Falta', className: 'badge-error' },
  justificada: { label: 'Justificada', className: 'badge-info' },
};

const Attendance = () => {
  const [asistencias, setAsistencias] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      const [asis, trabs] = await Promise.all([getAsistencias(), getTrabajadores()]);
      setAsistencias(asis);
      setTrabajadores(trabs);
    } catch (err) {
      toast.error(err.message || 'No se pudieron cargar las asistencias');
      setAsistencias([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => {
    const total = asistencias.length;
    const presentes = asistencias.filter((a) => a.estado === 'presente').length;
    const tardanzas = asistencias.filter((a) => a.estado === 'tardanza').length;
    const faltas = asistencias.filter((a) => a.estado === 'falta').length;
    return { total, presentes, tardanzas, faltas };
  }, [asistencias]);

  const filtered = asistencias.filter((a) =>
    `${a.trabajadorNombre ?? ''} ${a.fecha ?? ''} ${a.estado ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (a) => {
    setForm({
      trabajadorId: a.trabajadorId != null ? String(a.trabajadorId) : '',
      fecha: a.fecha || new Date().toISOString().slice(0, 10),
      horaEntrada: a.horaEntrada || '',
      horaSalida: a.horaSalida || '',
      estado: a.estado || 'presente',
      observaciones: a.observaciones || '',
    });
    setEditingId(a.id);
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
      horaEntrada: form.horaEntrada || null,
      horaSalida: form.horaSalida || null,
    };
    try {
      if (editingId) {
        await updateAsistencia(editingId, payload);
        toast.success('Asistencia actualizada');
      } else {
        await createAsistencia(payload);
        toast.success('Asistencia registrada');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro de asistencia?')) return;
    try {
      await deleteAsistencia(id);
      toast.success('Asistencia eliminada');
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
            <CalendarCheck size={26} /> Asistencia
          </h1>
          <p className="text-sm text-base-content/70">Control de asistencia diaria del personal.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="input input-bordered w-full sm:w-80">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar por trabajador o fecha"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> Registrar asistencia
          </button>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Registros</div>
            <div className="stat-value text-2xl">{stats.total}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Presentes</div>
            <div className="stat-value text-2xl text-success">{stats.presentes}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Tardanzas</div>
            <div className="stat-value text-2xl text-warning">{stats.tardanzas}</div>
          </div>
        </div>
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Faltas</div>
            <div className="stat-value text-2xl text-error">{stats.faltas}</div>
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
                <th>Fecha</th>
                <th className="text-center">Entrada</th>
                <th className="text-center">Salida</th>
                <th>Estado</th>
                <th>Observaciones</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const info = estadoInfo[a.estado] || estadoInfo.presente;
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="font-medium">{a.trabajadorNombre || '—'}</div>
                      {a.trabajadorCargo && (
                        <div className="text-xs text-base-content/60">{a.trabajadorCargo}</div>
                      )}
                    </td>
                    <td>{a.fecha}</td>
                    <td className="text-center font-mono text-sm">{a.horaEntrada || '—'}</td>
                    <td className="text-center font-mono text-sm">{a.horaSalida || '—'}</td>
                    <td>
                      <span className={`badge badge-sm ${info.className}`}>{info.label}</span>
                    </td>
                    <td className="max-w-xs truncate text-sm text-base-content/70">
                      {a.observaciones || '—'}
                    </td>
                    <td className="text-right">
                      <div className="join">
                        <button type="button" onClick={() => openEdit(a)} className="btn btn-ghost btn-sm join-item" aria-label="Editar">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(a.id)} className="btn btn-ghost btn-sm join-item text-error" aria-label="Eliminar">
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
                    No hay registros de asistencia.
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
              <h2 className="text-xl font-bold">{editingId ? 'Editar asistencia' : 'Registrar asistencia'}</h2>
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
                  <legend className="fieldset-legend">Fecha *</legend>
                  <input type="date" required value={form.fecha} onChange={set('fecha')} className="input input-bordered w-full" />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Hora de entrada</legend>
                  <input type="time" value={form.horaEntrada} onChange={set('horaEntrada')} className="input input-bordered w-full" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Hora de salida</legend>
                  <input type="time" value={form.horaSalida} onChange={set('horaSalida')} className="input input-bordered w-full" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Estado</legend>
                  <select value={form.estado} onChange={set('estado')} className="select select-bordered w-full">
                    <option value="presente">Presente</option>
                    <option value="tardanza">Tardanza</option>
                    <option value="falta">Falta</option>
                    <option value="justificada">Justificada</option>
                  </select>
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Observaciones</legend>
                <textarea value={form.observaciones} onChange={set('observaciones')} className="textarea textarea-bordered w-full" rows={2} placeholder="Notas del registro" />
              </fieldset>

              <div className="modal-action">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar cambios' : 'Registrar asistencia'}
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

export default Attendance;
