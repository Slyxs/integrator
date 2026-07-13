import { BookText, Eye, Search, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  deleteReclamacion,
  getReclamaciones,
  updateReclamacion,
} from '../../services/api';

const estadoInfo = {
  pendiente: { label: 'Pendiente', className: 'badge-warning' },
  en_proceso: { label: 'En proceso', className: 'badge-info' },
  resuelto: { label: 'Resuelto', className: 'badge-success' },
  rechazado: { label: 'Rechazado', className: 'badge-error' },
};

const Complaints = () => {
  const [reclamaciones, setReclamaciones] = useState([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [selected, setSelected] = useState(null);
  const [estado, setEstado] = useState('pendiente');
  const [respuesta, setRespuesta] = useState('');

  const loadData = async () => {
    try {
      const data = await getReclamaciones();
      setReclamaciones(data);
    } catch (err) {
      toast.error(err.message || 'No se pudieron cargar las reclamaciones');
      setReclamaciones([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => ({
    total: reclamaciones.length,
    pendientes: reclamaciones.filter((r) => r.estado === 'pendiente').length,
    resueltos: reclamaciones.filter((r) => r.estado === 'resuelto').length,
  }), [reclamaciones]);

  const filtered = reclamaciones
    .filter((r) => filtroEstado === 'todos' || r.estado === filtroEstado)
    .filter((r) =>
      `${r.codigo} ${r.nombre} ${r.apellido} ${r.documento ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const openDetail = (r) => {
    setSelected(r);
    setEstado(r.estado);
    setRespuesta(r.respuesta || '');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateReclamacion(selected.id, { estado, respuesta });
      toast.success('Reclamación actualizada');
      setSelected(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta reclamación de forma permanente?')) return;
    try {
      await deleteReclamacion(id);
      toast.success('Reclamación eliminada');
      if (selected?.id === id) setSelected(null);
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
            <BookText size={26} /> Libro de Reclamaciones
          </h1>
          <p className="text-sm text-base-content/70">Gestiona los reclamos y quejas de los consumidores.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="input input-bordered w-full sm:w-72">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar por código o nombre"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="select select-bordered"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_proceso">En proceso</option>
            <option value="resuelto">Resueltos</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-3 gap-3">
        <div className="stats bg-base-100 border border-base-300 shadow-sm">
          <div className="stat">
            <div className="stat-title">Total</div>
            <div className="stat-value text-2xl">{stats.total}</div>
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
            <div className="stat-title">Resueltos</div>
            <div className="stat-value text-2xl text-success">{stats.resueltos}</div>
          </div>
        </div>
      </section>

      {/* Tabla */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0 overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Consumidor</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const info = estadoInfo[r.estado] || estadoInfo.pendiente;
                return (
                  <tr key={r.id}>
                    <td className="font-mono font-bold">{r.codigo}</td>
                    <td>
                      <span className={`badge badge-sm ${r.tipo === 'queja' ? 'badge-secondary' : 'badge-primary'}`}>
                        {r.tipo === 'queja' ? 'Queja' : 'Reclamo'}
                      </span>
                    </td>
                    <td>{r.nombre} {r.apellido}</td>
                    <td>{(r.createdAt || '').slice(0, 10)}</td>
                    <td>
                      <span className={`badge badge-sm ${info.className}`}>{info.label}</span>
                    </td>
                    <td className="text-right">
                      <div className="join">
                        <button type="button" onClick={() => openDetail(r)} className="btn btn-ghost btn-sm join-item" aria-label="Ver detalle">
                          <Eye size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(r.id)} className="btn btn-ghost btn-sm join-item text-error" aria-label="Eliminar">
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
                    No hay reclamaciones registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal detalle + gestión */}
      {selected && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {selected.tipo === 'queja' ? 'Queja' : 'Reclamo'} {selected.codigo}
                </h2>
                <p className="text-sm text-base-content/60">{(selected.createdAt || '').slice(0, 16).replace('T', ' ')}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="btn btn-ghost btn-sm btn-circle" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Datos del consumidor */}
              <div className="rounded-box bg-base-200 p-4">
                <h3 className="font-semibold mb-2">Consumidor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <p><span className="text-base-content/60">Nombre:</span> {selected.nombre} {selected.apellido}</p>
                  <p><span className="text-base-content/60">Documento:</span> {selected.tipoDocumento} {selected.documento || '—'}</p>
                  <p><span className="text-base-content/60">Email:</span> {selected.email || '—'}</p>
                  <p><span className="text-base-content/60">Teléfono:</span> {selected.telefono || '—'}</p>
                  <p className="sm:col-span-2"><span className="text-base-content/60">Dirección:</span> {selected.direccion || '—'}</p>
                  {selected.menorEdad && <p className="sm:col-span-2 text-warning">Consumidor menor de edad</p>}
                </div>
              </div>

              {/* Detalle del bien */}
              <div className="rounded-box bg-base-200 p-4">
                <h3 className="font-semibold mb-2">Bien contratado</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <p><span className="text-base-content/60">Tipo:</span> <span className="capitalize">{selected.tipoBien}</span></p>
                  <p><span className="text-base-content/60">Monto reclamado:</span> {selected.montoReclamado != null ? `S/ ${Number(selected.montoReclamado).toFixed(2)}` : '—'}</p>
                  <p className="sm:col-span-2"><span className="text-base-content/60">Descripción:</span> {selected.descripcionBien || '—'}</p>
                </div>
              </div>

              {/* Detalle de la reclamación */}
              <div className="rounded-box bg-base-200 p-4 space-y-2 text-sm">
                <div>
                  <p className="text-base-content/60 font-semibold">Detalle:</p>
                  <p>{selected.detalle}</p>
                </div>
                {selected.pedido && (
                  <div>
                    <p className="text-base-content/60 font-semibold">Pedido del consumidor:</p>
                    <p>{selected.pedido}</p>
                  </div>
                )}
              </div>

              {/* Gestión */}
              <form onSubmit={handleUpdate} className="space-y-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Estado</legend>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)} className="select select-bordered w-full">
                    <option value="pendiente">Pendiente</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Respuesta al consumidor</legend>
                  <textarea
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    placeholder="Escribe la respuesta o resolución"
                  />
                </fieldset>
                <div className="modal-action">
                  <button type="button" onClick={() => setSelected(null)} className="btn btn-ghost">Cerrar</button>
                  <button type="submit" className="btn btn-primary">Guardar gestión</button>
                </div>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setSelected(null)}>Cerrar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Complaints;
