import { Pencil, Plus, Search, Trash2, Wrench, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createMaquina,
  deleteMaquina,
  getMaquinaria,
  updateMaquina,
} from '../../services/api';

const emptyForm = {
  nombre: '',
  codigo: '',
  marca: '',
  modelo: '',
  ubicacion: '',
  fechaAdquisicion: '',
  ultimoMantenimiento: '',
  proximoMantenimiento: '',
  estadoOperativo: 'operativa',
  observaciones: '',
};

const estadoInfo = {
  operativa: { label: 'Operativa', className: 'badge-success' },
  mantenimiento: { label: 'En mantenimiento', className: 'badge-warning' },
  averiada: { label: 'Averiada', className: 'badge-error' },
  baja: { label: 'De baja', className: 'badge-neutral' },
};

const today = () => new Date().toISOString().slice(0, 10);

const Machinery = () => {
  const [maquinas, setMaquinas] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      const data = await getMaquinaria();
      setMaquinas(data);
    } catch (err) {
      toast.error(err.message || 'No se pudo cargar la maquinaria');
      setMaquinas([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = maquinas.filter((m) =>
    `${m.nombre} ${m.codigo ?? ''} ${m.marca ?? ''} ${m.ubicacion ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (m) => {
    setForm({
      nombre: m.nombre || '',
      codigo: m.codigo || '',
      marca: m.marca || '',
      modelo: m.modelo || '',
      ubicacion: m.ubicacion || '',
      fechaAdquisicion: m.fechaAdquisicion || '',
      ultimoMantenimiento: m.ultimoMantenimiento || '',
      proximoMantenimiento: m.proximoMantenimiento || '',
      estadoOperativo: m.estadoOperativo || 'operativa',
      observaciones: m.observaciones || '',
    });
    setEditingId(m.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMaquina(editingId, form);
        toast.success('Equipo actualizado');
      } else {
        await createMaquina(form);
        toast.success('Equipo registrado');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este equipo del inventario?')) return;
    try {
      await deleteMaquina(id);
      toast.success('Equipo eliminado');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const mantenimientoVencido = (fecha) => fecha && fecha < today();

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-coffee">
            <Wrench size={26} /> Maquinaria
          </h1>
          <p className="text-sm text-base-content/70">Mantenimiento y estado de los equipos.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="input input-bordered w-full sm:w-80">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar equipo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> Nuevo equipo
          </button>
        </div>
      </section>

      {/* Tabla */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Código</th>
                <th>Ubicación</th>
                <th>Próx. mantenimiento</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const info = estadoInfo[m.estadoOperativo] || estadoInfo.operativa;
                return (
                  <tr key={m.id}>
                    <td className="font-medium">
                      <div>{m.nombre}</div>
                      {(m.marca || m.modelo) && (
                        <div className="text-xs text-base-content/50">{[m.marca, m.modelo].filter(Boolean).join(' · ')}</div>
                      )}
                    </td>
                    <td className="font-mono text-sm">{m.codigo || '—'}</td>
                    <td>{m.ubicacion || '—'}</td>
                    <td>
                      {m.proximoMantenimiento ? (
                        <span className={mantenimientoVencido(m.proximoMantenimiento) ? 'text-error font-medium' : ''}>
                          {m.proximoMantenimiento}
                          {mantenimientoVencido(m.proximoMantenimiento) && ' ⚠'}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`badge badge-sm ${info.className}`}>{info.label}</span>
                    </td>
                    <td className="text-right">
                      <div className="join">
                        <button type="button" onClick={() => openEdit(m)} className="btn btn-ghost btn-sm join-item" aria-label="Editar">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(m.id)} className="btn btn-ghost btn-sm join-item text-error" aria-label="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-base-content/60 py-8">
                    No se encontraron equipos.
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
              <h2 className="text-xl font-bold">{editingId ? 'Editar equipo' : 'Nuevo equipo'}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Nombre *</legend>
                  <input required value={form.nombre} onChange={set('nombre')} className="input input-bordered w-full" placeholder="Ej. Máquina de Espresso" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Código</legend>
                  <input value={form.codigo} onChange={set('codigo')} className="input input-bordered w-full font-mono" placeholder="MAQ-001" maxLength={40} />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Marca</legend>
                  <input value={form.marca} onChange={set('marca')} className="input input-bordered w-full" placeholder="Ej. La Marzocco" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Modelo</legend>
                  <input value={form.modelo} onChange={set('modelo')} className="input input-bordered w-full" placeholder="Ej. Linea PB" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Ubicación</legend>
                  <input value={form.ubicacion} onChange={set('ubicacion')} className="input input-bordered w-full" placeholder="Ej. Barra principal" />
                </fieldset>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Fecha de adquisición</legend>
                  <input type="date" value={form.fechaAdquisicion} onChange={set('fechaAdquisicion')} className="input input-bordered w-full" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Último mantenimiento</legend>
                  <input type="date" value={form.ultimoMantenimiento} onChange={set('ultimoMantenimiento')} className="input input-bordered w-full" />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Próximo mantenimiento</legend>
                  <input type="date" value={form.proximoMantenimiento} onChange={set('proximoMantenimiento')} className="input input-bordered w-full" />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Estado operativo</legend>
                <select value={form.estadoOperativo} onChange={set('estadoOperativo')} className="select select-bordered w-full">
                  <option value="operativa">Operativa</option>
                  <option value="mantenimiento">En mantenimiento</option>
                  <option value="averiada">Averiada</option>
                  <option value="baja">De baja</option>
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Observaciones</legend>
                <textarea value={form.observaciones} onChange={set('observaciones')} className="textarea textarea-bordered w-full" rows={2} placeholder="Notas del equipo" />
              </fieldset>

              <div className="modal-action">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar cambios' : 'Registrar equipo'}
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

export default Machinery;
