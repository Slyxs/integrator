-- ============================================================
-- Juan Valdez Café - Esquema de Base de Datos
-- ============================================================
-- Motor recomendado: MySQL 8.0+ / MariaDB 10.5+
--
-- Para aplicar este esquema (XAMPP sin contraseña):
-- mysql -u root < schema.sql
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
  usuario_id INT UNIQUE,                        -- cuenta de acceso del cliente
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  telefono VARCHAR(20),
  direccion TEXT,
  documento VARCHAR(20) UNIQUE,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
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

-- Usuarios (passwords hasheados con bcrypt, costo 10)
-- admin@juanvaldez.com    →  admin123
-- usuario@juanvaldez.com  →  user123
-- carlos@email.com        →  carlos123
-- maria@email.com         →  maria123
-- pedro@email.com         →  pedro123
-- ana@email.com           →  ana123
-- luis@email.com          →  luis123
-- valeria@email.com       →  valeria123
-- diego@email.com         →  diego123
-- camila@email.com        →  camila123
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador',   'admin@juanvaldez.com',  '$2y$10$KC0qB9DZSbWfBurEmszxjOAgZ4pIpaXafFdVG35PGKgM7cu8nB/WW', 'admin'),
  ('Usuario Demo',    'usuario@juanvaldez.com','$2y$10$AjExDWMyV0WLmhEmBe9oGOOM17igHCz.3UsjtRiZC8NDgkyHXqSbW', 'usuario'),
  ('Carlos García',   'carlos@email.com',      '$2y$10$Iujrapy6xIQh1lrE/6eK8edkayF7vf2xceQ7BxZ/ye2EcfBTy6o.C', 'usuario'),
  ('María López',     'maria@email.com',       '$2y$10$M3hnAR3l3tvqlHELEA.fkuO0ozHA1BCCW7AE1jhs73SYjU1JFD.bO', 'usuario'),
  ('Pedro Martínez',  'pedro@email.com',       '$2y$10$qn6xs4j9Viopw.vVCskO3eBN2VjjqldaF7JlOxwN5XPveZYs.Acd2', 'usuario'),
  ('Ana Torres',      'ana@email.com',         '$2y$10$eKiXpzxWNrQyho6obmMG6eyU6l0gvSZ6ScgY3wrl4DvFhnedTGgmi', 'usuario'),
  ('Luis Ramírez',    'luis@email.com',        '$2y$10$9yHJT.mF6xmTVvSh5BCdTOxR0VoheKtaMji2L1Sq06jX3WMJUXRPy', 'usuario'),
  ('Valeria Núñez',   'valeria@email.com',     '$2y$10$97oXpfQbZNJ4fa4fjyZ80ep4sNX1803rH0c8o9pq5hjT23cZifYL6', 'usuario'),
  ('Diego Salazar',   'diego@email.com',       '$2y$10$Btki0ibgbt34O9NceOEHMO0waBk.hvikaVa6z9TwNJLsUqh3SyY8y', 'usuario'),
  ('Camila Rojas',    'camila@email.com',      '$2y$10$ZZBI7m9.DUuneLKXwsZVl.qnI8hxwIUA5WiLtaKV6In7qEl5dEG7u', 'usuario');

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
  ('Wrap de Pollo', 'Tortilla con pollo a la parrilla y vegetales', 14.00, 4, 30),
  -- DONE: empieza productos extra para llenar reportes
  ('Café Orgánico', 'Café de origen seleccionado con notas dulces', 11.50, 1, 85),
  ('Té Chai Latte', 'Té especiado con leche vaporizada', 12.50, 1, 70),
  ('Granizado de Maracuyá', 'Bebida fría de maracuyá con hielo frappé', 13.00, 2, 75),
  ('Pan de Bono', 'Pan tradicional de queso recién horneado', 5.50, 3, 80),
  ('Torta de Zanahoria', 'Porción de torta con nueces y cobertura cremosa', 10.50, 3, 40),
  ('Bowl de Yogur', 'Yogur natural con granola, fruta y miel', 16.00, 4, 35);
  -- DONE: termina productos extra para llenar reportes

