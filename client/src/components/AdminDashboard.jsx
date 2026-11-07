import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Package,
  Layers,
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  PhoneCall,
  Save,
  AlertCircle,
  Check,
  Store,
  LogOut,
  Database,
  ShoppingBag,
  RefreshCw,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  UserRound,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { ProductFormModal } from './ProductFormModal';
import { ConfirmModal } from './ConfirmModal';
import DefaultLogo from '../assets/Cinnamix Coffee and Cinnamon Logo.png';
import {
  createProduct,
  updateProduct,
  toggleProductStock,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchOrders,
  resetOrderStatuses,
  confirmOrder,
  deleteConfirmedOrder,
  updateStoreSettings,
  uploadStoreLogo,
  updateAdminProfile,
  updateAdminPassword
} from '../services/api';

export const AdminDashboard = ({
  products,
  categories,
  storeSettings,
  adminUser,
  onRefreshData,
  onBackToCatalog,
  onLogout,
  onProfileUpdated
}) => {
  const [activeTab, setActiveTab] = useState('products');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [confirmingOrderId, setConfirmingOrderId] = useState('');
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState('');

  // Product states
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Category states
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [catError, setCatError] = useState('');

  // Settings states
  const [settingsForm, setSettingsForm] = useState({});
  const currentSettingsForm = {
    storeName: settingsForm.storeName ?? storeSettings?.storeName ?? '',
    tagline: settingsForm.tagline ?? storeSettings?.tagline ?? '',
    phone: settingsForm.phone ?? storeSettings?.phone ?? '',
    address: settingsForm.address ?? storeSettings?.address ?? ''
  };
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: adminUser?.name || '',
    email: adminUser?.email || '',
    currentPassword: ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoError, setLogoError] = useState('');
  const [logoSuccess, setLogoSuccess] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoPreviewUrl = useRef(null);
  const [visiblePasswords, setVisiblePasswords] = useState({
    profileCurrent: false,
    passwordCurrent: false,
    passwordNew: false,
    passwordConfirm: false
  });

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((visible) => ({ ...visible, [field]: !visible[field] }));
  };

  useEffect(() => () => {
    if (logoPreviewUrl.current) URL.revokeObjectURL(logoPreviewUrl.current);
  }, []);

  const handleConfirmOrder = async (orderId) => {
    setConfirmingOrderId(orderId);
    setOrdersError('');
    try {
      await confirmOrder(orderId);
      await loadOrders();
    } catch (error) {
      setOrdersError(error.message || 'Pesanan gagal dikonfirmasi.');
    } finally {
      setConfirmingOrderId('');
    }
  };

  const handleDeleteConfirmedOrder = async () => {
    if (!deletingOrder || deletingOrderId) return;

    setDeletingOrderId(deletingOrder.id);
    setOrdersError('');
    try {
      await deleteConfirmedOrder(deletingOrder.id);
      setDeletingOrder(null);
      await loadOrders();
    } catch (error) {
      setOrdersError(error.message || 'Pesanan gagal dihapus.');
    } finally {
      setDeletingOrderId('');
    }
  };

  const pendingOrderCount = orders.filter((order) => order.status !== 'Telah dikonfirmasi').length;

  const handleRefreshOrders = async () => {
    setIsLoadingOrders(true);
    setOrdersError('');
    try {
      await resetOrderStatuses();
      await loadOrders();
    } catch (error) {
      setOrdersError(error.message || 'Status pesanan gagal direset.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetchOrders();
      setOrders(response.data || []);
      setOrdersError('');
    } catch (error) {
      setOrdersError(error.message || 'Daftar pesanan gagal dimuat.');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const refreshInterval = window.setInterval(loadOrders, 30000);
    return () => window.clearInterval(refreshInterval);
  }, [loadOrders]);

  // Currency Formatter
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Filter products for admin table
  const filteredProducts = products.filter((p) => {
    const matchesCat = !productCategoryFilter || p.categoryId === productCategoryFilter;
    const matchesSearch = !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Stock counts
  const totalCount = products.length;
  const availableCount = products.filter((p) => p.stockStatus === 'Tersedia').length;
  const outCount = totalCount - availableCount;

  // --- Handlers: Product Management ---
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (payload, id) => {
    if (id) {
      await updateProduct(id, payload);
    } else {
      await createProduct(payload);
    }
    await onRefreshData();
  };

  const handleToggleStock = async (id) => {
    try {
      await toggleProductStock(id);
      await onRefreshData();
    } catch (err) {
      alert(`Gagal mengubah stok: ${err.message}`);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      await onRefreshData();
    } catch (err) {
      alert(`Gagal menghapus produk: ${err.message}`);
    }
  };

  // --- Handlers: Category Management ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    if (!newCatName.trim()) return;

    try {
      await createCategory(newCatName.trim());
      setNewCatName('');
      await onRefreshData();
    } catch (err) {
      setCatError(err.message);
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setCatError('');
  };

  const handleSaveEditCategory = async (id) => {
    if (!editCatName.trim()) return;
    try {
      await updateCategory(id, editCatName.trim());
      setEditingCategory(null);
      await onRefreshData();
    } catch (err) {
      setCatError(err.message);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      await onRefreshData();
    } catch (err) {
      alert(err.message);
      setDeletingCategory(null);
    }
  };

  // --- Handlers: Store Settings ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateStoreSettings({ ...currentSettingsForm, ...settingsForm });
      setSettingsForm({});
      setSettingsSuccess(true);
      await onRefreshData();
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      alert(`Gagal menyimpan pengaturan: ${err.message}`);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    setIsSavingProfile(true);
    try {
      const response = await updateAdminProfile({
        name: profileForm.name,
        email: profileForm.email,
        currentPassword: profileForm.currentPassword
      });

      onProfileUpdated?.(response.user);
      setProfileForm({
        name: response.user.name,
        email: response.user.email,
        currentPassword: ''
      });
      setProfileSuccess('Profil akun admin berhasil diperbarui.');
    } catch (err) {
      setProfileError(err.message || 'Gagal memperbarui profil akun.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    setLogoError('');
    setLogoSuccess('');
    if (!file) return;

    setLogoFile(null);
    setLogoPreview('');
    if (logoPreviewUrl.current) URL.revokeObjectURL(logoPreviewUrl.current);
    logoPreviewUrl.current = null;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExtension = /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) || !allowedExtension) {
      setLogoError('Format logo harus JPG, PNG, WEBP, atau GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Ukuran logo maksimal 5 MB.');
      return;
    }

    logoPreviewUrl.current = URL.createObjectURL(file);
    setLogoPreview(logoPreviewUrl.current);
    setLogoFile(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setLogoError('');
    setLogoSuccess('');
    setIsUploadingLogo(true);
    try {
      const response = await uploadStoreLogo(logoFile);
      setLogoFile(null);
      setLogoPreview('');
      if (logoPreviewUrl.current) URL.revokeObjectURL(logoPreviewUrl.current);
      logoPreviewUrl.current = null;
      await onRefreshData();
      setLogoSuccess(response.message || 'Logo katalog berhasil diperbarui.');
    } catch (err) {
      setLogoError(err.message || 'Gagal memperbarui logo katalog.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await updateAdminPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(response.message || 'Password berhasil diperbarui.');
    } catch (err) {
      setPasswordError(err.message || 'Gagal memperbarui password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="admin-sidebar-layout animate-fade-in">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpenMobile && (
        <div
          className="sidebar-backdrop-mobile"
          onClick={() => setIsSidebarOpenMobile(false)}
        />
      )}

      {/* ===========================================================
          ADMIN SIDEBAR NAVIGATION
         =========================================================== */}
      <aside className={`admin-sidebar ${isSidebarOpenMobile ? 'open' : ''}`}>
        {/* Sidebar Header / Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <img
              src={storeSettings?.logo || DefaultLogo}
              alt={`Logo ${storeSettings?.storeName || 'KatalogWA'}`}
            />
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">{storeSettings?.storeName || 'KatalogWA'}</div>
            <div className="sidebar-brand-badge">{storeSettings?.tagline || 'Admin Back-Office'}</div>
          </div>
          <button
            className="sidebar-close-mobile"
            onClick={() => setIsSidebarOpenMobile(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Database Status Indicator */}
        <div className="sidebar-db-badge">
          <Database size={13} className="text-emerald" />
          <span>Database: <strong>SQLite (SQL)</strong></span>
          <span className="db-live-dot"></span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">Menu Utama</div>

          <button
            className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('products');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-products"
          >
            <Package size={18} />
            <span className="nav-item-label">Manajemen Produk</span>
            <span className="nav-badge-count">{totalCount}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('categories');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-categories"
          >
            <Layers size={18} />
            <span className="nav-item-label">Manajemen Kategori</span>
            <span className="nav-badge-count">{categories.length}</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('orders');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-orders"
          >
            <ShoppingBag size={18} />
            <span className="nav-item-label">Pesanan Masuk</span>
            <span className="nav-badge-count" title={`${pendingOrderCount} pesanan belum dikonfirmasi`}>
              {pendingOrderCount}
            </span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-settings"
          >
            <Settings size={18} />
            <span className="nav-item-label">Pengaturan Toko & WA</span>
          </button>

          <button
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setIsSidebarOpenMobile(false);
            }}
            id="sidebar-link-profile"
          >
            <UserRound size={18} />
            <span className="nav-item-label">Edit Profil Admin</span>
          </button>

          <div className="nav-section-title" style={{ marginTop: '1.25rem' }}>Akses Cepat</div>

          <button
            className="sidebar-nav-item nav-item-ghost"
            onClick={onBackToCatalog}
            id="sidebar-link-view-catalog"
          >
            <Store size={18} />
            <span className="nav-item-label">Lihat Katalog Pelanggan</span>
            <ChevronRight size={14} className="nav-arrow" />
          </button>
        </nav>

        {/* Sidebar Footer User Info & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar">
              <ShieldCheck size={18} color="#10b981" />
            </div>
            <div className="user-info">
              <strong className="user-name">{adminUser?.name || 'Store Owner'}</strong>
              <span className="user-email">{adminUser?.email || 'admin@katalogwa.com'}</span>
            </div>
          </div>

          <button
            className="sidebar-logout-btn"
            onClick={onLogout}
            id="sidebar-logout-btn"
            title="Keluar dari sesi admin"
          >
            <LogOut size={16} />
            <span>Logout Sesi</span>
          </button>
        </div>
      </aside>

      {/* ===========================================================
          MAIN VIEWPORT CONTENT
         =========================================================== */}
      <div className="admin-main-viewport">
        {/* Top Navbar */}
        <header className="viewport-top-bar">
          <div className="top-bar-left">
            <button
              className="mobile-hamburger-btn"
              onClick={() => setIsSidebarOpenMobile(true)}
              title="Buka menu navigasi"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="viewport-title">
                {activeTab === 'products' && 'Manajemen Produk Katalog'}
                {activeTab === 'categories' && 'Manajemen Kategori'}
                {activeTab === 'orders' && 'Informasi Pembelian'}
                {activeTab === 'settings' && 'Pengaturan Toko & Nomor WhatsApp'}
                {activeTab === 'profile' && 'Edit Profil Admin'}
              </h2>
              <span className="viewport-breadcrumb">
                Admin Panel / {
                  activeTab === 'products' ? 'Produk'
                    : activeTab === 'categories' ? 'Kategori'
                      : activeTab === 'orders' ? 'Pesanan Masuk'
                        : activeTab === 'settings' ? 'Pengaturan Toko'
                          : 'Profil Admin'
                }
              </span>
            </div>
          </div>

          <div className="top-bar-right">
            <button className="btn btn-secondary btn-sm" onClick={onBackToCatalog}>
              <Store size={15} />
              <span>Katalog Publik</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="viewport-content-container">
          {/* Metrics Summary Strip */}
          <div className="metrics-grid" style={{ marginBottom: '1.75rem' }}>
            <div className="metric-card">
              <div className="metric-icon-box bg-emerald">
                <Package size={22} color="#059669" />
              </div>
              <div>
                <span className="metric-label">Total Produk</span>
                <h3 className="metric-value">{totalCount}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-green">
                <CheckCircle size={22} color="#10b981" />
              </div>
              <div>
                <span className="metric-label">Produk Tersedia</span>
                <h3 className="metric-value text-emerald">{availableCount}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-red">
                <XCircle size={22} color="#ef4444" />
              </div>
              <div>
                <span className="metric-label">Stok Habis</span>
                <h3 className="metric-value text-danger">{outCount}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-slate">
                <Layers size={22} color="#475569" />
              </div>
              <div>
                <span className="metric-label">Total Kategori</span>
                <h3 className="metric-value">{categories.length}</h3>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box bg-emerald">
                <ShoppingBag size={22} color="#059669" />
              </div>
              <div>
                <span className="metric-label">Pesanan Masuk</span>
                <h3 className="metric-value">{orders.length}</h3>
              </div>
            </div>
          </div>

          {activeTab === 'orders' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="table-controls-bar">
                <p className="box-subtitle" style={{ margin: 0 }}>
                  Tombol Perbarui Pesanan mengembalikan status seluruh pesanan ke Menunggu konfirmasi. Data pesanan dan catatan pelanggan tetap tersimpan.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleRefreshOrders}
                  disabled={isLoadingOrders}
                >
                  <RefreshCw size={16} />
                  <span>{isLoadingOrders ? 'Memuat...' : 'Perbarui Pesanan'}</span>
                </button>
              </div>

              {ordersError && (
                <div className="form-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={18} />
                  <span>{ordersError}</span>
                </div>
              )}

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Waktu / Status</th>
                      <th>Pemesan</th>
                      <th>Produk</th>
                      <th>Alamat Pengiriman</th>
                      <th>Catatan Khusus</th>
                      <th>Total</th>
                      <th>Status / Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingOrders && orders.length === 0 ? (
                      <tr><td colSpan="7" className="table-empty-cell">Memuat daftar pesanan...</td></tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="table-empty-cell">
                          Belum ada pesanan masuk. Pesanan pelanggan akan tampil di sini setelah dikirim.
                        </td>
                      </tr>
                    ) : orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{new Date(`${order.createdAt.replace(' ', 'T')}Z`).toLocaleString('id-ID')}</strong>
                        </td>
                        <td><strong>{order.customerName}</strong></td>
                        <td>
                          <ul className="order-items-list">
                            {order.items.map((item) => (
                              <li key={item.productId}>
                                {item.name} × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>{order.deliveryAddress || '—'}</td>
                        <td>{order.specialNotes || '—'}</td>
                        <td><strong className="table-product-price">{formatRupiah(order.totalPrice)}</strong></td>
                        <td>
                          <span className={`order-status-badge ${order.status === 'Telah dikonfirmasi' ? 'confirmed' : ''}`}>
                            {order.status}
                          </span>
                          {order.confirmedAt && (
                            <small className="order-confirmed-time">
                              {new Date(`${order.confirmedAt.replace(' ', 'T')}Z`).toLocaleString('id-ID')}
                            </small>
                          )}
                          {order.status !== 'Telah dikonfirmasi' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm order-confirm-btn"
                              onClick={() => handleConfirmOrder(order.id)}
                              disabled={confirmingOrderId === order.id}
                            >
                              <CheckCircle size={15} />
                              <span>{confirmingOrderId === order.id ? 'Menyimpan...' : 'Tandai telah dikonfirmasi'}</span>
                            </button>
                          )}
                          {order.status === 'Telah dikonfirmasi' && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm order-confirm-btn"
                              onClick={() => setDeletingOrder(order)}
                              disabled={deletingOrderId === order.id}
                            >
                              <Trash2 size={15} />
                              <span>Hapus Pesanan</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===========================================================
              MODULE 1: PRODUCT MANAGEMENT
             =========================================================== */}
          {activeTab === 'products' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="table-controls-bar">
                <div className="table-search-group">
                  <div className="search-input-wrapper" style={{ width: '280px' }}>
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Cari nama produk..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-select filter-select"
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleOpenAddProduct}
                  id="btn-add-product"
                >
                  <Plus size={18} />
                  <span>+ Tambah Produk</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Foto</th>
                      <th>Nama & Deskripsi</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th style={{ textAlign: 'center' }}>Status Stok (Saklar)</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty-cell">
                          Tidak ada produk yang cocok dengan pencarian / filter SQL.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => {
                        const isAvailable = prod.stockStatus === 'Tersedia';
                        return (
                          <tr key={prod.id} className={!isAvailable ? 'row-out-of-stock' : ''}>
                            {/* Image */}
                            <td style={{ width: '64px' }}>
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="table-product-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                                }}
                              />
                            </td>

                            {/* Name & Desc */}
                            <td>
                              <strong className="table-product-name">{prod.name}</strong>
                              {prod.description && (
                                <p className="table-product-desc">{prod.description}</p>
                              )}
                            </td>

                            {/* Category */}
                            <td>
                              <span className="badge badge-category">
                                {prod.categoryName}
                              </span>
                            </td>

                            {/* Price */}
                            <td>
                              <strong className="table-product-price">
                                {formatRupiah(prod.price)}
                              </strong>
                            </td>

                            {/* Toggle Stock Switch */}
                            <td style={{ textAlign: 'center' }}>
                              <div className="stock-toggle-cell">
                                <label className="switch" title="Ubah status ketersediaan stok di SQL database">
                                  <input
                                    type="checkbox"
                                    checked={isAvailable}
                                    onChange={() => handleToggleStock(prod.id)}
                                  />
                                  <span className="slider"></span>
                                </label>
                                <span className={`stock-text-status ${isAvailable ? 'text-emerald' : 'text-danger'}`}>
                                  {prod.stockStatus}
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <div className="table-actions-group">
                                <button
                                  className="btn-icon"
                                  onClick={() => handleOpenEditProduct(prod)}
                                  title="Edit Produk"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  className="btn-icon btn-icon-danger"
                                  onClick={() => setDeletingProduct(prod)}
                                  title="Hapus Produk"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===========================================================
              MODULE 2: CATEGORY MANAGEMENT
             =========================================================== */}
          {activeTab === 'categories' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="category-manager-grid">
                {/* Form Add Category */}
                <div className="card-box">
                  <h3 className="box-title">Tambah Kategori Baru</h3>
                  <p className="box-subtitle">
                    Kategori tersimpan di tabel SQL <code>categories</code> dan tampil sebagai tombol filter pill di katalog pelanggan.
                  </p>

                  {catError && (
                    <div className="form-alert-error" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={16} />
                      <span>{catError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddCategory}>
                    <div className="form-group">
                      <label className="form-label">Nama Kategori</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="cth: Paket Hemat, Minuman Boba..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                      <Plus size={16} />
                      <span>Tambah Kategori ke Database SQL</span>
                    </button>
                  </form>
                </div>

                {/* List of Categories */}
                <div className="card-box">
                  <h3 className="box-title">Daftar Kategori ({categories.length})</h3>
                  <div className="category-items-list">
                    {categories.map((cat) => (
                      <div key={cat.id} className="category-item-row">
                        {editingCategory?.id === cat.id ? (
                          <div className="category-inline-edit">
                            <input
                              type="text"
                              className="form-input"
                              value={editCatName}
                              onChange={(e) => setEditCatName(e.target.value)}
                              autoFocus
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveEditCategory(cat.id)}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingCategory(null)}
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="cat-name-info">
                              <strong>{cat.name}</strong>
                              <span className="badge badge-category" style={{ fontSize: '0.75rem' }}>
                                {cat.productCount || 0} Produk Terdaftar
                              </span>
                            </div>

                            <div className="cat-actions">
                              <button
                                className="btn-icon"
                                onClick={() => handleStartEditCategory(cat)}
                                title="Ubah Nama"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                className="btn-icon btn-icon-danger"
                                onClick={() => setDeletingCategory(cat)}
                                title="Hapus Kategori"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===========================================================
              MODULE 3: STORE SETTINGS
             =========================================================== */}
          {activeTab === 'settings' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="card-box" style={{ maxWidth: '640px' }}>
                <h3 className="box-title">Pengaturan Profil & WhatsApp Toko</h3>
                <p className="box-subtitle">
                  Konfigurasi disimpan di tabel SQL <code>settings</code>. Digunakan untuk redirect WhatsApp pesanan pelanggan.
                </p>

                {settingsSuccess && (
                  <div className="form-alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <Check size={18} />
                    <span>Pengaturan toko berhasil diperbarui ke database SQL!</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings}>
                  <div className="form-group">
                    <label className="form-label">Nama Bisnis / Toko</label>
                    <input
                      type="text"
                      className="form-input"
                      value={currentSettingsForm.storeName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-store-tagline">Tagline / keterangan katalog</label>
                    <input
                      id="admin-store-tagline"
                      type="text"
                      className="form-input"
                      value={currentSettingsForm.tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                      maxLength={160}
                    />
                    <small style={{ color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                      Keterangan ini ditampilkan di identitas dashboard admin dan katalog pelanggan.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <PhoneCall size={15} />
                      <span>Nomor WhatsApp Tujuan (Gunakan kode negara, cth: 6281234567890)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="6281234567890"
                      value={currentSettingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      required
                    />
                    <small style={{ color: 'var(--slate-500)', marginTop: '0.2rem' }}>
                      Nomor ini yang akan menerima chat otomatis saat pelanggan mengklik "Kirim Pesanan ke WhatsApp".
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alamat Toko</label>
                    <textarea
                      rows="2"
                      className="form-textarea"
                      value={currentSettingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                    <Save size={16} />
                    <span>Simpan Pengaturan ke SQL</span>
                  </button>
                </form>

                <hr style={{ margin: '1.75rem 0', border: 0, borderTop: '1px solid var(--slate-200)' }} />

                <h3 className="box-title">Logo Katalog</h3>
                <p className="box-subtitle">
                  Logo ditampilkan di dashboard admin serta header dan footer katalog. Format JPG, PNG, WEBP, atau GIF, maksimal 5 MB.
                </p>

                {logoError && (
                  <div className="form-alert-error animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={18} />
                    <span>{logoError}</span>
                  </div>
                )}
                {logoSuccess && (
                  <div className="form-alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <Check size={18} />
                    <span>{logoSuccess}</span>
                  </div>
                )}

                <div className="store-logo-editor">
                  <div className="store-logo-preview">
                    <img
                      src={logoPreview || storeSettings?.logo || DefaultLogo}
                      alt="Pratinjau logo katalog"
                    />
                  </div>
                  <div className="store-logo-controls">
                    <label className="form-label" htmlFor="admin-store-logo">
                      <ImageIcon size={15} />
                      <span>Pilih logo baru</span>
                    </label>
                    <input
                      id="admin-store-logo"
                      type="file"
                      className="form-input"
                      accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleLogoFileChange}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: '0.5rem' }}
                      onClick={handleUploadLogo}
                      disabled={!logoFile || isUploadingLogo}
                    >
                      <Upload size={16} />
                      <span>{isUploadingLogo ? 'Mengunggah...' : 'Simpan Logo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="admin-tab-content animate-fade-in">
              <div className="card-box" style={{ maxWidth: '640px' }}>
                <h3 className="box-title">Edit Profil Akun Admin</h3>
                <p className="box-subtitle">
                  Perbarui nama pengguna dan email. Masukkan password saat ini untuk mengonfirmasi perubahan.
                </p>

                {profileError && (
                  <div className="form-alert-error animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={18} />
                    <span>{profileError}</span>
                  </div>
                )}
                {profileSuccess && (
                  <div className="form-alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <Check size={18} />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-profile-name">Nama pengguna</label>
                    <input
                      id="admin-profile-name"
                      type="text"
                      className="form-input"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      autoComplete="name"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-profile-email">Email</label>
                    <input
                      id="admin-profile-email"
                      type="email"
                      className="form-input"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-profile-current-password">
                      Password saat ini untuk konfirmasi
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        id="admin-profile-current-password"
                        type={visiblePasswords.profileCurrent ? 'text' : 'password'}
                        className="form-input"
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="password-visibility-toggle"
                        onClick={() => togglePasswordVisibility('profileCurrent')}
                        aria-label={visiblePasswords.profileCurrent ? 'Sembunyikan password' : 'Lihat password'}
                        aria-pressed={visiblePasswords.profileCurrent}
                      >
                        {visiblePasswords.profileCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem' }}
                    disabled={isSavingProfile}
                  >
                    <Save size={16} />
                    <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
                  </button>
                </form>

                <hr style={{ margin: '1.75rem 0', border: 0, borderTop: '1px solid var(--slate-200)' }} />

                <h3 className="box-title">Ganti Password</h3>
                <p className="box-subtitle">
                  Untuk keamanan, masukkan password saat ini dan konfirmasi password baru.
                </p>

                {passwordError && (
                  <div className="form-alert-error animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={18} />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="form-alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>
                    <Check size={18} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSavePassword}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="admin-password-current">
                      Password saat ini
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        id="admin-password-current"
                        type={visiblePasswords.passwordCurrent ? 'text' : 'password'}
                        className="form-input"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className="password-visibility-toggle"
                        onClick={() => togglePasswordVisibility('passwordCurrent')}
                        aria-label={visiblePasswords.passwordCurrent ? 'Sembunyikan password' : 'Lihat password'}
                        aria-pressed={visiblePasswords.passwordCurrent}
                      >
                        {visiblePasswords.passwordCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="admin-password-new">Password baru</label>
                      <div className="password-input-wrapper">
                        <input
                          id="admin-password-new"
                          type={visiblePasswords.passwordNew ? 'text' : 'password'}
                          className="form-input"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          autoComplete="new-password"
                          minLength={8}
                          maxLength={72}
                          required
                        />
                        <button
                          type="button"
                          className="password-visibility-toggle"
                          onClick={() => togglePasswordVisibility('passwordNew')}
                          aria-label={visiblePasswords.passwordNew ? 'Sembunyikan password' : 'Lihat password'}
                          aria-pressed={visiblePasswords.passwordNew}
                        >
                          {visiblePasswords.passwordNew ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="admin-password-confirm">
                        Konfirmasi password baru
                      </label>
                      <div className="password-input-wrapper">
                        <input
                          id="admin-password-confirm"
                          type={visiblePasswords.passwordConfirm ? 'text' : 'password'}
                          className="form-input"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          autoComplete="new-password"
                          minLength={8}
                          maxLength={72}
                          required
                        />
                        <button
                          type="button"
                          className="password-visibility-toggle"
                          onClick={() => togglePasswordVisibility('passwordConfirm')}
                          aria-label={visiblePasswords.passwordConfirm ? 'Sembunyikan password' : 'Lihat password'}
                          aria-pressed={visiblePasswords.passwordConfirm}
                        >
                          {visiblePasswords.passwordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <small style={{ display: 'block', color: 'var(--slate-500)', marginBottom: '1rem' }}>
                    Password baru minimal 8 karakter dan maksimal 72 byte.
                  </small>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ marginTop: '0.5rem' }}
                    disabled={isSavingPassword}
                  >
                    <Save size={16} />
                    <span>{isSavingPassword ? 'Menyimpan...' : 'Perbarui Password'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Form Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        categories={categories}
      />

      {/* Confirm Delete Product Modal */}
      <ConfirmModal
        isOpen={!!deletingProduct}
        title="Hapus Produk Ini?"
        message={`Apakah Anda yakin ingin menghapus "${deletingProduct?.name}" dari database SQL? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setDeletingProduct(null)}
        confirmText="Hapus Produk"
      />

      {/* Confirm Delete Category Modal */}
      <ConfirmModal
        isOpen={!!deletingCategory}
        title="Hapus Kategori Ini?"
        message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}" dari database SQL?`}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
        confirmText="Hapus Kategori"
      />

      <ConfirmModal
        isOpen={!!deletingOrder}
        title="Hapus Pesanan Ini?"
        message={`Apakah Anda yakin ingin menghapus pesanan dari "${deletingOrder?.customerName}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDeleteConfirmedOrder}
        onCancel={() => setDeletingOrder(null)}
        confirmText={deletingOrderId ? 'Menghapus...' : 'Hapus Pesanan'}
        isProcessing={!!deletingOrderId}
      />
    </div>
  );
};