import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, DollarSign, Package, ReceiptText, TrendingUp } from 'lucide-react';
import { getSales } from '../../services/api';

const formatCurrency = (amount) => `$${Number(amount || 0).toFixed(2)}`;
const formatNumber = (amount) => new Intl.NumberFormat('es-PE').format(Number(amount || 0));

const dateFormatter = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
const shortDateFormatter = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' });
const monthFormatter = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' });

// DONE: empieza configuración de tipos de reportes
const reportTypes = [
  { id: 'daily', label: 'Diario', icon: CalendarDays, tableTitle: 'Ventas del día' },
  { id: 'weekly', label: 'Semanal', icon: BarChart3, tableTitle: 'Ventas de la semana' },
  { id: 'monthly', label: 'Mensual', icon: TrendingUp, tableTitle: 'Ventas del mes' },
  { id: 'annual', label: 'Anual', icon: ReceiptText, tableTitle: 'Ventas del año' },
];
// DONE: termina configuración de tipos de reportes

const padDatePart = (value) => String(value).padStart(2, '0');

const getDateInputValue = (date) => (
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
);

const parseBaseDate = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const parseSaleDate = (value) => {
  if (!value) return null;

  const normalizedValue = typeof value === 'string' ? value.replace(' ', 'T') : value;
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getStartOfWeek = (date) => {
  const weekStart = getStartOfDay(date);
  const dayIndex = weekStart.getDay();
  const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;
  weekStart.setDate(weekStart.getDate() + diffToMonday);
  return weekStart;
};

const getPeriodRange = (baseDate, reportType) => {
  if (reportType === 'weekly') {
    const start = getStartOfWeek(baseDate);
    const endExclusive = addDays(start, 7);
    const endDisplay = addDays(endExclusive, -1);

    return {
      start,
      endExclusive,
      label: `${shortDateFormatter.format(start)} - ${dateFormatter.format(endDisplay)}`,
    };
  }

  if (reportType === 'monthly') {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const endExclusive = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);

    return {
      start,
      endExclusive,
      label: monthFormatter.format(start),
    };
  }

  if (reportType === 'annual') {
    const start = new Date(baseDate.getFullYear(), 0, 1);
    const endExclusive = new Date(baseDate.getFullYear() + 1, 0, 1);

    return {
      start,
      endExclusive,
      label: `${baseDate.getFullYear()}`,
    };
  }

  const start = getStartOfDay(baseDate);

  return {
    start,
    endExclusive: addDays(start, 1),
    label: dateFormatter.format(start),
  };
};

const isSaleInRange = (sale, periodRange) => {
  const saleDate = parseSaleDate(sale.fecha);
  return saleDate && saleDate >= periodRange.start && saleDate < periodRange.endExclusive;
};

const getItemTotals = (item) => {
  const quantity = Number(item.cantidad) || 0;
  const unitPrice = Number(item.precioUnitario) || 0;
  const rawSubtotal = item.subtotal ?? quantity * unitPrice;

  return {
    quantity,
    subtotal: Number(rawSubtotal) || 0,
  };
};

const getSaleUnits = (sale) => (
  (sale.items || []).reduce((total, item) => total + getItemTotals(item).quantity, 0)
);

const getSaleProductsLabel = (sale) => {
  const productNames = (sale.items || []).map((item) => item.nombre).filter(Boolean);

  if (productNames.length === 0) return '-';
  if (productNames.length <= 2) return productNames.join(', ');

  return `${productNames.slice(0, 2).join(', ')} +${productNames.length - 2}`;
};

const getTopProducts = (periodSales) => {
  const productMap = new Map();

  periodSales.forEach((sale) => {
    (sale.items || []).forEach((item) => {
      const { quantity, subtotal } = getItemTotals(item);
      const productName = item.nombre || 'Producto sin nombre';
      const productKey = item.productoId ?? productName;
      const currentProduct = productMap.get(productKey) || { nombre: productName, cantidad: 0, ingresos: 0 };

      currentProduct.cantidad += quantity;
      currentProduct.ingresos += subtotal;
      productMap.set(productKey, currentProduct);
    });
  });

  return Array.from(productMap.values())
    .sort((firstProduct, secondProduct) => {
      if (secondProduct.cantidad !== firstProduct.cantidad) {
        return secondProduct.cantidad - firstProduct.cantidad;
      }

      return secondProduct.ingresos - firstProduct.ingresos;
    })
    .slice(0, 5);
};