-- Clientes de ejemplo (usuario_id 3-10 corresponden a sus cuentas en usuarios)
INSERT INTO clientes (usuario_id, nombre, apellido, email, telefono, direccion, documento) VALUES
  (3,  'Carlos',  'García',   'carlos@email.com',   '999-111-222', 'Av. Principal 123',    '12345678'),
  (4,  'María',   'López',    'maria@email.com',    '999-333-444', 'Calle Secundaria 456', '87654321'),
  (5,  'Pedro',   'Martínez', 'pedro@email.com',    '999-555-666', 'Jr. Los Olivos 789',   '11223344'),
  (6,  'Ana',     'Torres',   'ana@email.com',      '999-777-101', 'Av. Café 210',         '44556677'),
  (7,  'Luis',    'Ramírez',  'luis@email.com',     '999-888-202', 'Calle Aroma 540',      '55667788'),
  (8,  'Valeria', 'Núñez',    'valeria@email.com',  '999-999-303', 'Jr. Cosecha 118',      '66778899'),
  (9,  'Diego',   'Salazar',  'diego@email.com',    '999-000-404', 'Av. Tostado 730',      '77889900'),
  (10, 'Camila',  'Rojas',    'camila@email.com',   '999-222-505', 'Pasaje Barista 45',    '88990011');

-- DONE: empieza ventas históricas para reportes diarios, semanales, mensuales y anuales
INSERT INTO ventas (id, numero, cliente_nombre, cliente_documento, usuario_id, usuario_nombre, metodo_pago, total, created_at) VALUES
  (1, 'BV-000001', 'Carlos García', '12345678', 2, 'Usuario Demo', 'efectivo', 31.00, TIMESTAMP(CURRENT_DATE, '09:15:00')),
  (2, 'BV-000002', 'María López', '87654321', 2, 'Usuario Demo', 'tarjeta', 37.50, TIMESTAMP(CURRENT_DATE, '12:30:00')),
  (3, 'BV-000003', 'Consumidor Final', NULL, 2, 'Usuario Demo', 'yape', 37.50, TIMESTAMP(CURRENT_DATE, '17:45:00')),
  (4, 'BV-000004', 'Pedro Martínez', '11223344', 2, 'Usuario Demo', 'efectivo', 38.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), '10:35:00')),
  (5, 'BV-000005', 'Ana Torres', '44556677', 2, 'Usuario Demo', 'tarjeta', 41.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), '14:10:00')),
  (6, 'BV-000006', 'Luis Ramírez', '55667788', 2, 'Usuario Demo', 'efectivo', 36.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 3 DAY), '16:25:00')),
  (7, 'BV-000007', 'Valeria Núñez', '66778899', 2, 'Usuario Demo', 'yape', 27.50, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 4 DAY), '11:50:00')),
  (8, 'BV-000008', 'Diego Salazar', '77889900', 2, 'Usuario Demo', 'tarjeta', 44.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY), '18:05:00')),
  (9, 'BV-000009', 'Camila Rojas', '88990011', 2, 'Usuario Demo', 'efectivo', 31.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 9 DAY), '08:55:00')),
  (10, 'BV-000010', 'Carlos García', '12345678', 2, 'Usuario Demo', 'yape', 41.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 12 DAY), '13:20:00')),
  (11, 'BV-000011', 'María López', '87654321', 2, 'Usuario Demo', 'tarjeta', 60.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 18 DAY), '19:10:00')),
  (12, 'BV-000012', 'Pedro Martínez', '11223344', 2, 'Usuario Demo', 'efectivo', 34.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 25 DAY), '15:40:00')),
  (13, 'BV-000013', 'Ana Torres', '44556677', 1, 'Administrador', 'tarjeta', 35.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 45 DAY), '10:05:00')),
  (14, 'BV-000014', 'Luis Ramírez', '55667788', 1, 'Administrador', 'yape', 37.50, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 75 DAY), '12:15:00')),
  (15, 'BV-000015', 'Valeria Núñez', '66778899', 1, 'Administrador', 'efectivo', 41.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 110 DAY), '17:00:00')),
  (16, 'BV-000016', 'Diego Salazar', '77889900', 1, 'Administrador', 'tarjeta', 31.50, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 150 DAY), '09:30:00')),
  (17, 'BV-000017', 'Camila Rojas', '88990011', 1, 'Administrador', 'yape', 58.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 220 DAY), '18:25:00')),
  (18, 'BV-000018', 'Consumidor Final', NULL, 1, 'Administrador', 'efectivo', 37.50, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 310 DAY), '11:45:00')),
  (19, 'BV-000019', 'Carlos García', '12345678', 1, 'Administrador', 'tarjeta', 42.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 390 DAY), '13:05:00')),
  (20, 'BV-000020', 'María López', '87654321', 1, 'Administrador', 'efectivo', 40.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 520 DAY), '16:50:00')),
  (21, 'BV-000021', 'Pedro Martínez', '11223344', 1, 'Administrador', 'yape', 49.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 760 DAY), '10:20:00')),
  (22, 'BV-000022', 'Ana Torres', '44556677', 1, 'Administrador', 'tarjeta', 36.00, TIMESTAMP(DATE_SUB(CURRENT_DATE, INTERVAL 1120 DAY), '15:15:00'));

