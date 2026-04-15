import { createContext, useContext, useState } from 'react';

// Crea el contexto del carrito. El null es el valor de fallback si se usa
// fuera del provider, pero el hook useCart lo detecta y lanza un error claro.
const CartContext = createContext(null);

// Hook para consumir el carrito desde cualquier componente.
// Centraliza el acceso en un solo lugar en vez de repetir useContext por toda la app.
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
};

export const CartProvider = ({ children }) => {
  // items es el arreglo de productos en el carrito.
  // Cada elemento tiene todos los datos del producto más un campo 'cantidad'.
  const [items, setItems] = useState([]);

  // Agrega un producto al carrito.
  // Si ya existe (mismo id), solo aumenta su cantidad en 1.
  // Si no existe, lo agrega al final con cantidad = 1.
  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
  };

  // Elimina completamente un producto del carrito por su id.
  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  };

  // Cambia la cantidad de un producto.
  // Si la cantidad nueva es 0 o menor, lo elimina directamente
  // para no dejar productos con cantidad inválida en el carrito.
  const updateQuantity = (productId, cantidad) => {
    if (cantidad <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev =>
      prev.map(i => (i.id === productId ? { ...i, cantidad } : i))
    );
  };

  // Vacía el carrito por completo. Se llama después de procesar una compra.
  const clearCart = () => setItems([]);

  // Total en dinero del carrito (sin IGV) — se recalcula automáticamente
  // cada vez que items cambia, sin necesidad de guardarlo en un estado aparte.
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  // Cantidad total de unidades en el carrito (no de productos distintos).
  // Se usa para mostrar el número sobre el ícono del carrito en el navbar.
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0);

  // Expone todo lo necesario para que cualquier componente pueda leer
  // y modificar el carrito sin tener que pasar props manualmente.
  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
};
