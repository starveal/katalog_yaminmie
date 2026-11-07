import React, { useEffect, useState } from 'react';
import { CircleHelp, MessageCircle, Lock, LogOut, LayoutDashboard, Store, ShoppingCart, X } from 'lucide-react';

import DefaultLogo from '../assets/Cinnamix Coffee and Cinnamon Logo.png';

export const Header = ({
  storeSettings,
  isAdminView,
  setIsAdminView,
  adminUser,
  cartItemCount = 0,
  onOpenCart,
  onOpenLogin,
  onLogout
}) => {
  const [isFaqOpen, setIsFaqOpen] = useState(false);
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

  return (
    <>
      <header className="site-header">
      <div className="container header-container">
        <button
          type="button"
          className="brand-group"
          onClick={() => setIsAdminView(false)}
          aria-label="Kembali ke katalog"
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
            <span className="store-subtext">Coffee • Resto • Lokal</span>
          </div>
        </button>

        <nav className="header-nav" aria-label="Navigasi utama">
          <a className="header-nav-link" href="#beranda">Beranda</a>
          <a className="header-nav-link" href="#menu">Menu</a>
        </nav>

        <div className="header-actions">
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
              <span className="admin-badge">
                <span className="admin-dot"></span>
                Admin: {adminUser?.name || 'Cinnamix Owner'}
              </span>

              {isAdminView ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAdminView(false)}
                  title="Kembali ke tampilan pelanggan"
                >
                  <Store size={16} />
                  <span>Lihat Katalog</span>
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsAdminView(true)}
                  title="Buka panel admin"
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard Admin</span>
                </button>
              )}

              <button
                className="btn btn-danger-soft btn-sm"
                onClick={onLogout}
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
    </>
  );
};