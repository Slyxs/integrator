import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createSale } from '../../services/api';
import toast from 'react-hot-toast';

const formatCurrency = (amount) => `S/ ${amount.toFixed(2)}`;

const initialCardForm = {
  holderName: '',
  number: '',
  expiry: '',
  cvv: '',
  installments: '1',
};

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState(initialCardForm);
  const [cardDetails, setCardDetails] = useState(null);
  const [processing, setProcessing] = useState(false);

  const igv = total * 0.18;
  const totalConIgv = total + igv;

  const handleMetodoPagoChange = (event) => {
    const { value } = event.target;
    setMetodoPago(value);

    if (value === 'tarjeta') {
      setCardModalOpen(true);
    }
  };

  const handleCardFieldChange = (field, value) => {
    let nextValue = value;

    if (field === 'number') {
      nextValue = value.replace(/\D/g, '').slice(0, 16);
    }

    if (field === 'cvv') {
      nextValue = value.replace(/\D/g, '').slice(0, 4);
    }

    if (field === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      nextValue = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    }

    setCardForm(prev => ({ ...prev, [field]: nextValue }));
  };

  const closeCardModal = () => {
    if (!cardDetails) {
      setMetodoPago('efectivo');
    }

    setCardModalOpen(false);
  };

  const handleSaveCardDetails = (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    if (!form.reportValidity()) {
      return;
    }

    setCardDetails({
      holderName: cardForm.holderName.trim(),
      last4: cardForm.number.slice(-4),
      expiry: cardForm.expiry,
      installments: cardForm.installments,
    });
    setCardModalOpen(false);
    toast.success('Tarjeta registrada para esta compra');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (metodoPago === 'tarjeta' && !cardDetails) {
      toast.error('Completa los datos de la tarjeta para continuar');
      setCardModalOpen(true);
      return;
    }

    setProcessing(true);
    try {
      const sale = await createSale({
        clienteNombre: clienteNombre || 'Consumidor Final',
        clienteDocumento,
        metodoPago,
        detallePago: metodoPago === 'tarjeta'
          ? {
            titular: cardDetails.holderName,
            ultimos4: cardDetails.last4,
            vencimiento: cardDetails.expiry,
            cuotas: cardDetails.installments,
          }
          : null,
        usuarioId: user.id,
        usuarioNombre: user.nombre,
        items: items.map(item => ({
          productoId: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
        })),
        total: totalConIgv,
      });
      clearCart();
      toast.success('¡Compra realizada con éxito!');
      navigate(`/recibo/${sale.id}`);
    } catch {
      toast.error('Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="hero min-h-[60vh] bg-base-200/60 px-4">
        <div className="hero-content w-full max-w-md">
          <div className="card card-border bg-base-100 shadow-sm w-full">
            <div className="card-body items-center text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-base-200 text-base-content/35">
                <FiShoppingCart size={34} />
              </div>
              <h2 className="card-title text-2xl">Tu carrito está vacío</h2>
              <p className="text-base-content/65">Agrega productos desde nuestro menú para continuar con la compra.</p>
              <div className="card-actions">
                <Link to="/menu" className="btn btn-primary">
                  Ver Menú
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200/60 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-coffee">Tu Carrito</h1>
            <p className="mt-1 text-sm text-base-content/65">Revisa tus productos y confirma los datos de la venta.</p>
          </div>
          <div className="badge badge-primary badge-lg badge-outline">{items.length} productos</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="card card-border bg-base-100 shadow-sm">
              <div className="card-body p-3 sm:p-5">
                <ul className="list gap-2">
                  {items.map(item => (
                    <li key={item.id} className="list-row items-center rounded-box border border-base-300 bg-base-100 px-3 py-4">
                      <div className="flex size-14 items-center justify-center rounded-box bg-gradient-to-br from-primary/10 to-secondary/30 text-2xl shrink-0">
                        ☕
                      </div>
                      <div className="list-col-grow min-w-0">
                        <div className="font-bold text-coffee truncate">{item.nombre}</div>
                        <div className="text-sm text-base-content/65">Unitario: {formatCurrency(item.precio)}</div>
                      </div>
                      <div className="join join-horizontal">
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                          className="btn btn-sm join-item btn-outline"
                          aria-label={`Reducir cantidad de ${item.nombre}`}
                        >
                          <FiMinus size={14} />
                        </button>
                        <div className="btn btn-sm join-item btn-ghost pointer-events-none min-w-10">
                          {item.cantidad}
                        </div>
                        <button
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                          className="btn btn-sm join-item btn-outline"
                          aria-label={`Aumentar cantidad de ${item.nombre}`}
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                      <div className="min-w-20 text-right font-bold text-primary">
                        {formatCurrency(item.precio * item.cantidad)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                        aria-label={`Eliminar ${item.nombre} del carrito`}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card card-border bg-base-100 shadow-sm h-fit sticky top-20">
            <div className="card-body">
              <h2 className="card-title text-coffee">Resumen</h2>
              <div className="stats stats-vertical bg-base-200/60 border border-base-300 shadow-none">
                <div className="stat px-4 py-3">
                  <div className="stat-title">Subtotal</div>
                  <div className="stat-value text-lg">{formatCurrency(total)}</div>
                </div>
                <div className="stat px-4 py-3 border-t border-base-300">
                  <div className="stat-title">IGV (18%)</div>
                  <div className="stat-value text-lg">{formatCurrency(igv)}</div>
                </div>
                <div className="stat px-4 py-3 border-t border-base-300">
                  <div className="stat-title">Total</div>
                  <div className="stat-value text-primary text-2xl">{formatCurrency(totalConIgv)}</div>
                </div>
              </div>

              {!showCheckout ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="btn btn-primary w-full"
                >
                  Finalizar Compra
                </button>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="divider my-0">Datos del cliente</div>

                  <fieldset className="fieldset rounded-box border border-base-300 bg-base-200/50 p-4">
                    <legend className="fieldset-legend px-2">Datos de compra</legend>

                    <label htmlFor="clienteNombre" className="label">Nombre (opcional)</label>
                    <input
                      id="clienteNombre"
                      value={clienteNombre}
                      onChange={e => setClienteNombre(e.target.value)}
                      placeholder="Consumidor Final"
                      pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]{3,60}"
                      title="Ingresa entre 3 y 60 letras"
                      className="input validator w-full"
                    />
                    <p className="fieldset-label">Si lo dejas vacío, se registrará como consumidor final.</p>
                    <p className="validator-hint hidden">Usa solo letras y espacios, entre 3 y 60 caracteres.</p>

                    <label htmlFor="clienteDocumento" className="label mt-2">Documento (opcional)</label>
                    <input
                      id="clienteDocumento"
                      value={clienteDocumento}
                      onChange={e => setClienteDocumento(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="DNI / RUC"
                      inputMode="numeric"
                      pattern="(\d{8}|\d{11})"
                      title="Ingresa un DNI de 8 dígitos o un RUC de 11 dígitos"
                      className="input validator w-full"
                    />
                    <p className="validator-hint hidden">Debe ser un DNI de 8 dígitos o un RUC de 11.</p>

                    <label htmlFor="metodoPago" className="label mt-2">Método de pago</label>
                    <select
                      id="metodoPago"
                      value={metodoPago}
                      onChange={handleMetodoPagoChange}
                      className="select w-full"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="yape">Yape / Plin</option>
                    </select>

                    {metodoPago === 'tarjeta' && (
                      <div className="alert alert-info mt-3 items-start">
                        <div>
                          <div className="font-semibold">Pago con tarjeta</div>
                          <div className="text-sm">
                            {cardDetails
                              ? `Tarjeta terminada en ${cardDetails.last4} · ${cardDetails.installments} cuota(s)`
                              : 'Faltan los datos de la tarjeta para completar la compra.'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCardModalOpen(true)}
                          className="btn btn-sm btn-primary"
                        >
                          {cardDetails ? 'Editar tarjeta' : 'Agregar tarjeta'}
                        </button>
                      </div>
                    )}
                  </fieldset>

                  <div className="join join-vertical w-full sm:join-horizontal">
                    <button
                      type="submit"
                      disabled={processing}
                      className="btn btn-primary join-item flex-1 disabled:btn-disabled"
                    >
                      {processing ? 'Procesando...' : 'Confirmar Compra'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      className="btn btn-outline join-item"
                    >
                      Volver
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {cardModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-lg">
            <form onSubmit={handleSaveCardDetails} className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-coffee">Datos de la tarjeta</h3>
                <p className="text-sm text-base-content/65 mt-1">
                  Completa los datos para procesar el pago con tarjeta en esta compra.
                </p>
              </div>

              <fieldset className="fieldset rounded-box border border-base-300 bg-base-200/50 p-4">
                <legend className="fieldset-legend px-2">Tarjeta</legend>

                <label htmlFor="cardHolder" className="label">Titular</label>
                <input
                  id="cardHolder"
                  value={cardForm.holderName}
                  onChange={e => handleCardFieldChange('holderName', e.target.value)}
                  placeholder="Como figura en la tarjeta"
                  required
                  pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]{5,60}"
                  title="Ingresa el nombre del titular entre 5 y 60 letras"
                  className="input validator w-full"
                />
                <p className="validator-hint hidden">Ingresa el nombre del titular usando solo letras y espacios.</p>

                <label htmlFor="cardNumber" className="label mt-2">Número de tarjeta</label>
                <input
                  id="cardNumber"
                  value={cardForm.number}
                  onChange={e => handleCardFieldChange('number', e.target.value)}
                  placeholder="1234123412341234"
                  inputMode="numeric"
                  required
                  pattern="\d{16}"
                  title="Ingresa 16 dígitos"
                  className="input validator w-full"
                />
                <p className="validator-hint hidden">La tarjeta debe tener exactamente 16 dígitos.</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cardExpiry" className="label mt-2">Vencimiento</label>
                    <input
                      id="cardExpiry"
                      value={cardForm.expiry}
                      onChange={e => handleCardFieldChange('expiry', e.target.value)}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      required
                      pattern="(0[1-9]|1[0-2])\/\d{2}"
                      title="Usa el formato MM/YY"
                      className="input validator w-full"
                    />
                    <p className="validator-hint hidden">Usa el formato MM/YY.</p>
                  </div>

                  <div>
                    <label htmlFor="cardCvv" className="label mt-2">CVV</label>
                    <input
                      id="cardCvv"
                      value={cardForm.cvv}
                      onChange={e => handleCardFieldChange('cvv', e.target.value)}
                      placeholder="123"
                      inputMode="numeric"
                      required
                      pattern="\d{3,4}"
                      title="Ingresa un CVV de 3 o 4 dígitos"
                      className="input validator w-full"
                    />
                    <p className="validator-hint hidden">Ingresa un CVV de 3 o 4 dígitos.</p>
                  </div>
                </div>

                <label htmlFor="installments" className="label mt-2">Cuotas</label>
                <select
                  id="installments"
                  value={cardForm.installments}
                  onChange={e => handleCardFieldChange('installments', e.target.value)}
                  className="select w-full"
                >
                  <option value="1">1 cuota</option>
                  <option value="3">3 cuotas</option>
                  <option value="6">6 cuotas</option>
                </select>
              </fieldset>

              <div className="modal-action">
                <button type="button" onClick={closeCardModal} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar tarjeta
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={closeCardModal}>Cerrar</button>
          </form>
        </dialog>
      )}
    </div>
  );
};

export default Cart;
