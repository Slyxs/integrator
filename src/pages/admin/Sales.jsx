import { useState, useEffect } from 'react';
import { FiEye, FiX, FiSearch } from 'react-icons/fi';
import { getSales } from '../../services/api';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    getSales().then(data => setSales([...data].reverse()));
  }, []);

  const filtered = sales.filter(s =>
    `${s.numero} ${s.clienteNombre || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por N° o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">N° Boleta</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">Método</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Total</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Ver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.numero}</td>
                  <td className="px-4 py-3">{s.clienteNombre || 'Consumidor Final'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{new Date(s.fecha).toLocaleString()}</td>
                  <td className="px-4 py-3 hidden sm:table-cell capitalize">{s.metodoPago}</td>
                  <td className="px-4 py-3 text-right font-medium">${s.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelectedSale(s)} className="text-primary hover:text-primary-dark">
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No se encontraron ventas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Detalle - {selectedSale.numero}</h2>
              <button onClick={() => setSelectedSale(null)} className="text-gray-500 hover:text-gray-700">
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha:</span>
                <span>{new Date(selectedSale.fecha).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span>{selectedSale.clienteNombre || 'Consumidor Final'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Método de Pago:</span>
                <span className="capitalize">{selectedSale.metodoPago}</span>
              </div>
              <hr />
              <table className="w-full">
                <thead>
                  <tr className="text-gray-500">
                    <th className="text-left py-1">Producto</th>
                    <th className="text-center py-1">Cant.</th>
                    <th className="text-right py-1">P.U.</th>
                    <th className="text-right py-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1">{item.nombre}</td>
                      <td className="py-1 text-center">{item.cantidad}</td>
                      <td className="py-1 text-right">${item.precioUnitario.toFixed(2)}</td>
                      <td className="py-1 text-right">${(item.cantidad * item.precioUnitario).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${selectedSale.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
