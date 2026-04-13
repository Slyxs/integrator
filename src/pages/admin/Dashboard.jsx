import { useState, useEffect } from 'react';
import { FiUsers, FiPackage, FiFileText, FiDollarSign } from 'react-icons/fi';
import { getUsers, getProducts, getSales } from '../../services/api';

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
    { label: 'Usuarios', value: stats.clients, icon: FiUsers, color: 'bg-blue-500' },
    { label: 'Productos', value: stats.products, icon: FiPackage, color: 'bg-green-500' },
    { label: 'Ventas', value: stats.sales, icon: FiFileText, color: 'bg-purple-500' },
    { label: 'Ingresos', value: `$${stats.revenue.toFixed(2)}`, icon: FiDollarSign, color: 'bg-primary' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center text-white`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xl font-bold text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Ventas Recientes</h2>
        {recentSales.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay ventas registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-500">N° Boleta</th>
                  <th className="text-left py-2 text-gray-500">Cliente</th>
                  <th className="text-left py-2 text-gray-500">Fecha</th>
                  <th className="text-right py-2 text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(sale => (
                  <tr key={sale.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{sale.numero}</td>
                    <td className="py-2">{sale.clienteNombre || 'Consumidor Final'}</td>
                    <td className="py-2">{new Date(sale.fecha).toLocaleDateString()}</td>
                    <td className="py-2 text-right font-medium">${sale.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
