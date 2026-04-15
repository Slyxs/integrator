import { useState, useEffect } from 'react';
import { DollarSign, Package, ReceiptText, Users } from 'lucide-react';
import { getUsers, getProducts, getSales } from '../../services/api';

const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

const Dashboard = () => {
  const [stats, setStats] = useState({ clients: 0, products: 0, sales: 0, revenue: 0 });
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [users, products, sales] = await Promise.all([
        getUsers(),
        getProducts(),
        getSales(),
      ]);
      setStats({
        clients: users.length,
        products: products.length,
        sales: sales.length,
        revenue: sales.reduce((s, v) => s + v.total, 0),
      });
      setRecentSales(sales.slice(-5).reverse());
    };
    loadData();
  }, []);

  const cards = [
    { label: 'Usuarios', value: stats.clients, icon: Users, tone: 'bg-info/10 text-info' },
    { label: 'Productos', value: stats.products, icon: Package, tone: 'bg-success/10 text-success' },
    { label: 'Ventas', value: stats.sales, icon: ReceiptText, tone: 'bg-secondary/10 text-secondary' },
    { label: 'Ingresos', value: formatCurrency(stats.revenue), icon: DollarSign, tone: 'bg-primary/10 text-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado general del panel */}
      <section className="space-y-1">
        <h1 className="text-3xl font-bold">Panel general</h1>
        <p className="text-sm text-base-content/70">Resumen rápido de usuarios, productos, ventas e ingresos.</p>
      </section>

      {/* Tarjetas de indicadores clave */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/70">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
                <div className={`rounded-box p-3 ${tone}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Tabla con las ventas más recientes */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-2 pt-5">
            <h2 className="card-title text-lg">Ventas recientes</h2>
            <span className="badge badge-outline">{recentSales.length} registros</span>
          </div>

        {recentSales.length === 0 ? (
            <div className="px-5 pb-5">
              <div className="alert">
                <span>No hay ventas registradas todavía.</span>
              </div>
            </div>
        ) : (
          /* Lista de las últimas ventas — el componente list encaja bien aquí
             porque son pocos registros y no necesitan cabeceras de columna */
          <ul className="list">
            {recentSales.map((sale) => (
              <li key={sale.id} className="list-row items-center">

                {/* Número de boleta */}
                <div>
                  <p className="text-xs text-base-content/50">Boleta</p>
                  <p className="font-medium">{sale.numero}</p>
                </div>

                {/* Cliente y fecha — crece para usar el espacio libre */}
                <div className="list-col-grow">
                  <p className="text-sm">{sale.clienteNombre || 'Consumidor final'}</p>
                  <p className="text-xs text-base-content/50">{new Date(sale.fecha).toLocaleDateString()}</p>
                </div>

                {/* Total alineado a la derecha */}
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(sale.total)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
