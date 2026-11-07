import React, { useState, useEffect } from 'react';
import {
  fetchProducts,
  fetchCategories,
  fetchStoreSettings,
  fetchAdminProfile,
  clearAuthToken,
  getAuthToken
} from './services/api';

import { Header } from './components/Header';
import { CategoryPills } from './components/CategoryPills';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { OrderModal } from './components/OrderModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Sparkles, MessageCircle, MapPin, Phone, RefreshCw, ArrowUpRight, Utensils } from 'lucide-react';
import DefaultLogo from './assets/Cinnamix Coffee and Cinnamon Logo.png';

const currentYear = new Date().getFullYear();

export function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Admin authentication & views
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load all initial data from Node.js backend
  const loadData = async () => {
    try {
      const [prodRes, catRes, storeRes] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchStoreSettings()
      ]);

      if (prodRes?.data) setProducts(prodRes.data);
      if (catRes?.data) setCategories(catRes.data);
      if (storeRes?.data) setStoreSettings(storeRes.data);

    } catch (err) {
      console.error('Gagal mengambil data katalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Restore authenticated session on mount if token exists
  useEffect(() => {
    loadData();

    const token = getAuthToken();
    if (token) {
      fetchAdminProfile()
        .then((res) => {
          if (res?.user) setAdminUser(res.user);
        })
        .catch(() => {
          clearAuthToken();
          setAdminUser(null);
        });
    }
  }, []);

  // Handle Logout
  const handleLogout = () => {
    clearAuthToken();
    setAdminUser(null);
    setIsAdminView(false);
  };

  const handleAddToCart = (product) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      if (existingItem) {
        return currentItems.map((item) => (
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
      return [...currentItems, { ...product, quantity: 1 }];
    });
  };

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Filter products for Customer Catalog View
  const filteredProducts = products.filter((p) => {
    const matchesCat = !activeCategoryId || p.categoryId === activeCategoryId;

    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.categoryName &&
        p.categoryName.toLowerCase().includes(search.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  const heroProduct = products.find((product) => product.stockStatus === 'Tersedia') || products[0];
  const storePhone = (storeSettings?.phone || '6281234567890').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(
    `Halo ${storeSettings?.storeName || 'Cinnamix Coffee & Resto'}, saya ingin bertanya tentang menu hari ini.`
  )}`;

  return (
    <div className="app-layout">
      {/* Main Content Area */}
      {isAdminView && adminUser ? (
        /* FLOW 2: ADMIN BACK-OFFICE WITH DEDICATED SIDEBAR */
        <AdminDashboard
          products={products}
          categories={categories}
          storeSettings={storeSettings}
          adminUser={adminUser}
          onProfileUpdated={setAdminUser}
          onRefreshData={loadData}
          onBackToCatalog={() => setIsAdminView(false)}
          onLogout={handleLogout}
        />
      ) : (
        /* FLOW 1: CUSTOMER CATALOG & WHATSAPP ORDERING */
        <>
          {/* Top Header Navigation for Public Customers */}
          <Header
            storeSettings={storeSettings}
            isAdminView={isAdminView}
            setIsAdminView={setIsAdminView}
            adminUser={adminUser}
            cartItemCount={cartItemCount}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onLogout={handleLogout}
          />

          <main className="customer-catalog-view animate-fade-in">
            <section className="hero-banner" id="beranda">
              <div className="container hero-layout">
                <div className="hero-copy">
                  <span className="hero-badge">
                    <Sparkles size={14} />
                    <span>Rasa lokal, dibuat sepenuh hati</span>
                  </span>

                  <h1 className="hero-title">
                    Nikmati momen,
                    <span> temukan rasa favoritmu.</span>
                  </h1>

                  <p className="hero-desc">
                    {storeSettings?.tagline || 'Temukan racikan kopi dan hidangan rumahan yang selalu dibuat segar untuk menemani harimu.'}
                  </p>
                  <div className="hero-actions">
                    <a className="btn btn-primary" href="#menu">
                      <Utensils size={17} />
                      <span>Lihat Menu</span>
                    </a>
                    <a className="btn btn-hero-outline" href={whatsappUrl} target="_blank" rel="noreferrer">
                      <MessageCircle size={17} />
                      <span>Pesan Sekarang</span>
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                  <p className="hero-note">Pesan praktis, langsung terhubung dengan kami.</p>
                </div>

                <div className="hero-visual">
                  <img
                    className="hero-image"
                    src={heroProduct?.image || DefaultLogo}
                    alt={heroProduct?.name || 'Kopi dan hidangan Cinnamix'}
                  />
                  <div className="hero-image-caption">
                    <span className="hero-caption-mark"><Sparkles size={15} /></span>
                    <span>
                      <strong>{heroProduct?.name || storeSettings?.storeName || 'Cinnamix Coffee & Resto'}</strong>
                      <small>Favorit untuk menemani harimu</small>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="container catalog-content" id="menu">
              <div className="catalog-intro">
                <span className="section-eyebrow">DARI DAPUR KAMI</span>
                <h2>Menu yang bikin kembali</h2>
                <p>Pilihan hangat dan segar, disiapkan dengan bahan pilihan.</p>
              </div>
              <SearchBar
                search={search}
                setSearch={setSearch}
                placeholder="Cari makanan atau minuman favoritmu..."
              />

              <CategoryPills
                categories={categories}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
                totalProductsCount={products.length}
              />

              <div className="catalog-results-label">
                <span>{search || activeCategoryId ? `${filteredProducts.length} menu ditemukan` : 'Pilihan untukmu'}</span>
              </div>

              {isLoading ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '4rem 1rem',
                    color: 'var(--slate-400)'
                  }}
                >
                  <RefreshCw
                    size={32}
                    className="animate-spin"
                    style={{ margin: '0 auto 1rem' }}
                  />
                  <p>Memuat katalog produk...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="catalog-grid animate-fade-in">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectProduct={setSelectedProductForOrder}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="catalog-empty-state animate-fade-in">
                  <MessageCircle
                    size={48}
                    color="#94a3b8"
                    style={{ margin: '0 auto' }}
                  />
                  <h3 className="catalog-empty-title">
                    Menu Tidak Ditemukan
                  </h3>
                  <p className="catalog-empty-desc">
                    Tidak ada produk yang cocok dengan "{search}" pada kategori terpilih.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSearch('');
                      setActiveCategoryId('');
                    }}
                  >
                    Tampilkan Semua Menu
                  </button>
                </div>
              )}
            </section>

          {/* Customer Order Details Form Modal */}
          {(selectedProductForOrder || isCartOpen) && (
            <OrderModal
              product={selectedProductForOrder}
              cartItems={isCartOpen ? cartItems : undefined}
              onCartItemsChange={setCartItems}
              onOrderComplete={() => {
                if (isCartOpen) setCartItems([]);
              }}
              storeSettings={storeSettings}
              onClose={() => {
                setSelectedProductForOrder(null);
                setIsCartOpen(false);
              }}
            />
          )}

          {/* Public Footer */}
          <footer className="site-footer">
            <div className="container footer-main">
              <div className="footer-brand">
                <img src={storeSettings?.logo || DefaultLogo} alt="" />
                <div>
                  <strong>{storeSettings?.storeName || 'Cinnamix Coffee & Resto'}</strong>
                  <p>{storeSettings?.tagline || 'Rasa lokal, dibuat sepenuh hati.'}</p>
                </div>
              </div>
              <div className="footer-contact">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <Phone size={16} />
                  <span>WhatsApp: {storeSettings?.phone || '6281234567890'}</span>
                  <ArrowUpRight size={14} />
                </a>
                <p><MapPin size={16} /><span>{storeSettings?.address || 'Jakarta, Indonesia'}</span></p>
              </div>
            </div>
            <div className="container footer-bottom">
              <span>© {currentYear} {storeSettings?.storeName || 'Cinnamix Coffee & Resto'}</span>
              <span>Dibuat dengan rasa lokal.</span>
            </div>
          </footer>
        </main>
      </>
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={(user) => {
          setAdminUser(user);
          setIsAdminView(true);
        }}
      />
    </div>
  );
}

export default App;