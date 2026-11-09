import express from 'express';
import { db } from '../db/db.js';
import { authenticateToken } from '../db/middleware/auth.js';

const router = express.Router();

router.post('/', (req, res) => {
    try {
        const { customerName, deliveryAddress = '', specialNotes = '', items } = req.body || {};

        if (typeof customerName !== 'string' || !customerName.trim() || customerName.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Nama pemesan wajib diisi dan maksimal 100 karakter.'
            });
        }

        if (
            typeof deliveryAddress !== 'string' ||
            deliveryAddress.length > 500 ||
            typeof specialNotes !== 'string' ||
            specialNotes.length > 500
        ) {
            return res.status(400).json({
                success: false,
                message: 'Alamat dan catatan khusus maksimal 500 karakter.'
            });
        }

        if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
            return res.status(400).json({
                success: false,
                message: 'Pesanan harus berisi 1 sampai 30 produk.'
            });
        }

        const seenProductIds = new Set();
        const orderItems = [];

        for (const item of items) {
            if (
                !item ||
                typeof item.productId !== 'string' ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1 ||
                item.quantity > 99 ||
                seenProductIds.has(item.productId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Daftar produk atau jumlah pesanan tidak valid.'
                });
            }

            seenProductIds.add(item.productId);
            const product = db.getProductById(item.productId);
            if (!product || product.stockStatus !== 'Tersedia') {
                return res.status(400).json({
                    success: false,
                    message: `Produk "${product?.name || item.productId}" tidak tersedia. Perbarui katalog dan coba lagi.`
                });
            }

            orderItems.push({
                productId: product.id,
                name: product.name,
                quantity: item.quantity,
                price: product.price
            });
        }

        const totalPrice = orderItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        if (!Number.isSafeInteger(totalPrice)) {
            return res.status(400).json({
                success: false,
                message: 'Total pesanan tidak valid.'
            });
        }

        const order = db.createOrder({
            customerName: customerName.trim(),
            deliveryAddress: deliveryAddress.trim(),
            specialNotes: specialNotes.trim(),
            items: orderItems,
            totalPrice
        });

        res.status(201).json({
            success: true,
            message: 'Pesanan berhasil dicatat untuk konfirmasi toko.',
            data: order
        });
    } catch (error) {
        console.error('Gagal mencatat pesanan:', error);
        res.status(500).json({
            success: false,
            message: 'Pesanan gagal dicatat. Silakan coba kembali.'
        });
    }
});

router.get('/', authenticateToken, (req, res) => {
    try {
        const orders = db.getOrders();
        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Gagal mengambil daftar pesanan:', error);
        res.status(500).json({
            success: false,
            message: 'Daftar pesanan gagal dimuat.'
        });
    }
});

router.get('/history', (req, res) => {
    try {
        const rawIds = req.query.ids || '';
        if (typeof rawIds !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Daftar ID pesanan tidak valid.'
            });
        }

        const ids = [...new Set(rawIds.split(',').filter(Boolean))];
        if (
            ids.length > 100 ||
            ids.some((id) => !/^order-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
        ) {
            return res.status(400).json({
                success: false,
                message: 'Daftar ID pesanan tidak valid.'
            });
        }

        const orders = db.getOrdersByIds(ids);
        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Gagal mengambil riwayat pesanan pelanggan:', error);
        res.status(500).json({
            success: false,
            message: 'Riwayat pesanan gagal dimuat.'
        });
    }
});

router.delete('/completed', authenticateToken, (req, res) => {
    try {
        const hiddenCount = db.hideAllCompletedOrdersFromAdmin();
        return res.json({
            success: true,
            message: 'Semua pesanan selesai disembunyikan dari riwayat admin.',
            hiddenCount
        });
    } catch (error) {
        console.error('Gagal menghapus semua pesanan selesai:', error);
        return res.status(500).json({
            success: false,
            message: 'Semua riwayat pesanan gagal dihapus.'
        });
    }
});

const hideCompletedOrderFromAdmin = (req, res) => {
    try {
        const order = db.getOrders().find((item) => item.id === req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pesanan tidak ditemukan.'
            });
        }

        if (order.status !== 'Selesai') {
            return res.status(409).json({
                success: false,
                message: 'Hanya pesanan yang telah selesai yang dapat dihapus.'
            });
        }

        if (!db.hideCompletedOrderFromAdmin(req.params.id)) {
            return res.status(409).json({
                success: false,
                message: 'Pesanan tidak dapat disembunyikan karena statusnya telah berubah.'
            });
        }

        return res.json({
            success: true,
            message: 'Pesanan disembunyikan dari riwayat admin. Riwayat pelanggan tetap tersedia.'
        });
    } catch (error) {
        console.error('Gagal menyembunyikan pesanan dari riwayat admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Pesanan gagal disembunyikan dari riwayat admin.'
        });
    }
};

router.delete('/:id', authenticateToken, hideCompletedOrderFromAdmin);

router.patch('/:id/confirm', authenticateToken, (req, res) => {
    try {
        const order = db.getOrders().find((item) => item.id === req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pesanan tidak ditemukan.'
            });
        }

        if (order.status === 'Selesai') {
            return res.json({
                success: true,
                message: 'Pesanan sudah dikonfirmasi sebelumnya.',
                data: order
            });
        }

        db.confirmOrder(req.params.id);
        const updatedOrder = db.getOrders().find((item) => item.id === req.params.id);
        res.json({
            success: true,
            message: 'Pesanan telah dikonfirmasi.',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Gagal mengonfirmasi pesanan:', error);
        res.status(500).json({
            success: false,
            message: 'Pesanan gagal dikonfirmasi.'
        });
    }
});

export default router;
