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

-- ============================================================
-- TABLA DE PROMOCIONES / CÓDIGOS DE DESCUENTO
-- ============================================================

CREATE TABLE IF NOT EXISTS promociones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(30) UNIQUE NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo ENUM('porcentaje', 'monto_fijo') NOT NULL DEFAULT 'porcentaje',
  valor DECIMAL(10,2) NOT NULL,
  minimo_compra DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  usos_maximos INT DEFAULT NULL,          -- NULL = sin límite de usos
  usos_actuales INT NOT NULL DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,            -- NULL = sin fecha de vencimiento
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO promociones
  (codigo, titulo, descripcion, tipo, valor, minimo_compra, usos_maximos, fecha_inicio, fecha_fin)
VALUES
  (
    'BIENVENIDO10',
    'Descuento de Bienvenida',
    'Disfruta un 10% de descuento en tu primera visita. ¡Gracias por elegirnos!',
    'porcentaje', 10.00, 0.00, 100,
    CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  ),
  (
    'CAFE5SOL',
    'Café del Día',
    'S/ 5 de descuento en cualquier compra de café. Código válido por tiempo limitado.',
    'monto_fijo', 5.00, 20.00, 50,
    CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY)
  ),
  (
    'VERANO20',
    'Promo Verano',
    '¡Refresca tu verano! 20% de descuento en compras desde S/ 30.',
    'porcentaje', 20.00, 30.00, 200,
    CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY)
  ),
  (
    'FIEL15',
    'Cliente Fiel',
    'Para nuestros clientes más frecuentes: 15% de descuento en compras desde S/ 50.',
    'porcentaje', 15.00, 50.00, NULL,
    CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY)
  ),
  (
    'ESPECIAL10',
    'Combo Especial',
    'S/ 10 de descuento en compras desde S/ 40. Ideal para compartir con amigos.',
    'monto_fijo', 10.00, 40.00, 75,
    CURDATE(), DATE_ADD(CURDATE(), INTERVAL 45 DAY)
  );

-- ============================================================
-- TABLA DE PROVEEDORES (gestión de proveedores)
-- ============================================================

CREATE TABLE IF NOT EXISTS proveedores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  ruc VARCHAR(20) UNIQUE,
  contacto VARCHAR(120),                 -- persona de contacto
  telefono VARCHAR(20),
  email VARCHAR(100),
  direccion TEXT,
  suministro VARCHAR(120),               -- qué provee (café, insumos, etc.)
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO proveedores (nombre, ruc, contacto, telefono, email, direccion, suministro) VALUES
  ('Cafetalera Andina S.A.C.',  '20512345678', 'Rosa Quispe',   '999-100-200', 'ventas@cafetaleraandina.pe', 'Jr. Cusco 450, Lima',        'Granos de café verde'),
  ('Lácteos del Valle E.I.R.L.','20487654321', 'Jorge Medina',  '999-300-400', 'contacto@lacteosdelvalle.pe','Av. La Molina 1200, Lima',   'Leche y derivados'),
  ('Insumos Pastelería Perú',   '20456789012', 'Lucía Fernández','999-500-600', 'pedidos@insumospasteleria.pe','Calle Los Hornos 88, Lima', 'Harinas y repostería'),
  ('Empaques EcoPack S.A.',     '20423456789', 'Marco Ríos',    '999-700-800', 'ventas@ecopack.pe',         'Av. Industrial 340, Callao', 'Vasos y empaques'),
  ('Distribuidora Sabor Total', '20434567890', 'Karla Ponce',   '999-900-100', 'karla@sabortotal.pe',       'Jr. Comercio 210, Lima',     'Siropes y saborizantes');

-- ============================================================
-- TABLA DE TRABAJADORES (mantenimiento de personal)
-- ============================================================

CREATE TABLE IF NOT EXISTS trabajadores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  documento VARCHAR(20) UNIQUE,
  cargo VARCHAR(80) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(100),
  salario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha_ingreso DATE,
  turno ENUM('mañana', 'tarde', 'noche') NOT NULL DEFAULT 'mañana',
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO trabajadores (nombre, apellido, documento, cargo, telefono, email, salario, fecha_ingreso, turno) VALUES
  ('Lucía',   'Mendoza',  '45678912', 'Barista',            '988-111-222', 'lucia.mendoza@juanvaldez.com',  1500.00, DATE_SUB(CURDATE(), INTERVAL 400 DAY), 'mañana'),
  ('Andrés',  'Castillo', '45123789', 'Cajero',             '988-333-444', 'andres.castillo@juanvaldez.com',1400.00, DATE_SUB(CURDATE(), INTERVAL 300 DAY), 'tarde'),
  ('Fiorella','Ramos',    '46987321', 'Supervisora',        '988-555-666', 'fiorella.ramos@juanvaldez.com', 2200.00, DATE_SUB(CURDATE(), INTERVAL 600 DAY), 'mañana'),
  ('Kevin',   'Huamán',   '47852136', 'Barista',            '988-777-888', 'kevin.huaman@juanvaldez.com',   1500.00, DATE_SUB(CURDATE(), INTERVAL 150 DAY), 'noche'),
  ('Diana',   'Vega',     '48963217', 'Panadera',           '988-999-000', 'diana.vega@juanvaldez.com',     1600.00, DATE_SUB(CURDATE(), INTERVAL 220 DAY), 'mañana'),
  ('Renzo',   'Flores',   '44785296', 'Encargado de Almacén','988-121-343', 'renzo.flores@juanvaldez.com',  1800.00, DATE_SUB(CURDATE(), INTERVAL 90 DAY),  'tarde');

