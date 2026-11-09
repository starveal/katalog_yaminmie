import React, { useState } from 'react';
import { X, MessageCircle, AlertCircle, Send, Trash2 } from 'lucide-react';
import { createOrder } from '../services/api';

export const OrderModal = ({
  product,
  cartItems,
  onCartItemsChange,
  onOrderComplete,
  storeSettings,
  onClose
}) => {
  const isCartMode = Array.isArray(cartItems);
  const [items, setItems] = useState(() => (
    isCartMode
      ? cartItems
      : product
        ? [{ ...product, quantity: 1 }]
        : []
  ));
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [showError, setShowError] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storeName = storeSettings?.storeName || 'Toko Berkah Nusantara';
  const storePhone = (storeSettings?.phone || '6281234567890').replace(/[^0-9]/g, '');

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);

  const updateItems = (nextItems) => {
    setItems(nextItems);
    if (isCartMode) onCartItemsChange?.(nextItems);
  };

  const changeQuantity = (productId, change) => {
    updateItems(items.map((item) => (
      item.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    )));
  };

  const removeItem = (productId) => {
    updateItems(items.filter((item) => item.id !== productId));
  };

  const totalPrice = items.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);

  const generateMessage = (order) => {
    const productLines = order.items.map((item) => (
      `- ${item.name}: ${item.quantity} x ${formatRupiah(item.price)} = ${formatRupiah(item.price * item.quantity)}`
    )).join('\n');
    const addressLine = order.deliveryAddress || '-';
    const notesLine = order.specialNotes || '-';

    return `Halo ${storeName}, saya ${order.customerName} mau pesan:\n${productLines}\n- Total: ${formatRupiah(order.totalPrice)}\n- Alamat pengiriman: ${addressLine}\n- Catatan khusus: ${notesLine}\n\nMohon diproses ya, terima kasih!`;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setShowError(true);
      document.getElementById('customer-name-input')?.focus();
      return;
    }
    if (items.length === 0) return;

    setShowError(false);
    setSubmissionError('');

    const whatsappWindow = window.open('about:blank', '_blank');
    if (!whatsappWindow) {
      setSubmissionError('Izinkan pop-up untuk situs ini agar pesanan dapat dibuka di WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createOrder({
        customerName: customerName.trim(),
        deliveryAddress: deliveryAddress.trim(),
        specialNotes: customerNotes.trim(),
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        }))
      });
      const order = response.data;
      const waUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(generateMessage(order))}`;
      whatsappWindow.opener = null;
      whatsappWindow.location.href = waUrl;
      onOrderComplete?.(order);
      onClose();
    } catch (error) {
      whatsappWindow.close();
      setSubmissionError(error.message || 'Pesanan gagal dicatat. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px' }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">{isCartMode ? 'Keranjang Belanja' : 'Konfirmasi Pesanan WhatsApp'}</h2>
            <p className="modal-subtitle">
              {isCartMode ? `Periksa pesanan sebelum dikirim ke ${storeName}` : `Pesan langsung ke WhatsApp ${storeName}`}
            </p>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} title="Tutup" aria-label="Tutup keranjang">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <>
            <div className="modal-body">
              <p className="cart-empty-message">Keranjang masih kosong. Tambahkan produk dari menu terlebih dahulu.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Kembali ke Menu</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmitOrder}>
            <div className="modal-body">
              <div className="cart-order-items">
                {items.map((item) => (
                  <div className="order-product-summary" key={item.id}>
                    <img src={item.image} alt={item.name} className="summary-img" />
                    <div className="summary-details">
                      <span className="summary-category">{item.categoryName || 'Menu'}</span>
                      <h4 className="summary-name">{item.name}</h4>
                      <div className="summary-price-row">
                        <span className="summary-unit-price">{formatRupiah(item.price)} / item</span>
                        <div className="cart-line-actions">
                          <div className="quantity-control">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => changeQuantity(item.id, -1)}
                              aria-label={`Kurangi jumlah ${item.name}`}
                            >
                              -
                            </button>
                            <span className="qty-number">{item.quantity}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => changeQuantity(item.id, 1)}
                              aria-label={`Tambah jumlah ${item.name}`}
                            >
                              +
                            </button>
                          </div>
                          {isCartMode && (
                            <button
                              type="button"
                              className="btn-icon cart-remove-btn"
                              onClick={() => removeItem(item.id)}
                              aria-label={`Hapus ${item.name} dari keranjang`}
                              title="Hapus produk"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-total-bar">
                <span>Total Perkiraan:</span>
                <span className="total-amount">{formatRupiah(totalPrice)}</span>
              </div>

              {showError && (
                <div className="form-alert-error animate-fade-in" id="name-validation-alert">
                  <AlertCircle size={18} />
                  <span>Nama pemesan wajib diisi untuk memesan via WhatsApp.</span>
                </div>
              )}
              {submissionError && (
                <div className="form-alert-error animate-fade-in" role="alert">
                  <AlertCircle size={18} />
                  <span>{submissionError}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="customer-name-input">
                  <span>Nama Lengkap Anda</span>
                  <span className="text-danger">*</span>
                </label>
                <input
                  id="customer-name-input"
                  type="text"
                  className={`form-input ${showError && !customerName.trim() ? 'error' : ''}`}
                  placeholder="Contoh: Budi Pratama"
                  value={customerName}
                  maxLength={100}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (e.target.value.trim()) setShowError(false);
                  }}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="customer-address-input">
                  <span>Alamat Pengiriman</span>
                  <span className="text-muted" style={{ fontWeight: 400 }}>(Opsional)</span>
                </label>
                <textarea
                  id="customer-address-input"
                  rows="2"
                  className="form-textarea"
                  placeholder="Isi alamat lengkap jika memerlukan pengantaran"
                  value={deliveryAddress}
                  maxLength={500}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="customer-notes-input">
                  <span>Catatan Khusus</span>
                  <span className="text-muted" style={{ fontWeight: 400 }}>(Opsional)</span>
                </label>
                <textarea
                  id="customer-notes-input"
                  rows="2"
                  className="form-textarea"
                  placeholder="Contoh: Tidak pakai pedas, sambal dipisah"
                  value={customerNotes}
                  maxLength={500}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>

              <div className="wa-preview-box">
                <div className="wa-preview-header">
                  <MessageCircle size={16} />
                  <span>PREVIEW PESAN WHATSAPP OTOMATIS:</span>
                </div>
                <div className="wa-bubble">{generateMessage({
                  customerName: customerName.trim() || '[Nama Pemesan]',
                  deliveryAddress: deliveryAddress.trim(),
                  specialNotes: customerNotes.trim(),
                  items,
                  totalPrice
                })}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-wa" id="submit-wa-order-btn" disabled={isSubmitting}>
                <Send size={16} />
                <span>{isSubmitting ? 'Mencatat Pesanan...' : 'Kirim Pesanan ke WhatsApp'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