const getPeriodSummary = (periodSales) => {
  const revenue = periodSales.reduce((total, sale) => total + (Number(sale.total) || 0), 0);
  const units = periodSales.reduce((total, sale) => total + getSaleUnits(sale), 0);

  return {
    revenue,
    sales: periodSales.length,
    units,
    topProducts: getTopProducts(periodSales),
  };
};

const getEmptyMessage = (reportType) => ({
  daily: 'No hay ventas registradas en este día.',
  weekly: 'No hay ventas registradas en esta semana.',
  monthly: 'No hay ventas registradas en este mes.',
  annual: 'No hay ventas registradas en este año.',
}[reportType] || 'No hay ventas registradas en este periodo.');

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [activeReport, setActiveReport] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(() => getDateInputValue(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSales = async () => {
      try {
        const data = await getSales();
        if (isMounted) setSales(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSales();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeType = reportTypes.find((reportType) => reportType.id === activeReport) || reportTypes[0];
  const baseDate = useMemo(() => parseBaseDate(selectedDate), [selectedDate]);
  const periodRange = useMemo(() => getPeriodRange(baseDate, activeReport), [baseDate, activeReport]);

  const periodSales = useMemo(() => (
    sales
      .filter((sale) => sale.estado !== 'anulada')
      .filter((sale) => isSaleInRange(sale, periodRange))
      .sort((firstSale, secondSale) => {
        const firstDate = parseSaleDate(firstSale.fecha)?.getTime() || 0;
        const secondDate = parseSaleDate(secondSale.fecha)?.getTime() || 0;
        return secondDate - firstDate;
      })
  ), [sales, periodRange]);

  const summary = useMemo(() => getPeriodSummary(periodSales), [periodSales]);
  const emptyMessage = getEmptyMessage(activeReport);

  return (
    <div className="space-y-5">
      {/* DONE: empieza encabezado, fecha base y selector de reportes */}
      <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-sm text-base-content/70">Ventas reales por día, semana, mes y año.</p>
        </div>

        <div className="flex w-full flex-col gap-2 md:flex-row xl:w-auto">
          <label className="input input-bordered w-full md:w-52">
            <CalendarDays size={16} className="opacity-70" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              aria-label="Fecha base del reporte"
            />
          </label>

          <div role="tablist" className="tabs tabs-box w-full overflow-x-auto bg-base-100 p-1 shadow-sm md:w-auto">
            {reportTypes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                onClick={() => setActiveReport(id)}
                className={`tab min-w-28 gap-2 ${activeReport === id ? 'tab-active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* DONE: termina encabezado, fecha base y selector de reportes */}

      {loading ? (
        /* DONE: empieza estado de carga de reportes */
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-28 w-full rounded-box" />
          ))}
        </section>
        /* DONE: termina estado de carga de reportes */
      ) : error ? (
        /* DONE: empieza alerta de error de reportes */
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
        /* DONE: termina alerta de error de reportes */
      ) : (
        <>
          {/* DONE: empieza tarjetas de resumen del periodo */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="stat p-5">
                <div className="stat-figure rounded-box bg-primary/10 p-3 text-primary">
                  <DollarSign size={22} />
                </div>
                <div className="stat-title">Ingresos</div>
                <div className="stat-value text-2xl text-primary">{formatCurrency(summary.revenue)}</div>
                <div className="stat-desc capitalize">{periodRange.label}</div>
              </div>
            </article>

            <article className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="stat p-5">
                <div className="stat-figure rounded-box bg-secondary/20 p-3 text-accent">
                  <ReceiptText size={22} />
                </div>
                <div className="stat-title">Ventas</div>
                <div className="stat-value text-2xl">{formatNumber(summary.sales)}</div>
                <div className="stat-desc">Completadas</div>
              </div>
            </article>

            <article className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="stat p-5">
                <div className="stat-figure rounded-box bg-success/10 p-3 text-success">
                  <Package size={22} />
                </div>
                <div className="stat-title">Unidades</div>
                <div className="stat-value text-2xl">{formatNumber(summary.units)}</div>
                <div className="stat-desc">Productos vendidos</div>
              </div>
            </article>
          </section>
          {/* DONE: termina tarjetas de resumen del periodo */}

          {/* DONE: empieza periodo seleccionado y productos líderes */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <article className="card border border-base-300 bg-base-100 shadow-sm xl:col-span-2">
              <div className="card-body">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="card-title text-lg">Periodo seleccionado</h2>
                  <span className="badge badge-primary badge-outline">{activeType.label}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-2xl font-bold capitalize">{periodRange.label}</p>
                    <p className="mt-1 text-sm text-base-content/70">
                      {formatNumber(summary.sales)} ventas, {formatNumber(summary.units)} unidades y {formatCurrency(summary.revenue)} de total.
                    </p>
                  </div>

                  <div className="stats bg-base-200 shadow-none">
                    <div className="stat min-w-44 p-4">
                      <div className="stat-title">Producto líder</div>
                      <div className="stat-value text-lg">{summary.topProducts[0]?.nombre || '-'}</div>
                      <div className="stat-desc">
                        {summary.topProducts[0] ? `${formatNumber(summary.topProducts[0].cantidad)} unidades` : 'Sin ventas'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="card border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body p-0">
                <div className="flex items-center justify-between px-5 pb-2 pt-5">
                  <h2 className="card-title text-lg">Top 5 productos</h2>
                  <span className="badge badge-outline">{activeType.label}</span>
                </div>

                {summary.topProducts.length === 0 ? (
                  <div className="px-5 pb-5">
                    <div className="alert">
                      <span>{emptyMessage}</span>
                    </div>
                  </div>
                ) : (
                  <ul className="list">
                    {summary.topProducts.map((product, index) => (
                      <li key={product.nombre} className="list-row items-center">
                        <div className="badge badge-primary badge-outline">{index + 1}</div>
                        <div className="list-col-grow min-w-0">
                          <p className="truncate font-medium">{product.nombre}</p>
                          <p className="text-xs text-base-content/60">{formatNumber(product.cantidad)} unidades</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(product.ingresos)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          </section>
          {/* DONE: termina periodo seleccionado y productos líderes */}

          {/* DONE: empieza tabla precisa de ventas del periodo */}
          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-2 pt-5">
                <div>
                  <h2 className="card-title text-lg">{activeType.tableTitle}</h2>
                  <p className="text-sm text-base-content/60 capitalize">{periodRange.label}</p>
                </div>
                <span className="badge badge-outline">{formatNumber(periodSales.length)} registros</span>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>N° boleta</th>
                      <th>Cliente</th>
                      <th className="hidden md:table-cell">Fecha</th>
                      <th className="hidden lg:table-cell">Productos</th>
                      <th className="text-right">Unidades</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodSales.map((sale) => {
                      const saleDate = parseSaleDate(sale.fecha);

                      return (
                        <tr key={sale.id}>
                          <td className="font-medium">{sale.numero}</td>
                          <td>{sale.clienteNombre || 'Consumidor final'}</td>
                          <td className="hidden md:table-cell">
                            {saleDate ? `${dateFormatter.format(saleDate)} ${timeFormatter.format(saleDate)}` : '-'}
                          </td>
                          <td className="hidden max-w-xs truncate lg:table-cell">{getSaleProductsLabel(sale)}</td>
                          <td className="text-right">{formatNumber(getSaleUnits(sale))}</td>
                          <td className="text-right font-semibold">{formatCurrency(sale.total)}</td>
                        </tr>
                      );
                    })}

                    {periodSales.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center text-base-content/60">{emptyMessage}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colSpan="4" className="hidden text-right lg:table-cell">Total</th>
                      <th colSpan="3" className="hidden text-right md:table-cell lg:hidden">Total</th>
                      <th colSpan="2" className="text-right md:hidden">Total</th>
                      <th className="text-right">{formatNumber(summary.units)}</th>
                      <th className="text-right">{formatCurrency(summary.revenue)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </section>
          {/* DONE: termina tabla precisa de ventas del periodo */}
        </>
      )}
    </div>
  );
};

export default Reports;