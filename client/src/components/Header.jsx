import React, { useEffect, useState } from 'react';
import { CircleHelp, MessageCircle, Lock, LogOut, LayoutDashboard, Store, ShoppingCart, X, ClipboardList, RefreshCw, Trash2 } from 'lucide-react';

import DefaultLogo from '../assets/Cinnamix Coffee and Cinnamon Logo.png';
import { fetchCustomerOrders } from '../services/api';
import { ConfirmModal } from './ConfirmModal';

export const Header = ({
  storeSettings,
  isAdminView,
  setIsAdminView,
  adminUser,
  cartItemCount = 0,
  onOpenCart,
  onOpenLogin,
  onLogout,
  orderIds = [],
  orderHistoryWarning = '',
  onOrderDeleted
}) => {
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [orderHistoryError, setOrderHistoryError] = useState('');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [isDeleteAllHistoryOpen, setIsDeleteAllHistoryOpen] = useState(false);
  const storePhone = (storeSettings?.phone || '6281234567890').replace(/[^0-9]/g, '');
  const storeName = storeSettings?.storeName || 'Cinnamix Coffee & Resto';
  const whatsappUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(
    `Halo ${storeName}, saya ingin bertanya tentang katalog.`
  )}`;

  useEffect(() => {
    if (!isFaqOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsFaqOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFaqOpen]);

  useEffect(() => {
    if (!isOrderHistoryOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOrderHistoryOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOrderHistoryOpen]);

  useEffect(() => {
    let isCancelled = false;
    const loadHistory = (showLoading) => {
      if (showLoading) setIsLoadingHistory(true);
      setOrderHistoryError('');
      fetchCustomerOrders(orderIds)
        .then((response) => {
          if (!isCancelled) {
            setCustomerOrders(response.data || []);
            setHasLoadedHistory(true);
          }
        })
        .catch((error) => {
          if (!isCancelled) setOrderHistoryError(error.message || 'Riwayat pesanan gagal dimuat.');
        })
        .finally(() => {
          if (!isCancelled && showLoading) setIsLoadingHistory(false);
        });
    };

    loadHistory(isOrderHistoryOpen);
    const refreshInterval = isOrderHistoryOpen
        ? window.setInterval(() => loadHistory(false), 30000)
        : null;

    return () => {
        isCancelled = true;
        if (refreshInterval !== null) window.clearInterval(refreshInterval);
    };
  }, [isOrderHistoryOpen, orderIds, historyRefreshKey]);

  const formatOrderDate = (date) => (
    date ? new Date(`${date.replace(' ', 'T')}Z`).toLocaleString('id-ID') : '—'
  );
  const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
  const orderHistoryCount = hasLoadedHistory ? customerOrders.length : orderIds.length;

  const handleDeleteCustomerOrder = () => {
    if (!deletingOrder) return;

    setOrderHistoryError('');
    onOrderDeleted?.(deletingOrder.id);
    setCustomerOrders((orders) => orders.filter((order) => order.id !== deletingOrder.id));
    setDeletingOrder(null);
  };

  const handleDeleteAllCustomerOrders = () => {
    setOrderHistoryError('');
    const completedOrderIds = customerOrders
      .filter((order) => order.status === 'Selesai')
      .map((order) => order.id);
    if (completedOrderIds.length === 0) return;

    onOrderDeleted?.(completedOrderIds);
    setCustomerOrders((orders) => orders.filter((order) => order.status !== 'Selesai'));
    setIsDeleteAllHistoryOpen(false);
  };

  return (
    <>
      <header className="site-header">
      <div className="container header-container">
        <a
          className="brand-group"
          href="#beranda"
          aria-label="Kembali ke beranda"
        >
          <div className="logo-brand">
            <img
              src={storeSettings?.logo || DefaultLogo}
              width={44}
              height={44}
              alt={`Logo ${storeSettings?.storeName || 'Cinnamix Coffee and Cinnamon'}`}
            />
          </div>
          <div className="brand-info">
            <span className="brand-name">{storeSettings?.storeName || 'Cinnamix Coffee & Resto'}</span>
            <span className="store-subtext">{storeSettings?.tagline ?? 'Coffee • Resto • Lokal'}</span>
          </div>
        </a>

        <nav className="header-nav" aria-label="Navigasi utama">
          <a className="header-nav-link" href="#beranda">Beranda</a>
          <a className="header-nav-link" href="#menu">Menu</a>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm header-history-btn"
            onClick={() => setIsOrderHistoryOpen(true)}
            aria-label={`Buka riwayat pesanan, ${orderHistoryCount} pesanan`}
            title="Riwayat Pesanan"
          >
            <ClipboardList size={16} />
            <span>Riwayat</span>
            <span className="header-cart-count">{orderHistoryCount}</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary header-cart-btn"
            onClick={onOpenCart}
            disabled={cartItemCount === 0}
            aria-label={`Buka keranjang, ${cartItemCount} item`}
            title="Buka keranjang"
          >
            <ShoppingCart size={17} />
            <span className="header-cart-label">Keranjang</span>
            <span className="header-cart-count">{cartItemCount}</span>
          </button>
          <button
            type="button"
            className="btn btn-wa header-order-btn"
            onClick={() => setIsFaqOpen(true)}
            aria-label="Buka FAQ toko"
            title="FAQ Toko"
          >
            <CircleHelp size={17} />
            <span>FAQ Toko</span>
          </button>
          {adminUser ? (
            <div className="admin-status-bar">
              {isAdminView ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAdminView(false)}
                  aria-label="Kembali ke tampilan pelanggan"
                  title="Kembali ke tampilan pelanggan"
                >
                  <Store size={16} />
                  <span>Lihat Katalog</span>
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsAdminView(true)}
                  aria-label="Buka panel admin"
                  title="Buka panel admin"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard Admin</span>
                </button>
              )}

              <button
                className="btn btn-danger-soft btn-sm"
                onClick={onLogout}
                aria-label="Keluar dari akun admin"
                title="Keluar dari akun admin"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary btn-sm admin-login-btn"
              onClick={onOpenLogin}
              id="admin-login-trigger"
              aria-label="Login Admin"
            >
              <Lock size={16} />
              <span>Login Admin</span>
            </button>
          )}
        </div>
      </div>
      </header>

      {isOrderHistoryOpen && (
        <div className="modal-backdrop" onClick={() => setIsOrderHistoryOpen(false)}>
          <section
            className="modal-content animate-slide-up order-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-order-history-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h2 className="modal-title" id="customer-order-history-title">Riwayat Pesanan</h2>
                <p className="modal-subtitle">Riwayat tersimpan di browser ini. Status berubah menjadi Selesai setelah dikonfirmasi admin.</p>
              </div>
              <div className="order-history-header-actions">
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setHistoryRefreshKey((key) => key + 1)}
                  title="Muat ulang riwayat"
                  aria-label="Muat ulang riwayat pesanan"
                  disabled={isLoadingHistory}
                >
                  <RefreshCw size={17} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setIsOrderHistoryOpen(false)}
                  title="Tutup riwayat"
                  aria-label="Tutup riwayat pesanan"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="modal-body customer-order-history">
              {orderHistoryWarning && <p className="order-history-note" role="status">{orderHistoryWarning}</p>}
              {orderHistoryError && <p className="form-alert-error" role="alert">{orderHistoryError}</p>}
              {customerOrders.some((order) => order.status === 'Selesai') && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-danger-soft btn-sm"
                    onClick={() => setIsDeleteAllHistoryOpen(true)}
                    disabled={isLoadingHistory}
                  >
                    <Trash2 size={15} />
                    <span>Hapus Semua Riwayat Selesai</span>
                  </button>
                </div>
              )}
              {isLoadingHistory ? (
                <p className="order-history-empty">Memuat riwayat pesanan...</p>
              ) : customerOrders.length === 0 ? (
                <p className="order-history-empty">Belum ada riwayat pesanan pada browser ini.</p>
              ) : customerOrders.map((order) => (
                <article className="customer-order-card" key={order.id}>
                  <div className="customer-order-card-heading">
                    <div>
                      <strong>{formatOrderDate(order.createdAt)}</strong>
                      <small>Pesanan atas nama {order.customerName}</small>
                    </div>
                    <span className={`order-status-badge ${order.status === 'Selesai' ? 'confirmed' : ''}`}>
                      {order.status}
                    </span>
                  </div>
                  <ul className="order-items-list">
                    {order.items.map((item) => (
                      <li key={item.productId}>{item.name} × {item.quantity}</li>
                    ))}
                  </ul>
                  <div className="customer-order-card-footer">
                    <strong>{formatRupiah(order.totalPrice)}</strong>
                    <div className="customer-order-card-actions">
                      {order.confirmedAt && <small>Selesai: {formatOrderDate(order.confirmedAt)}</small>}
                      {order.status === 'Selesai' && (
                        <button
                          type="button"
                          className="btn btn-danger-soft btn-sm order-history-delete-btn"
                          onClick={() => setDeletingOrder(order)}
                        >
                          <Trash2 size={15} />
                          <span>Hapus Riwayat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {isFaqOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsFaqOpen(false)}
        >
          <section
            className="modal-content animate-slide-up faq-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-faq-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <h2 className="modal-title" id="store-faq-title">FAQ Toko</h2>
                <p className="modal-subtitle">Pertanyaan umum tentang {storeName}</p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setIsFaqOpen(false)}
                title="Tutup FAQ"
                aria-label="Tutup FAQ"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body faq-list">
              <details className="faq-item" open>
                <summary>Bagaimana cara memesan?</summary>
                <p>Pilih menu yang diinginkan lalu tambahkan ke keranjang. Buka keranjang, isi nama dan catatan atau alamat, kemudian kirim pesanan melalui WhatsApp toko.</p>
              </details>
              <details className="faq-item">
                <summary>Di mana saya bisa melihat harga dan ketersediaan menu?</summary>
                <p>Harga dan status ketersediaan ditampilkan pada setiap menu di katalog. Silakan hubungi toko melalui WhatsApp untuk memastikan informasi terbaru sebelum memesan.</p>
              </details>
              <details className="faq-item">
                <summary>Bagaimana informasi pembayaran dan pengantaran?</summary>
                <p>Konfirmasikan metode pembayaran, biaya, dan jangkauan pengantaran langsung kepada toko melalui WhatsApp saat membuat pesanan.</p>
              </details>
              <details className="faq-item">
                <summary>Bagaimana cara mengetahui jam operasional?</summary>
                <p>Hubungi toko melalui WhatsApp untuk menanyakan jam operasional dan waktu pemesanan yang tersedia.</p>
              </details>
            </div>

            <div className="modal-footer">
              <a
                className="btn btn-wa"
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={17} />
                <span>Tanya via WhatsApp</span>
              </a>
            </div>
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingOrder}
        title="Hapus Riwayat Pesanan?"
        message="Pesanan akan dihapus hanya dari riwayat pada browser ini. Catatan pesanan admin tetap tersimpan."
        onConfirm={handleDeleteCustomerOrder}
        onCancel={() => setDeletingOrder(null)}
        confirmText="Hapus Riwayat"
      />
      <ConfirmModal
        isOpen={isDeleteAllHistoryOpen}
        title="Hapus Semua Riwayat Selesai?"
        message="Semua pesanan selesai akan dihapus hanya dari riwayat pada browser ini. Catatan admin dan pesanan yang masih menunggu tetap tersimpan."
        onConfirm={handleDeleteAllCustomerOrders}
        onCancel={() => setIsDeleteAllHistoryOpen(false)}
        confirmText="Hapus Semua"
      />
    </>
  );
};