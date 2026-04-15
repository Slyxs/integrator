import { useState, useEffect } from 'react';
import { Eye, Search, X } from 'lucide-react';
import { getSales } from '../../services/api';

const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    getSales().then(data => setSales([...data].reverse()));
  }, []);

  const filtered = sales.filter((sale) =>
    `${sale.numero} ${sale.clienteNombre || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItems = selectedSale?.items || [];

  return (
    <div className="space-y-5">
      {/* Encabezado y filtro de ventas */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ventas</h1>
          <p className="text-sm text-base-content/70">Consulta el historial de boletas emitidas y su detalle.</p>
        </div>

        <label className="input input-bordered w-full sm:w-80">
          <Search size={16} className="opacity-70" />
          <input
            type="text"
            placeholder="Buscar por N° o cliente"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {/* Tabla principal del historial de ventas */}
      <section className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>N° boleta</th>
                <th>Cliente</th>
                <th className="hidden md:table-cell">Fecha</th>
                <th className="hidden sm:table-cell">Método</th>
                <th className="text-right">Total</th>
                <th className="text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id}>
                  <td className="font-medium">{sale.numero}</td>
                  <td>{sale.clienteNombre || 'Consumidor final'}</td>
                  <td className="hidden md:table-cell">{new Date(sale.fecha).toLocaleString()}</td>
                  <td className="hidden sm:table-cell">
                    <span className="badge badge-ghost badge-sm capitalize">{sale.metodoPago}</span>
                  </td>
                  <td className="text-right font-semibold">{formatCurrency(sale.total)}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedSale(sale)}
                      className="btn btn-ghost btn-sm btn-circle text-primary"
                      aria-label={`Ver detalle de ${sale.numero}`}
                    >
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Estado vacío cuando no hay ventas filtradas */}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-base-content/60">No se encontraron ventas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </section>

      {/* Modal de detalle de una venta */}
      {selectedSale && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            {/* Cabecera del detalle */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Detalle de boleta {selectedSale.numero}</h2>
                <p className="text-sm text-base-content/70">Información general y productos incluidos en la venta.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Cerrar detalle"
              >
                <X size={18} />
              </button>
            </div>

            {/* Resumen principal de la venta */}
            <div className="mt-5 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-box bg-base-200 p-3">
                <p className="text-xs uppercase tracking-wide text-base-content/60">Fecha</p>
                <p className="font-medium">{new Date(selectedSale.fecha).toLocaleString()}</p>
              </div>

              <div className="rounded-box bg-base-200 p-3">
                <p className="text-xs uppercase tracking-wide text-base-content/60">Cliente</p>
                <p className="font-medium">{selectedSale.clienteNombre || 'Consumidor final'}</p>
              </div>

              <div className="rounded-box bg-base-200 p-3">
                <p className="text-xs uppercase tracking-wide text-base-content/60">Método de pago</p>
                <p className="font-medium capitalize">{selectedSale.metodoPago}</p>
              </div>
            </div>

            {/* Tabla de ítems vendidos */}
            <div className="mt-4 overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-right">P.U.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, index) => (
                    <tr key={`${item.productoId || item.nombre}-${index}`}>
                      <td>{item.nombre}</td>
                      <td className="text-center">{item.cantidad}</td>
                      <td className="text-right">{formatCurrency(item.precioUnitario)}</td>
                      <td className="text-right font-medium">{formatCurrency(item.cantidad * item.precioUnitario)}</td>
                    </tr>
                  ))}

                  {selectedItems.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center text-base-content/60">No hay ítems en esta venta.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total final de la boleta */}
            <div className="mt-4 flex items-center justify-end">
              <div className="stat w-full rounded-box border border-base-300 bg-base-100 sm:w-72">
                <div className="stat-title">Total pagado</div>
                <div className="stat-value text-primary text-3xl">{formatCurrency(selectedSale.total)}</div>
              </div>
            </div>
          </div>

          {/* Fondo del modal para cierre por clic externo */}
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setSelectedSale(null)} aria-label="Cerrar modal">Cerrar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Sales;
