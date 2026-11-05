import React from 'react';
import { MessageCircle, Lock, LogOut, LayoutDashboard, Store } from 'lucide-react';

import Logo from '../assets/Cinnamix Coffee and Cinnamon Logo.png';

export const Header = ({
  storeSettings,
  isAdminView,
  setIsAdminView,
  adminUser,
  onOpenLogin,
  onLogout
}) => {
  const storePhone = (storeSettings?.phone || '6281234567890').replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${storePhone}`;

  return (
    <header className="site-header">
      <div className="container header-container">
        <button type="button" className="brand-group" onClick={() => setIsAdminView(false)}>
          <div className="logo-brand">
            <img src={Logo} width={44} height={44} alt="Logo Cinnamix Coffee and Cinnamon" />
          </div>
          <div className="brand-info">
            <span className="brand-name">{storeSettings?.storeName || 'Cinnamix Coffee & Resto'}</span>
            <span className="store-subtext">Coffee • Resto • Lokal</span>
          </div>
        </button>

        <div className="header-actions">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-wa header-order-btn"
          >
            <MessageCircle size={17} />
            <span>Pesan via WhatsApp</span>
          </a>
          {adminUser ? (
            <div className="admin-status-bar">
              <span className="admin-badge">
                <span className="admin-dot"></span>
                Admin: {adminUser.name || 'Owner'}
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
  );
};