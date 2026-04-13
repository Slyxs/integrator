import { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { getProducts, getCategories } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const categoryEmojis = { 1: '☕', 2: '🧊', 3: '🥐', 4: '🥪' };
const categoryBadgeColors = [
  'badge-warning',
  'badge-info',
  'badge-secondary',
  'badge-success',
];

const formatCurrency = (amount) => `S/ ${amount.toFixed(2)}`;

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prods);
      setCategories(cats);
    };
    load();
  }, []);

  const filtered = activeCategory
    ? products.filter(p => p.categoriaId === activeCategory)
    : products;

  const handleAdd = (product) => {
    if (!user) {
      toast.error('Inicia sesión para agregar al carrito');
      navigate('/login');
      return;
    }
    addItem(product);
    toast.success(`${product.nombre} agregado al carrito`);
  };

  return (
    <div className="min-h-screen bg-base-200/60 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-coffee">Nuestro Menú</h1>
          <p className="text-gray-600 mt-2">Descubre nuestras deliciosas opciones</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={`btn btn-sm rounded-full transition ${
              !activeCategory ? 'btn-primary' : 'btn-outline border-base-300 bg-base-100'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`btn btn-sm rounded-full transition ${
                activeCategory === cat.id ? 'btn-primary' : 'btn-outline border-base-300 bg-base-100'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(product => {
            const catIndex = categories.findIndex(c => c.id === product.categoriaId);
            const catColor = categoryBadgeColors[catIndex % categoryBadgeColors.length];
            const catName = categories.find(c => c.id === product.categoriaId)?.nombre || '';
            const emoji = categoryEmojis[product.categoriaId] || '☕';

            return (
              <div
                key={product.id}
                className="card card-border bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <figure className="h-32 bg-gradient-to-br from-primary/10 via-base-200 to-secondary/30">
                  <span className="text-5xl transition-transform duration-200 hover:scale-110">{emoji}</span>
                </figure>
                <div className="card-body gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`badge ${catColor}`}>{catName}</div>
                      <h3 className="card-title text-base text-coffee mt-3">{product.nombre}</h3>
                    </div>
                    <div className="badge badge-primary badge-outline badge-lg shrink-0">
                      {formatCurrency(product.precio)}
                    </div>
                  </div>
                  <p className="text-sm text-base-content/70 line-clamp-2 min-h-[2.5rem]">{product.descripcion}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                    Fresco y preparado al momento
                  </p>
                  <div className="card-actions justify-end mt-1">
                    <button
                      onClick={() => handleAdd(product)}
                      className="btn btn-primary btn-square"
                      aria-label={`Agregar ${product.nombre} al carrito`}
                    >
                      <FiPlus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card card-border bg-base-100 max-w-md mx-auto shadow-sm">
            <div className="card-body items-center text-center">
              <h2 className="card-title">No se encontraron productos</h2>
              <p className="text-base-content/70">Prueba con otra categoría para ver más opciones del menú.</p>
              <div className="card-actions">
                <button className="btn btn-primary btn-sm" onClick={() => setActiveCategory(null)}>
                  Ver todos
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
