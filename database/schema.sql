-- ============================================================
-- Juan Valdez Café - Esquema de Base de Datos
-- ============================================================
-- Motor recomendado: MySQL 8.0+ / MariaDB 10.5+
--
-- Para aplicar este esquema:
-- mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS juan_valdez_cafe
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE juan_valdez_cafe;

-- ============================================================
-- TABLAS
-- ============================================================

-- Tabla de Usuarios (autenticación y roles)
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Almacenar hash con bcrypt
  rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Clientes
CREATE TABLE clientes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  telefono VARCHAR(20),
  direccion TEXT,
  documento VARCHAR(20) UNIQUE,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Categorías de Productos
CREATE TABLE categorias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  descripcion TEXT,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE productos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  categoria_id INT,
  stock INT NOT NULL DEFAULT 0,
  imagen_url VARCHAR(255),
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- Tabla de Ventas (comprobantes)
CREATE TABLE ventas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  numero VARCHAR(20) UNIQUE NOT NULL,           -- Ej: BV-000001
  cliente_nombre VARCHAR(200) DEFAULT 'Consumidor Final',
  cliente_documento VARCHAR(20),
  usuario_id INT NOT NULL,
  usuario_nombre VARCHAR(100),
  metodo_pago ENUM('efectivo', 'tarjeta', 'yape') NOT NULL DEFAULT 'efectivo',
  detalle_pago JSON DEFAULT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('completada', 'anulada') DEFAULT 'completada',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de Detalle de Ventas
CREATE TABLE detalle_ventas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  nombre_producto VARCHAR(100) NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX idx_ventas_fecha ON ventas(created_at);
CREATE INDEX idx_detalle_venta ON detalle_ventas(venta_id);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Usuarios (en producción usar bcrypt para passwords)
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@juanvaldez.com', 'admin123', 'admin'),
  ('Usuario Demo', 'usuario@juanvaldez.com', 'user123', 'usuario');

-- Categorías
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Bebidas Calientes', 'Café, chocolate y más'),
  ('Bebidas Frías', 'Frappés, cold brew y smoothies'),
  ('Panadería', 'Pan, croissants y pasteles'),
  ('Snacks', 'Sándwiches, wraps y más');

-- Productos
INSERT INTO productos (nombre, descripcion, precio, categoria_id, stock) VALUES
  ('Café Americano', 'Café negro preparado con agua caliente', 8.50, 1, 100),
  ('Cappuccino', 'Espresso con leche espumada y espuma de leche', 12.00, 1, 100),
  ('Latte', 'Espresso con leche al vapor', 13.00, 1, 100),
  ('Mocaccino', 'Espresso con chocolate y leche espumada', 14.00, 1, 100),
  ('Chocolate Caliente', 'Chocolate premium fundido con leche', 10.00, 1, 100),
  ('Frappé de Café', 'Café helado mezclado con hielo y crema', 15.00, 2, 100),
  ('Cold Brew', 'Café de extracción en frío por 12 horas', 14.00, 2, 100),
  ('Smoothie de Frutas', 'Mezcla de frutas frescas con hielo', 13.50, 2, 100),
  ('Limonada de Café', 'Refrescante mezcla de limón y café', 12.00, 2, 100),
  ('Croissant', 'Croissant de mantequilla recién horneado', 7.00, 3, 50),
  ('Muffin de Arándanos', 'Muffin esponjoso con arándanos frescos', 8.00, 3, 50),
  ('Brownie', 'Brownie de chocolate intenso', 9.00, 3, 50),
  ('Cheesecake', 'Tarta de queso cremosa', 12.00, 3, 30),
  ('Sandwich Club', 'Pollo, tocino, lechuga y tomate', 15.00, 4, 30),
  ('Empanada', 'Empanada rellena de carne y especias', 6.00, 4, 40),
  ('Wrap de Pollo', 'Tortilla con pollo a la parrilla y vegetales', 14.00, 4, 30);

-- Clientes de ejemplo
INSERT INTO clientes (nombre, apellido, email, telefono, direccion, documento) VALUES
  ('Carlos', 'García', 'carlos@email.com', '999-111-222', 'Av. Principal 123', '12345678'),
  ('María', 'López', 'maria@email.com', '999-333-444', 'Calle Secundaria 456', '87654321'),
  ('Pedro', 'Martínez', 'pedro@email.com', '999-555-666', 'Jr. Los Olivos 789', '11223344');
