import { useEffect, useState } from 'react';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { getSaleById } from '../../services/api';

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const roundCurrency = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

const formatCurrency = (amount) => `S/ ${(toNumber(amount) ?? 0).toFixed(2)}`;

const Receipt = () => {
  // id viene de la URL (ej: /receipt/42) y se usa para buscar la venta
  const { id } = useParams();

  // sale guarda los datos de la venta una vez cargada desde la API
  const [sale, setSale] = useState(null);

  // loading muestra un spinner mientras se espera la respuesta del servidor
  const [loading, setLoading] = useState(true);

  // Busca la venta por id al montar el componente
  // El [id] como dependencia hace que se vuelva a buscar si el id cambia
  useEffect(() => {
    getSaleById(id).then(data => {
      setSale(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="hero min-h-[60vh] bg-base-200/60">
        <div className="hero-content flex-col gap-4 text-center">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-base-content/65">Cargando comprobante...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="hero min-h-[60vh] bg-base-200/60 px-4">
        <div className="hero-content w-full max-w-md">
          <div className="card card-border bg-base-100 shadow-sm w-full">
            <div className="card-body items-center text-center">
              <h2 className="card-title">Comprobante no encontrado</h2>
              <p className="text-base-content/65">La venta que buscas no existe o ya no está disponible.</p>
              <div className="card-actions">
                <Link to="/menu" className="btn btn-primary">Volver al Menú</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const itemsSubtotal = roundCurrency(
    sale.items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
  );
  const resumen = sale.detallePago?.resumen || {};
  const totalPagado = roundCurrency(toNumber(resumen.total) ?? toNumber(sale.total) ?? itemsSubtotal);
  const subtotal = roundCurrency(toNumber(resumen.subtotal) ?? itemsSubtotal);
  const savedDiscount = toNumber(resumen.descuento);

  const descuento = roundCurrency(savedDiscount ?? (() => {
    const totalSinDescuento = roundCurrency(itemsSubtotal * 1.18);

    if (Math.abs(totalPagado - itemsSubtotal) < 0.01) return 0;
    if (totalPagado <= totalSinDescuento) {
      return Math.max(0, itemsSubtotal - (totalPagado / 1.18));
    }

    return 0;
  })());
  const subtotalConDescuento = roundCurrency(toNumber(resumen.subtotalConDescuento) ?? Math.max(0, subtotal - descuento));
  const igv = roundCurrency(toNumber(resumen.igv) ?? Math.max(0, totalPagado - subtotalConDescuento));
  const promoCodigo = sale.detallePago?.promocion?.codigo;

  return (
    <div className="min-h-screen bg-base-200/60 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6 no-print">
          <Link to="/menu" className="btn btn-outline gap-2">
            <FiArrowLeft /> Volver al Menú
          </Link>
          <button
            onClick={() => window.print()}
            className="btn btn-primary gap-2"
          >
            <FiPrinter /> Imprimir
          </button>
        </div>

        {/* Receipt */}
        <div id="receipt" className="card card-border bg-base-100 shadow-sm print:shadow-none print:rounded-none">
          <div className="card-body p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-base-300 pb-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <h1 className="text-xl font-bold text-coffee">COMPROBANTE DE VENTA</h1>
              <p className="text-sm text-base-content/60">RUC: 20123456789</p>
              <p className="text-sm text-base-content/60">Av. Colombia 123, Bogotá</p>
            </div>
            <div className="badge badge-primary badge-lg badge-outline">{sale.numero}</div>
          </div>

          {/* Sale Info */}
          <div className="grid grid-cols-1 gap-3 text-sm my-6 sm:grid-cols-2">
            <div className="rounded-box border border-base-300 bg-base-200/50 p-4">
              <p className="text-base-content/55">Fecha</p>
              <p className="font-bold">{new Date(sale.fecha).toLocaleString()}</p>
            </div>
            <div className="rounded-box border border-base-300 bg-base-200/50 p-4">
              <p className="text-base-content/55">Cliente</p>
              <p className="font-bold">{sale.clienteNombre || 'Consumidor Final'}</p>
            </div>
            <div className="rounded-box border border-base-300 bg-base-200/50 p-4">
              <p className="text-base-content/55">Método de pago</p>
              <p className="font-bold capitalize">{sale.metodoPago}</p>
            </div>
            {sale.detallePago?.ultimos4 && (
              <div className="rounded-box border border-base-300 bg-base-200/50 p-4">
                <p className="text-base-content/55">Tarjeta</p>
                <p className="font-bold">•••• {sale.detallePago.ultimos4}</p>
                <p className="text-xs text-base-content/60">Vence {sale.detallePago.vencimiento}</p>
              </div>
            )}
            {sale.clienteDocumento && (
              <div className="rounded-box border border-base-300 bg-base-200/50 p-4">
                <p className="text-base-content/55">Documento</p>
                <p className="font-bold">{sale.clienteDocumento}</p>
              </div>
            )}
            <div className="rounded-box border border-base-300 bg-base-200/50 p-4">
              <p className="text-base-content/55">Atendido por</p>
              <p className="font-bold">{sale.usuarioNombre}</p>
            </div>
          </div>

          {/* Items List */}
          <div className="rounded-box border border-base-300 bg-base-100">
            <div className="flex items-center justify-between gap-3 border-b border-base-300 px-4 py-3">
              <h2 className="font-bold text-coffee">Detalle de productos</h2>
              <div className="badge badge-neutral badge-outline">{sale.items.length} items</div>
            </div>
            <ul className="list">
              {sale.items.map((item, i) => (
                <li key={i} className="list-row items-center px-4 py-4">
                  <div className="text-xs font-mono text-base-content/40">{String(i + 1).padStart(2, '0')}</div>
                  <div className="list-col-grow min-w-0">
                    <div className="font-semibold truncate">{item.nombre}</div>
                    <div className="text-sm text-base-content/60">{formatCurrency(item.precioUnitario)} por unidad</div>
                  </div>
                  <div className="badge badge-outline">x{item.cantidad}</div>
                  <div className="min-w-20 text-right text-sm text-base-content/70">{formatCurrency(item.precioUnitario)}</div>
                  <div className="min-w-24 text-right font-bold text-primary">{formatCurrency(item.cantidad * item.precioUnitario)}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="my-6">
            <div className="stats stats-vertical w-full bg-base-200/60 border border-base-300 shadow-none sm:stats-horizontal">
              <div className="stat">
                <div className="stat-title">Subtotal</div>
                <div className="stat-value text-xl">{formatCurrency(subtotal)}</div>
              </div>
              {descuento > 0 && (
                <div className="stat">
                  <div className="stat-title text-success">
                    Descuento{promoCodigo ? ` (${promoCodigo})` : ''}
                  </div>
                  <div className="stat-value text-success text-xl">- {formatCurrency(descuento)}</div>
                </div>
              )}
              <div className="stat">
                <div className="stat-title">IGV (18%)</div>
                <div className="stat-value text-xl">{formatCurrency(igv)}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Total</div>
                <div className="stat-value text-primary text-3xl">{formatCurrency(totalPagado)}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-base-300 pt-4 text-center text-sm text-base-content/60">
            <p className="font-medium text-base-content">¡Gracias por su compra!</p>
            <p>Juan Valdez Café - El mejor café de Colombia</p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