-- ============================================================
-- TABLA DE MAQUINARIA (mantenimiento de equipos)
-- ============================================================

CREATE TABLE IF NOT EXISTS maquinaria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(40) UNIQUE,
  marca VARCHAR(80),
  modelo VARCHAR(80),
  ubicacion VARCHAR(100),
  fecha_adquisicion DATE,
  ultimo_mantenimiento DATE,
  proximo_mantenimiento DATE,
  estado_operativo ENUM('operativa', 'mantenimiento', 'averiada', 'baja') NOT NULL DEFAULT 'operativa',
  observaciones TEXT,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO maquinaria (nombre, codigo, marca, modelo, ubicacion, fecha_adquisicion, ultimo_mantenimiento, proximo_mantenimiento, estado_operativo, observaciones) VALUES
  ('Máquina de Espresso',   'MAQ-001', 'La Marzocco', 'Linea PB',   'Barra principal', DATE_SUB(CURDATE(), INTERVAL 800 DAY), DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_ADD(CURDATE(), INTERVAL 50 DAY), 'operativa',     'Calibración de presión al día'),
  ('Molino de Café',        'MAQ-002', 'Mahlkönig',   'E65S',       'Barra principal', DATE_SUB(CURDATE(), INTERVAL 500 DAY), DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 70 DAY), 'operativa',     'Muelas revisadas'),
  ('Refrigeradora Industrial','MAQ-003','Coldex',    'CI-450',     'Cocina',          DATE_SUB(CURDATE(), INTERVAL 1200 DAY),DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY),  'mantenimiento', 'Requiere recarga de gas refrigerante'),
  ('Horno de Panadería',    'MAQ-004', 'Nova',        'MaxiPan 10', 'Panadería',       DATE_SUB(CURDATE(), INTERVAL 950 DAY), DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'operativa',     'Funcionamiento normal'),
  ('Licuadora Industrial',  'MAQ-005', 'Vitamix',     'XL',         'Barra de fríos',  DATE_SUB(CURDATE(), INTERVAL 300 DAY), DATE_SUB(CURDATE(), INTERVAL 200 DAY),DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'averiada',      'Motor con ruido anormal, fuera de servicio');

-- ============================================================
-- TABLA DE CONTROL DE CALIDAD (inspecciones)
-- ============================================================

