import { useState, useEffect } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../../services/api';
import toast from 'react-hot-toast';

const emptyForm = { nombre: '', descripcion: '', precio: '', categoriaId: '', stock: '' };

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
    setProducts(prods);
    setCategories(cats);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = products.filter((product) =>
    product.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (id) =>
    categories.find((category) => Number(category.id) === Number(id))?.nombre || '-';

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setForm({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precio.toString(),
      categoriaId: product.categoriaId.toString(),
      stock: product.stock.toString(),
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = {
      ...form,
      precio: Number.parseFloat(form.precio),
      categoriaId: Number.parseInt(form.categoriaId, 10),
      stock: Number.parseInt(form.stock, 10),
    };
    try {
      if (editingId) {
        await updateProduct(editingId, data);
        toast.success('Producto actualizado');
      } else {
        await createProduct(data);
        toast.success('Producto creado');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      toast.success('Producto eliminado');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado con filtros y acción principal */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-sm text-base-content/70">Gestiona inventario, precios y categorías del menú.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          {/* Campo de búsqueda por nombre de producto */}
          <label className="input input-bordered w-full sm:w-80">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar producto"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          {/* Botón para abrir el formulario de alta */}
          <button
            type="button"
            onClick={openCreate}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>
      </section>

      {/* Tabla principal con el listado de productos */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="hidden md:table-cell">Categoría</th>
                <th className="text-right">Precio</th>
                <th className="hidden sm:table-cell text-right">Stock</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="font-medium">{product.nombre}</div>
                    <div className="text-xs text-base-content/60 md:hidden">{getCategoryName(product.categoriaId)}</div>
                  </td>
                  <td className="hidden md:table-cell">{getCategoryName(product.categoriaId)}</td>
                  <td className="text-right font-medium">${product.precio.toFixed(2)}</td>
                  <td className="hidden text-right sm:table-cell">
                    <span className={`badge badge-sm ${product.stock > 10 ? 'badge-success' : 'badge-warning'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="join">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="btn btn-ghost btn-sm join-item"
                        aria-label={`Editar ${product.nombre}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="btn btn-ghost btn-sm join-item text-error"
                        aria-label={`Eliminar ${product.nombre}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Mensaje vacío cuando no hay coincidencias */}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-base-content/60">
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </section>

      {/* Modal de creación/edición de productos */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            {/* Encabezado del modal */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
                <p className="text-sm text-base-content/70">
                  {editingId
                    ? 'Actualiza los datos del producto seleccionado.'
                    : 'Completa la información para registrar un nuevo producto.'}
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

            {/* Formulario principal del producto */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Campo: nombre del producto */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nombre *</legend>
                <input
                  required
                  value={form.nombre}
                  onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Ej. Café Orgánico"
                />
              </fieldset>

              {/* Campo: descripción comercial */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Descripción</legend>
                <textarea
                  value={form.descripcion}
                  onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
                  rows="3"
                  className="textarea textarea-bordered w-full"
                  placeholder="Detalles para mostrar al cliente"
                />
              </fieldset>

              {/* Grupo: precio y stock */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Precio *</legend>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio}
                    onChange={(event) => setForm({ ...form, precio: event.target.value })}
                    className="input input-bordered w-full"
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Stock *</legend>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => setForm({ ...form, stock: event.target.value })}
                    className="input input-bordered w-full"
                  />
                </fieldset>
              </div>

              {/* Campo: categoría asociada */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Categoría *</legend>
                <select
                  required
                  value={form.categoriaId}
                  onChange={(event) => setForm({ ...form, categoriaId: event.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.nombre}</option>
                  ))}
                </select>
              </fieldset>

              {/* Botones de acción del formulario */}
              <div className="modal-action">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Actualizar producto' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>

          {/* Capa de fondo para cerrar el modal */}
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setShowModal(false)} aria-label="Cerrar modal">Cerrar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Products;