INSERT INTO detalle_ventas (venta_id, producto_id, nombre_producto, cantidad, precio_unitario) VALUES
  (1, 2, 'Cappuccino', 2, 12.00),
  (1, 10, 'Croissant', 1, 7.00),
  (2, 7, 'Cold Brew', 1, 14.00),
  (2, 12, 'Brownie', 2, 9.00),
  (2, 20, 'Pan de Bono', 1, 5.50),
  (3, 1, 'Café Americano', 3, 8.50),
  (3, 15, 'Empanada', 2, 6.00),
  (4, 3, 'Latte', 2, 13.00),
  (4, 13, 'Cheesecake', 1, 12.00),
  (5, 6, 'Frappé de Café', 1, 15.00),
  (5, 14, 'Sandwich Club', 1, 15.00),
  (5, 20, 'Pan de Bono', 2, 5.50),
  (6, 4, 'Mocaccino', 2, 14.00),
  (6, 11, 'Muffin de Arándanos', 1, 8.00),
  (7, 8, 'Smoothie de Frutas', 1, 13.50),
  (7, 16, 'Wrap de Pollo', 1, 14.00),
  (8, 17, 'Café Orgánico', 2, 11.50),
  (8, 21, 'Torta de Zanahoria', 2, 10.50),
  (9, 5, 'Chocolate Caliente', 1, 10.00),
  (9, 10, 'Croissant', 3, 7.00),
  (10, 18, 'Té Chai Latte', 2, 12.50),
  (10, 22, 'Bowl de Yogur', 1, 16.00),
  (11, 7, 'Cold Brew', 3, 14.00),
  (11, 12, 'Brownie', 2, 9.00),
  (12, 9, 'Limonada de Café', 1, 12.00),
  (12, 16, 'Wrap de Pollo', 1, 14.00),
  (12, 11, 'Muffin de Arándanos', 1, 8.00),
  (13, 2, 'Cappuccino', 2, 12.00),
  (13, 20, 'Pan de Bono', 2, 5.50),
  (14, 6, 'Frappé de Café', 1, 15.00),
  (14, 15, 'Empanada', 2, 6.00),
  (14, 21, 'Torta de Zanahoria', 1, 10.50),
  (15, 3, 'Latte', 2, 13.00),
  (15, 14, 'Sandwich Club', 1, 15.00),
  (16, 1, 'Café Americano', 1, 8.50),
  (16, 10, 'Croissant', 2, 7.00),
  (16, 12, 'Brownie', 1, 9.00),
  (17, 7, 'Cold Brew', 3, 14.00),
  (17, 22, 'Bowl de Yogur', 1, 16.00),
  (18, 8, 'Smoothie de Frutas', 1, 13.50),
  (18, 13, 'Cheesecake', 2, 12.00),
  (19, 1, 'Café Americano', 4, 8.50),
  (19, 11, 'Muffin de Arándanos', 1, 8.00),
  (20, 4, 'Mocaccino', 2, 14.00),
  (20, 15, 'Empanada', 2, 6.00),
  (21, 2, 'Cappuccino', 2, 12.00),
  (21, 16, 'Wrap de Pollo', 1, 14.00),
  (21, 20, 'Pan de Bono', 2, 5.50),
  (22, 17, 'Café Orgánico', 1, 11.50),
  (22, 21, 'Torta de Zanahoria', 1, 10.50),
  (22, 7, 'Cold Brew', 1, 14.00);

UPDATE productos p
JOIN (
  SELECT producto_id, SUM(cantidad) AS cantidad_vendida
  FROM detalle_ventas
  GROUP BY producto_id
) vendidos ON vendidos.producto_id = p.id
SET p.stock = GREATEST(0, p.stock - vendidos.cantidad_vendida);
-- DONE: termina ventas históricas para reportes diarios, semanales, mensuales y anuales
