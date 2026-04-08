import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('dripbux.db');
const JWT_SECRET = process.env.JWT_SECRET || 'dripbux-secret-key';

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    robux_balance INTEGER DEFAULT 1000,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price_robux INTEGER NOT NULL,
    image_url TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_sizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS cart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES cart(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_robux INTEGER NOT NULL,
    shipping_fee INTEGER NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS order_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

// Seed initial products if empty
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (productCount.count === 0) {
  const products = [
    { name: 'Classic Black Hoodie', description: 'Premium cotton blend hoodie, perfect for any weather.', category: 'hoodies', price: 450, image: 'https://picsum.photos/seed/hoodie1/400/500' },
    { name: 'Oversized White Tee', description: 'Heavyweight cotton tee with a relaxed fit.', category: 'shirts', price: 250, image: 'https://picsum.photos/seed/shirt1/400/500' },
    { name: 'Cargo Tech Pants', description: 'Functional cargo pants with multiple pockets and adjustable straps.', category: 'pants', price: 600, image: 'https://picsum.photos/seed/pants1/400/500' },
    { name: 'Urban Street Cap', description: 'Minimalist cap with adjustable strap.', category: 'accessories', price: 150, image: 'https://picsum.photos/seed/cap1/400/500' },
    { name: 'Retro High-Tops', description: 'Classic street style sneakers with modern comfort.', category: 'footwear', price: 850, image: 'https://picsum.photos/seed/shoes1/400/500' },
    { name: 'Graphic Print Hoodie', description: 'Limited edition graphic print on soft fleece.', category: 'hoodies', price: 550, image: 'https://picsum.photos/seed/hoodie2/400/500' },
  ];

  const insertProduct = db.prepare('INSERT INTO products (name, description, category, price_robux, image_url) VALUES (?, ?, ?, ?, ?)');
  const insertSize = db.prepare('INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)');

  products.forEach(p => {
    const result = insertProduct.run(p.name, p.description, p.category, p.price, p.image);
    const productId = result.lastInsertRowid;
    ['S', 'M', 'L', 'XL'].forEach(size => {
      insertSize.run(productId, size, 50);
    });
  });

  // Seed Admin
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)').run('frankmanuelbeltran_alt', 'admin@dripbux.com', adminPassword, 'admin');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    try {
      const hash = bcrypt.hashSync(password, 10);
      const result = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);
      const userId = result.lastInsertRowid;
      db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.cookie('token', token, { httpOnly: true }).json({ user: { id: user.id, username: user.username, role: user.role, robux_balance: user.robux_balance } });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token').json({ success: true });
  });

  app.get('/api/auth/me', authenticate, (req: any, res) => {
    const user = db.prepare('SELECT id, username, email, robux_balance, role FROM users WHERE id = ?').get(req.user.id) as any;
    res.json({ user });
  });

  // Product Routes
  app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products').all();
    res.json(products);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as any;
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const sizes = db.prepare('SELECT * FROM product_sizes WHERE product_id = ?').all();
    res.json({ ...product, sizes });
  });

  // Cart Routes
  app.get('/api/cart', authenticate, (req: any, res) => {
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id) as any;
    const items = db.prepare(`
      SELECT ci.*, p.name, p.price_robux, p.image_url 
      FROM cart_items ci 
      JOIN products p ON ci.product_id = p.id 
      WHERE ci.cart_id = ?
    `).all(cart.id);
    res.json(items);
  });

  app.post('/api/cart/add', authenticate, (req: any, res) => {
    const { productId, size, quantity } = req.body;
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id) as any;
    
    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ?').get(cart.id, productId, size) as any;
    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(existing.quantity + quantity, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, product_id, size, quantity) VALUES (?, ?, ?, ?)').run(cart.id, productId, size, quantity);
    }
    res.json({ success: true });
  });

  app.delete('/api/cart/item/:id', authenticate, (req, res) => {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Order Routes
  app.post('/api/orders', authenticate, (req: any, res) => {
    const { addressId, shippingFee, items, totalRobux } = req.body;
    const user = db.prepare('SELECT robux_balance FROM users WHERE id = ?').get(req.user.id) as any;
    
    if (user.robux_balance < totalRobux) {
      return res.status(400).json({ error: 'Insufficient Robux balance' });
    }

    const transaction = db.transaction(() => {
      // Deduct balance
      db.prepare('UPDATE users SET robux_balance = robux_balance - ? WHERE id = ?').run(totalRobux, req.user.id);
      
      // Create order
      const orderResult = db.prepare('INSERT INTO orders (user_id, total_robux, shipping_fee) VALUES (?, ?, ?)').run(req.user.id, totalRobux, shippingFee);
      const orderId = orderResult.lastInsertRowid;

      // Add items
      const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, size, quantity, price_at_purchase) VALUES (?, ?, ?, ?, ?)');
      const updateStock = db.prepare('UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND size = ?');
      
      for (const item of items) {
        insertItem.run(orderId, item.product_id, item.size, item.quantity, item.price_robux);
        updateStock.run(item.quantity, item.product_id, item.size);
      }

      // Initial tracking
      db.prepare('INSERT INTO order_tracking (order_id, status) VALUES (?, ?)').run(orderId, 'Pending');

      // Clear cart
      const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id) as any;
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

      return orderId;
    });

    try {
      const orderId = transaction();
      res.json({ success: true, orderId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/orders', authenticate, (req: any, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all();
    res.json(orders);
  });

  app.get('/api/orders/:id', authenticate, (req: any, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id) as any;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const items = db.prepare(`
      SELECT oi.*, p.name, p.image_url 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `).all(order.id);
    const tracking = db.prepare('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY timestamp DESC').all();
    res.json({ ...order, items, tracking });
  });

  // User Profile Routes
  app.post('/api/user/earn-robux', authenticate, (req: any, res) => {
    db.prepare('UPDATE users SET robux_balance = robux_balance + 500 WHERE id = ?').run(req.user.id);
    res.json({ success: true });
  });

  app.get('/api/user/addresses', authenticate, (req: any, res) => {
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ?').all();
    res.json(addresses);
  });

  app.post('/api/user/addresses', authenticate, (req: any, res) => {
    const { fullName, phone, address, city, postalCode } = req.body;
    db.prepare('INSERT INTO addresses (user_id, full_name, phone, address, city, postal_code) VALUES (?, ?, ?, ?, ?, ?)').run(req.user.id, fullName, phone, address, city, postalCode);
    res.json({ success: true });
  });

  // Admin Routes
  app.get('/api/admin/stats', authenticate, isAdmin, (req, res) => {
    const totalSales = db.prepare('SELECT SUM(total_robux) as total FROM orders').get() as any;
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    res.json({ totalRevenue: totalSales.total || 0, orderCount: orderCount.count, userCount: userCount.count });
  });

  app.get('/api/admin/orders', authenticate, isAdmin, (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, u.username 
      FROM orders o 
      JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `).all();
    res.json(orders);
  });

  app.post('/api/admin/orders/:id/status', authenticate, isAdmin, (req, res) => {
    const { status } = req.body;
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    db.prepare('INSERT INTO order_tracking (order_id, status) VALUES (?, ?)').run(req.params.id, status);
    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
