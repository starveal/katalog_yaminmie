import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_FILE = path.join(__dirname, 'katalogwa.sqlite');

class SqliteDatabase {
  constructor() {
    this.db = new DatabaseSync(SQLITE_FILE);
    this.initTables();
    this.seedInitialData();
  }

  initTables() {
    // Enable foreign keys
    this.db.exec('PRAGMA foreign_keys = ON;');

    // 1. Categories Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Products Table (Relational with Foreign Key to categories)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        price INTEGER NOT NULL,
        stock_status TEXT NOT NULL DEFAULT 'Tersedia',
        description TEXT,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Settings Key-Value Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // 4. Admin Authentication Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
    `);
  }

  seedInitialData() {
    // Seed Settings
    const existingSettings = this.db.prepare('SELECT COUNT(*) AS count FROM settings').get();
    if (existingSettings.count === 0) {
      const insertSetting = this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      insertSetting.run('storeName', 'Toko Berkah Nusantara');
      insertSetting.run('tagline', 'Kuliner Lezat & Segar Siap Antar Setiap Hari');
      insertSetting.run('phone', '6281234567890');
      insertSetting.run('address', 'Jl. Melati No. 12, Kebayoran Baru, Jakarta Selatan');
      insertSetting.run('currency', 'Rp');
    }

    // Seed Admin
    const existingAdmin = this.db.prepare('SELECT COUNT(*) AS count FROM admins').get();
    if (existingAdmin.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      this.db.prepare(
        'INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)'
      ).run('admin-1', 'Owner Toko Berkah', 'admin@katalogwa.com', hashedPassword);
    }

    // Seed Categories
    const existingCategories = this.db.prepare('SELECT COUNT(*) AS count FROM categories').get();
    if (existingCategories.count === 0) {
      const insertCat = this.db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)');
      insertCat.run('cat-1', 'Makanan', 'makanan');
      insertCat.run('cat-2', 'Minuman', 'minuman');
      insertCat.run('cat-3', 'Camilan', 'camilan');
    }

    // Seed Products
    const existingProducts = this.db.prepare('SELECT COUNT(*) AS count FROM products').get();
    if (existingProducts.count === 0) {
      const insertProduct = this.db.prepare(`
        INSERT INTO products (id, name, category_id, price, stock_status, description, image)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const initialProducts = [
        {
          id: 'prod-1',
          name: 'Nasi Goreng Spesial Toko Berkah',
          categoryId: 'cat-1',
          price: 28000,
          stockStatus: 'Tersedia',
          description: 'Nasi goreng racikan bumbu rempah otentik disajikan dengan telur mata sapi, ayam suwir, dan kerupuk renyah.',
          image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'prod-2',
          name: 'Ayam Bakar Madu Pedas',
          categoryId: 'cat-1',
          price: 32000,
          stockStatus: 'Tersedia',
          description: 'Potongan ayam bakar empuk dilumuri saus madu gurih pedas manis dengan lalapan segar dan sambal terasi.',
          image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'prod-3',
          name: 'Mie Aceh Tumis Daging Sapi',
          categoryId: 'cat-1',
          price: 30000,
          stockStatus: 'Tersedia',
          description: 'Mie kuning kenyal khas Aceh dimasak bumbu kari pekat dengan irisan daging sapi empuk, tauge, dan emping.',
          image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'prod-4',
          name: 'Es Kopi Susu Gula Aren',
          categoryId: 'cat-2',
          price: 18000,
          stockStatus: 'Tersedia',
          description: 'Espresso robusta & arabica pilihan dipadu susu creamy fresh dan sirup gula aren murni organik.',
          image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'prod-5',
          name: 'Matcha Latte Creamy Frappe',
          categoryId: 'cat-2',
          price: 22000,
          stockStatus: 'Tersedia',
          description: 'Bubuk green tea matcha Uji Jepang premium dipadu susu segar dingin yang lembut dan harum.',
          image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'prod-6',
          name: 'Es Lemon Tea Segar Jumbo',
          categoryId: 'cat-2',
          price: 10000,
          stockStatus: 'Tersedia',
          description: 'Seduhan teh melati wangi dengan perasan lemon asli segar dan es batu dingin, penghilang dahaga terbaik.',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'prod-7',
          name: 'Pisang Goreng Keju Cokelat Lumer',
          categoryId: 'cat-3',
          price: 18000,
          stockStatus: 'Tersedia',
          description: 'Pisang raja manis digoreng tepung crispy diselimuti keju parut gurih dan saus cokelat Belgian lumer.',
          image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'prod-8',
          name: 'Dimsum Mentai Panggang (4 pcs)',
          categoryId: 'cat-3',
          price: 25000,
          stockStatus: 'Tersedia',
          description: 'Dimsum ayam udang lembut dengan topping saus mentai gurih dibakar torch aroma smoky menggoda.',
          image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80'
        },
        {
          id: 'prod-9',
          name: 'Cireng Crispy Bumbu Rujak Pedas',
          categoryId: 'cat-3',
          price: 15000,
          stockStatus: 'Habis',
          description: 'Cireng kenyal gurih dengan lapisan renyah di luar, dicocol saus rujak manis asam pedas nagih.',
          image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80'
        }
      ];

      for (const p of initialProducts) {
        insertProduct.run(p.id, p.name, p.categoryId, p.price, p.stockStatus, p.description, p.image);
      }
    }
  }

  // --- Settings SQL Operations ---
  getSettings() {
    const rows = this.db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  updateSettings(newSettings) {
    const upsert = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, val] of Object.entries(newSettings)) {
      upsert.run(key, String(val));
    }
    return this.getSettings();
  }

  // --- Admin SQL Operations ---
  getAdmin() {
    return this.db.prepare('SELECT id, name, email, password FROM admins LIMIT 1').get();
  }

  // --- Category SQL Operations ---
  getCategories() {
    // Relational SQL query with LEFT JOIN and COUNT
    return this.db.prepare(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.created_at AS createdAt,
        COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `).all();
  }

  getCategoryById(id) {
    return this.db.prepare('SELECT id, name, slug FROM categories WHERE id = ?').get(id);
  }

  addCategory(name) {
    const id = `cat-${Date.now()}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').run(id, name, slug);
    return { id, name, slug, productCount: 0 };
  }

  updateCategory(id, name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const res = this.db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(name, slug, id);
    if (res.changes === 0) return null;
    return { id, name, slug };
  }

  deleteCategory(id) {
    const res = this.db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return res.changes > 0;
  }

  // --- Product SQL Operations ---
  getProducts(filters = {}) {
    let sql = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock_status AS stockStatus, 
        p.description, 
        p.image, 
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(filters.categoryId);
    }

    if (filters.stockStatus) {
      sql += ' AND p.stock_status = ?';
      params.push(filters.stockStatus);
    }

    if (filters.search) {
      sql += ' AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ?)';
      const queryPattern = `%${filters.search.toLowerCase()}%`;
      params.push(queryPattern, queryPattern);
    }

    sql += ' ORDER BY p.created_at DESC';

    return this.db.prepare(sql).all(...params);
  }

  getProductById(id) {
    return this.db.prepare(`
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock_status AS stockStatus, 
        p.description, 
        p.image, 
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(id);
  }

  addProduct(productData) {
    const id = `prod-${Date.now()}`;
    const price = Number(productData.price) || 0;
    const stockStatus = productData.stockStatus || 'Tersedia';
    const description = productData.description || '';
    const image = productData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

    this.db.prepare(`
      INSERT INTO products (id, name, category_id, price, stock_status, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, productData.name, productData.categoryId, price, stockStatus, description, image);

    return this.getProductById(id);
  }

  updateProduct(id, productData) {
    const current = this.getProductById(id);
    if (!current) return null;

    const name = productData.name !== undefined ? productData.name : current.name;
    const categoryId = productData.categoryId !== undefined ? productData.categoryId : current.categoryId;
    const price = productData.price !== undefined ? Number(productData.price) : current.price;
    const stockStatus = productData.stockStatus !== undefined ? productData.stockStatus : current.stockStatus;
    const description = productData.description !== undefined ? productData.description : current.description;
    const image = productData.image !== undefined ? productData.image : current.image;

    this.db.prepare(`
      UPDATE products 
      SET name = ?, category_id = ?, price = ?, stock_status = ?, description = ?, image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, categoryId, price, stockStatus, description, image, id);

    return this.getProductById(id);
  }

  toggleStock(id) {
    const product = this.getProductById(id);
    if (!product) return null;

    const newStock = product.stockStatus === 'Tersedia' ? 'Habis' : 'Tersedia';
    this.db.prepare(`
      UPDATE products 
      SET stock_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newStock, id);

    return this.getProductById(id);
  }

  deleteProduct(id) {
    const res = this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.changes > 0;
  }
}

export const db = new SqliteDatabase();
