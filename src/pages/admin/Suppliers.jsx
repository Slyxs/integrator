import { Pencil, Plus, Search, Trash2, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createProveedor,
  deleteProveedor,
  getProveedores,
  updateProveedor,
} from '../../services/api';

const emptyForm = {
  nombre: '',
  ruc: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
  suministro: '',
};

const Suppliers = () => {
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      const data = await getProveedores();
      setProveedores(data);
    } catch (err) {
      toast.error(err.message || 'No se pudieron cargar los proveedores');
      setProveedores([]);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = proveedores.filter((p) =>
    `${p.nombre} ${p.ruc ?? ''} ${p.suministro ?? ''} ${p.contacto ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({
      nombre: p.nombre || '',
      ruc: p.ruc || '',
      contacto: p.contacto || '',
      telefono: p.telefono || '',
      email: p.email || '',
      direccion: p.direccion || '',
      suministro: p.suministro || '',
    });
    setEditingId(p.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProveedor(editingId, form);
        toast.success('Proveedor actualizado');
      } else {
        await createProveedor(form);
        toast.success('Proveedor registrado');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return;
    try {
      await deleteProveedor(id);
      toast.success('Proveedor eliminado');
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
            <Truck size={26} /> Proveedores
          </h1>
          <p className="text-sm text-base-content/70">Administra los proveedores e insumos de la cafetería.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <label className="input input-bordered w-full sm:w-80">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar proveedor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <Plus size={16} /> Nuevo proveedor
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
                <th>RUC</th>
                <th>Suministro</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.nombre}</td>
                  <td className="font-mono text-sm">{p.ruc || '—'}</td>
                  <td>{p.suministro ? <span className="badge badge-ghost">{p.suministro}</span> : '—'}</td>
                  <td>{p.contacto || '—'}</td>
                  <td>{p.telefono || '—'}</td>
                  <td className="text-right">
                    <div className="join">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="btn btn-ghost btn-sm join-item"
                        aria-label={`Editar ${p.nombre}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="btn btn-ghost btn-sm join-item text-error"
                        aria-label={`Eliminar ${p.nombre}`}
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
                    No se encontraron proveedores.
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
              <h2 className="text-xl font-bold">{editingId ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
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
                  <legend className="fieldset-legend">Nombre / Razón social *</legend>
                  <input
                    required
                    value={form.nombre}
                    onChange={set('nombre')}
                    className="input input-bordered w-full"
                    placeholder="Ej. Cafetalera Andina S.A.C."
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">RUC</legend>
                  <input
                    value={form.ruc}
                    onChange={set('ruc')}
                    className="input input-bordered w-full font-mono"
                    placeholder="20512345678"
                    maxLength={20}
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Suministro</legend>
                <input
                  value={form.suministro}
                  onChange={set('suministro')}
                  className="input input-bordered w-full"
                  placeholder="Ej. Granos de café verde"
                />
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Persona de contacto</legend>
                  <input
                    value={form.contacto}
                    onChange={set('contacto')}
                    className="input input-bordered w-full"
                    placeholder="Ej. Rosa Quispe"
                  />
                </fieldset>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Teléfono</legend>
                  <input
                    value={form.telefono}
                    onChange={set('telefono')}
                    className="input input-bordered w-full"
                    placeholder="999-100-200"
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email</legend>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className="input input-bordered w-full"
                  placeholder="ventas@proveedor.pe"
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Dirección</legend>
                <textarea
                  value={form.direccion}
                  onChange={set('direccion')}
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  placeholder="Dirección del proveedor"
                />
              </fieldset>

              <div className="modal-action">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar cambios' : 'Registrar proveedor'}
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

export default Suppliers;
