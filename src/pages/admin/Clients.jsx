import { useState, useEffect } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const emptyForm = { nombre: '', email: '', password: '', rol: 'usuario' };

const rolLabels = { admin: 'Administrador', usuario: 'Usuario' };

const Clients = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const { user: currentUser } = useAuth();

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter((user) =>
    `${user.nombre} ${user.email} ${user.rol}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setForm({
      nombre: user.nombre,
      email: user.email || '',
      password: '',
      rol: user.rol,
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        const data = { nombre: form.nombre, email: form.email, rol: form.rol };
        if (form.password) data.password = form.password;
        await updateUser(editingId, data);
        toast.success('Usuario actualizado');
      } else {
        if (!form.password) {
          toast.error('La contraseña es requerida para nuevos usuarios');
          return;
        }
        await createUser(form);
        toast.success('Usuario creado');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      toast.error('No puedes eliminar tu propia cuenta');
      return;
    }
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await deleteUser(id);
      toast.success('Usuario eliminado');
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Encabezado con búsqueda y alta de usuarios */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-sm text-base-content/70">Administra cuentas, roles y credenciales del sistema.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          {/* Campo para filtrar por nombre, correo o rol */}
          <label className="input input-bordered w-full sm:w-80">
            <Search size={16} className="opacity-70" />
            <input
              type="text"
              placeholder="Buscar usuario"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          {/* Botón para abrir el formulario de nuevo usuario */}
          <button
            type="button"
            onClick={openCreate}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Nuevo usuario
          </button>
        </div>
      </section>

      {/* Tabla con usuarios registrados */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th className="hidden md:table-cell">Rol</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-placeholder shrink-0">
                        <div className="bg-primary text-primary-content w-8 rounded-full">
                          <span className="text-xs leading-none">
                            {user.nombre?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div>{user.nombre}</div>
                        <div className="text-xs text-base-content/60 md:hidden">{rolLabels[user.rol] || user.rol}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td className="hidden md:table-cell">
                    <span className={`badge badge-sm ${
                      user.rol === 'admin'
                        ? 'badge-secondary'
                        : 'badge-info'
                    }`}>
                      {rolLabels[user.rol] || user.rol}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="join">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="btn btn-ghost btn-sm join-item"
                        aria-label={`Editar ${user.nombre}`}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
                        className={`btn btn-ghost btn-sm join-item text-error ${user.id === currentUser?.id ? 'btn-disabled opacity-40' : ''}`}
                        disabled={user.id === currentUser?.id}
                        aria-label={`Eliminar ${user.nombre}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Mensaje vacío si no hay resultados de búsqueda */}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-base-content/60">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </section>

      {/* Modal para crear o editar usuarios */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            {/* Encabezado del modal */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{editingId ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                <p className="text-sm text-base-content/70">
                  {editingId
                    ? 'Modifica datos, correo o rol del usuario seleccionado.'
                    : 'Completa los campos para registrar una nueva cuenta.'}
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

            {/* Formulario de datos del usuario */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Campo: nombre completo */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nombre *</legend>
                <input
                  required
                  value={form.nombre}
                  onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Ej. Ana Pérez"
                />
              </fieldset>

              {/* Campo: correo electrónico */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email *</legend>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="input input-bordered w-full"
                  placeholder="correo@ejemplo.com"
                />
              </fieldset>

              {/* Campo: contraseña (obligatoria en creación) */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Contraseña {editingId ? '(déjala vacía para mantener la actual)' : '*'}
                </legend>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  required={!editingId}
                  minLength={4}
                  className="input input-bordered w-full"
                  placeholder={editingId ? '••••••••' : 'Mínimo 4 caracteres'}
                />
              </fieldset>

              {/* Campo: rol de acceso */}
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Rol *</legend>
                <select
                  required
                  value={form.rol}
                  onChange={(event) => setForm({ ...form, rol: event.target.value })}
                  className="select select-bordered w-full"
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </fieldset>

              {/* Botones finales del formulario */}
              <div className="modal-action">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Actualizar usuario' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>

          {/* Fondo del modal para cierre por clic externo */}
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setShowModal(false)} aria-label="Cerrar modal">Cerrar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Clients;