CREATE TABLE IF NOT EXISTS control_calidad (
  id INT PRIMARY KEY AUTO_INCREMENT,
  producto_id INT,
  producto_nombre VARCHAR(100),
  lote VARCHAR(40),
  fecha_inspeccion DATE NOT NULL,
  inspector VARCHAR(100),
  temperatura DECIMAL(5,2),
  puntuacion INT NOT NULL DEFAULT 0,            -- 0 a 100
  resultado ENUM('aprobado', 'observado', 'rechazado') NOT NULL DEFAULT 'aprobado',
  observaciones TEXT,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

INSERT INTO control_calidad (producto_id, producto_nombre, lote, fecha_inspeccion, inspector, temperatura, puntuacion, resultado, observaciones) VALUES
  (2,  'Cappuccino',        'LT-2401', DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'Fiorella Ramos', 68.50, 95, 'aprobado',  'Espuma y temperatura óptimas'),
  (7,  'Cold Brew',         'LT-2402', DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'Fiorella Ramos',  4.00, 90, 'aprobado',  'Extracción correcta, buen aroma'),
  (10, 'Croissant',         'LT-2403', DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'Diana Vega',     22.00, 78, 'observado', 'Ligero exceso de horneado en algunos'),
  (13, 'Cheesecake',        'LT-2404', DATE_SUB(CURDATE(), INTERVAL 4 DAY),  'Diana Vega',      5.50, 88, 'aprobado',  'Textura y sabor conformes'),
  (6,  'Frappé de Café',    'LT-2405', DATE_SUB(CURDATE(), INTERVAL 6 DAY),  'Fiorella Ramos',  3.00, 60, 'rechazado', 'Consistencia muy líquida, se rehace el lote'),
  (17, 'Café Orgánico',     'LT-2406', DATE_SUB(CURDATE(), INTERVAL 8 DAY),  'Fiorella Ramos', 70.00, 97, 'aprobado',  'Notas dulces bien definidas');

-- ============================================================
-- TABLA DE LIBRO DE RECLAMACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS reclamaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  codigo VARCHAR(20) UNIQUE NOT NULL,          -- Ej: REC-000001
  tipo ENUM('reclamo', 'queja') NOT NULL DEFAULT 'reclamo',
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  tipo_documento ENUM('DNI', 'CE', 'pasaporte', 'RUC') NOT NULL DEFAULT 'DNI',
  documento VARCHAR(20),
  email VARCHAR(100),
  telefono VARCHAR(20),
  direccion TEXT,
  menor_edad BOOLEAN NOT NULL DEFAULT FALSE,
  tipo_bien ENUM('producto', 'servicio') NOT NULL DEFAULT 'producto',
  monto_reclamado DECIMAL(10,2),
  descripcion_bien TEXT,
  detalle TEXT NOT NULL,                        -- detalle de la reclamación
  pedido TEXT,                                  -- pedido concreto del consumidor
  estado ENUM('pendiente', 'en_proceso', 'resuelto', 'rechazado') NOT NULL DEFAULT 'pendiente',
  respuesta TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO reclamaciones (codigo, tipo, nombre, apellido, tipo_documento, documento, email, telefono, tipo_bien, monto_reclamado, descripcion_bien, detalle, pedido, estado) VALUES
  ('REC-000001', 'reclamo', 'Carlos', 'García', 'DNI', '12345678', 'carlos@email.com', '999-111-222', 'producto', 15.00, 'Frappé de Café', 'El producto llegó con menos cantidad de la ofrecida.', 'Solicito reposición o devolución del monto.', 'resuelto'),
  ('REC-000002', 'queja',   'María',  'López',  'DNI', '87654321', 'maria@email.com',  '999-333-444', 'servicio', NULL,  'Atención en caja',  'La espera en caja fue excesiva durante la hora punta.', 'Solicito mejorar los tiempos de atención.', 'pendiente'),
  ('REC-000003', 'reclamo', 'Pedro',  'Martínez','DNI','11223344', 'pedro@email.com',  '999-555-666', 'producto', 14.00, 'Latte', 'La bebida estaba fría al momento de servirla.', 'Solicito la reposición de mi pedido.', 'en_proceso');

-- ============================================================
-- TABLA DE HISTORIAL DE RESPALDOS
-- ============================================================

CREATE TABLE IF NOT EXISTS respaldos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  archivo VARCHAR(120) NOT NULL,
  formato ENUM('json', 'sql') NOT NULL DEFAULT 'json',
  tablas INT NOT NULL DEFAULT 0,
  registros INT NOT NULL DEFAULT 0,
  usuario VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA DE ASISTENCIA DE EMPLEADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS asistencias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trabajador_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_entrada TIME,
  hora_salida TIME,
  estado ENUM('presente', 'tardanza', 'falta', 'justificada') NOT NULL DEFAULT 'presente',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE,
  UNIQUE KEY uq_asistencia_dia (trabajador_id, fecha)
);

INSERT INTO asistencias (trabajador_id, fecha, hora_entrada, hora_salida, estado, observaciones) VALUES
  (1, CURDATE(),                            '07:55:00', '16:05:00', 'presente',    'Jornada completa'),
  (2, CURDATE(),                            '14:20:00', '22:00:00', 'tardanza',    'Llegó 20 minutos tarde'),
  (3, CURDATE(),                            '07:50:00', '16:00:00', 'presente',    NULL),
  (4, CURDATE(),                            NULL,       NULL,       'falta',       'No se presentó'),
  (5, CURDATE(),                            '07:58:00', '16:02:00', 'presente',    NULL),
  (6, CURDATE(),                            '14:00:00', '22:10:00', 'presente',    NULL),
  (1, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  '08:00:00', '16:00:00', 'presente',    NULL),
  (2, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  '14:00:00', '22:00:00', 'presente',    NULL),
  (3, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  NULL,       NULL,       'justificada', 'Permiso médico'),
  (4, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  '22:05:00', '06:00:00', 'presente',    'Turno noche'),
  (5, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  '08:10:00', '16:00:00', 'tardanza',    'Tráfico'),
  (6, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  '14:00:00', '22:00:00', 'presente',    NULL);

-- ============================================================
-- TABLA DE BONOS DE EMPLEADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS bonos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trabajador_id INT NOT NULL,
  tipo ENUM('productividad', 'puntualidad', 'ventas', 'antiguedad', 'otro') NOT NULL DEFAULT 'productividad',
  concepto VARCHAR(150),
  monto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha DATE NOT NULL,
  estado ENUM('pendiente', 'pagado') NOT NULL DEFAULT 'pendiente',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE
);

INSERT INTO bonos (trabajador_id, tipo, concepto, monto, fecha, estado, observaciones) VALUES
  (1, 'productividad', 'Meta de ventas del mes superada',   250.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY),  'pagado',    'Excelente desempeño en barra'),
  (3, 'antiguedad',    'Bono por 2 años en la empresa',      300.00, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'pagado',    NULL),
  (2, 'puntualidad',   'Asistencia perfecta del mes',        150.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY),  'pendiente', NULL),
  (5, 'productividad', 'Alta rotación de productos horneados',200.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY),  'pendiente', 'Panadería'),
  (4, 'ventas',        'Comisión por venta de combos',       120.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY),  'pendiente', NULL),
  (6, 'otro',          'Reconocimiento por apoyo en almacén', 100.00, DATE_SUB(CURDATE(), INTERVAL 8 DAY),  'pagado',    NULL);
