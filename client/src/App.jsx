import React, { useState, useEffect } from 'react';
import {
  fetchProducts,
  fetchCategories,
  fetchStoreSettings,
  fetchAdminProfile,
  clearAuthToken,
  getAuthToken
} from './services/api';

import Header from './components/Header';
import { CategoryPills } from './components/CategoryPills';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { OrderModal } from './components/OrderModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Sparkles, MessageCircle, MapPin, Phone, RefreshCw } from 'lucide-react';

export function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState('*');
  const [search, setSearch] = useState('');
  const [selectedProductForOrder, setSelectedProductForOrder] = useState(null);

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

  // Filter products for Customer Catalog View
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      activeCategoryId === '*' ||
      p.categoryId === activeCategoryId;

    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(search.toLowerCase())) ||
      (p.categoryName &&
        p.categoryName.toLowerCase().includes(search.toLowerCase()));

    return matchesCat && matchesSearch;
  });

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
            onOpenLogin={() => setIsAdminLoginOpen(true)}
            onLogout={handleLogout}
          />

          <main className="customer-catalog-view animate-fade-in">
            {/* Hero Banner Section */}
            <section className="hero-banner">
              <div className="container">
                <span className="hero-badge">
                  <Sparkles size={14} />
                  <span>Pesan Cepat Tanpa Ribet Daftar Akun</span>
                </span>

                <h1 className="hero-title">
                  {storeSettings?.storeName || 'Toko Berkah Nusantara'}
                </h1>

                <p className="hero-desc">
                  {storeSettings?.tagline || 'Pilih menu makanan, minuman, dan camilan favoritmu. Klik pesan, lalu chat langsung dengan kami di WhatsApp!'}
                </p>
              </div>
            </section>

            <div className="container" style={{ paddingTop: '1.5rem' }}>
              {/* Search Bar */}
              <SearchBar
                search={search}
                setSearch={setSearch}
                placeholder="Cari menu lezat... (cth: Nasi Goreng, Ayam Bakar, Kopi)"
              />

              {/* Category Filter Pills (Makanan | Minuman | Camilan) */}
              <CategoryPills
                categories={categories}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
                totalProductsCount={products.length}
              />

              {/* Loading Skeleton */}
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
              /* Product Grid */
              <div className="catalog-grid animate-fade-in">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={setSelectedProductForOrder}
                  />
                ))}
              </div>
            ) : (
              /* Empty Search / Filter State */
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
                    setActiveCategoryId('*');
                  }}
                >
                  Tampilkan Semua Menu
                </button>
              </div>
            )}
          </div>

          {/* Customer Order Details Form Modal */}
          {selectedProductForOrder && (
            <OrderModal
              product={selectedProductForOrder}
              storeSettings={storeSettings}
              onClose={() => setSelectedProductForOrder(null)}
            />
          )}

          {/* Public Footer */}
          <footer
            style={{
              background: '#ffffff',
              borderTop: '1px solid var(--slate-200)',
              padding: '2.5rem 0',
              marginTop: '3rem'
            }}
          >
            <div
              className="container"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <strong>
                  {storeSettings?.storeName || 'Toko Berkah Nusantara'}
                </strong>

                <p
                  style={{
                    color: 'var(--slate-500)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    marginTop: '0.2rem'
                  }}
                >
                  <MapPin size={14} />
                  <span>
                    {storeSettings?.address || 'Jakarta, Indonesia'}
                  </span>
                </p>
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--slate-500)'
                }}
              >
                WhatsApp CS: <strong>{storeSettings?.phone || '6281234567890'}</strong>
              </div>
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