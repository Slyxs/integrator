import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../../services/api';

const emptyForm = { nombre: '', descripcion: '' };

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
    setEditingId(cat.id);
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        toast.success('Categoría actualizada');
      } else {
        await createCategory(form);
        toast.success('Categoría creada');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await deleteCategory(id);
      toast.success('Categoría eliminada');
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
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-sm text-base-content/70">Organiza los productos del menú por categoría.</p>
        </div>
        <button type="button" onClick={openCreate} className="btn btn-primary">
          <Plus size={16} />
          Nueva categoría
        </button>
      </section>

      {/* Tabla */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th className="hidden md:table-cell">Descripción</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="text-base-content/50">{cat.id}</td>
                    <td className="font-medium">{cat.nombre}</td>
                    <td className="hidden md:table-cell text-base-content/70">
                      {cat.descripcion || <span className="italic text-base-content/40">Sin descripción</span>}
                    </td>
                    <td className="text-right">
                      <div className="join">
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="btn btn-ghost btn-sm join-item"
                          aria-label={`Editar ${cat.nombre}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id)}
                          className="btn btn-ghost btn-sm join-item text-error"
                          aria-label={`Eliminar ${cat.nombre}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-base-content/60">
                      No hay categorías registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2>
                <p className="text-sm text-base-content/70">
                  {editingId ? 'Actualiza los datos de la categoría.' : 'Completa la información para crear una categoría.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Cerrar formulario"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nombre *</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Ej: Bebidas Calientes"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Descripción</legend>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Descripción opcional"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </fieldset>

              <div className="modal-action mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Guardar cambios' : 'Crear categoría'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}
    </div>
  );
};

export default Categories;
