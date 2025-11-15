-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  status VARCHAR(50) NOT NULL DEFAULT 'processing',
  total_amount DECIMAL(10, 2) NOT NULL,
  items_count INTEGER NOT NULL DEFAULT 0,
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales_analytics table for daily stats
CREATE TABLE IF NOT EXISTS sales_analytics (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  revenue DECIMAL(10, 2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_analytics_date ON sales_analytics(date);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Insert sample products
INSERT INTO products (name, description, price, category, stock, image_url) VALUES
('Беспроводные наушники Premium', 'Наушники с активным шумоподавлением и 30 часами работы', 8990, 'Электроника', 45, '/placeholder.svg'),
('Смарт-часы Pro', 'Умные часы с мониторингом здоровья и GPS', 15990, 'Электроника', 23, '/placeholder.svg'),
('Рюкзак городской', 'Стильный рюкзак с отделением для ноутбука 15"', 3490, 'Аксессуары', 67, '/placeholder.svg'),
('Термокружка 500мл', 'Вакуумная термокружка, держит тепло 8 часов', 1290, 'Дом', 120, '/placeholder.svg'),
('Беспроводная клавиатура', 'Механическая клавиатура с RGB подсветкой', 5490, 'Электроника', 34, '/placeholder.svg'),
('Портативная колонка', 'Bluetooth колонка с защитой от воды IP67', 4990, 'Электроника', 56, '/placeholder.svg'),
('Кожаный кошелек', 'Минималистичный кошелек из натуральной кожи', 2990, 'Аксессуары', 89, '/placeholder.svg'),
('Настольная лампа LED', 'Умная лампа с регулировкой яркости и цвета', 3990, 'Дом', 42, '/placeholder.svg');

-- Insert sample customers
INSERT INTO customers (name, email, phone, total_spent, total_orders, status) VALUES
('Александр Иванов', 'alex@example.com', '+7 999 123-45-67', 234890, 23, 'premium'),
('Мария Петрова', 'maria@example.com', '+7 999 234-56-78', 89450, 12, 'active'),
('Дмитрий Сидоров', 'dmitry@example.com', '+7 999 345-67-89', 156780, 18, 'premium'),
('Елена Козлова', 'elena@example.com', '+7 999 456-78-90', 45600, 7, 'active'),
('Иван Новиков', 'ivan@example.com', '+7 999 567-89-01', 178900, 15, 'premium');

-- Insert sample orders
INSERT INTO orders (order_number, customer_id, status, total_amount, items_count, shipping_address, created_at) VALUES
('ORD-2024-001', 1, 'delivered', 24990, 3, 'Москва, ул. Ленина, д. 10, кв. 5', '2024-11-15 10:30:00'),
('ORD-2024-002', 2, 'processing', 8990, 1, 'Санкт-Петербург, Невский пр., д. 25', '2024-11-14 15:20:00'),
('ORD-2024-003', 3, 'shipped', 45600, 5, 'Казань, ул. Баумана, д. 30, кв. 12', '2024-11-13 09:15:00'),
('ORD-2024-004', 1, 'delivered', 12480, 2, 'Москва, ул. Ленина, д. 10, кв. 5', '2024-11-12 14:45:00'),
('ORD-2024-005', 4, 'shipped', 7980, 2, 'Екатеринбург, пр. Ленина, д. 50', '2024-11-11 11:00:00');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 8990),
(1, 2, 1, 15990),
(2, 1, 1, 8990),
(3, 2, 1, 15990),
(3, 3, 2, 6980),
(3, 5, 3, 16470),
(4, 4, 4, 5160),
(4, 6, 1, 4990),
(5, 7, 2, 5980),
(5, 8, 1, 3990);

-- Insert sales analytics for last 7 days
INSERT INTO sales_analytics (date, revenue, orders_count, new_customers) VALUES
('2024-11-09', 145600, 15, 3),
('2024-11-10', 178900, 18, 5),
('2024-11-11', 198450, 22, 4),
('2024-11-12', 234890, 28, 6),
('2024-11-13', 267800, 31, 7),
('2024-11-14', 289560, 35, 8),
('2024-11-15', 312400, 38, 9);
