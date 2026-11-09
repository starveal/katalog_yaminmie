
import express from 'express';
import multer from 'multer';
import path from 'node:path';

import { db } from '../db/db.js';
import { authenticateToken } from '../db/middleware/auth.js';
import { uploadsDir } from '../utils/uploads.js';

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueSuffix =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowed = /\.(jpeg|jpg|png|webp|gif)$/i;
        const validMime = /^image\/(jpeg|png|webp|gif)$/i;

        if (
            allowed.test(path.extname(file.originalname)) &&
            validMime.test(file.mimetype)
        ) {
            return cb(null, true);
        }

        cb(new Error('Format gambar tidak didukung'));
    }
});

const router = express.Router();

// GET all products
router.get('/', (req, res) => {
    try {
        const { categoryId, search, stockStatus } = req.query;

        const products = db.getProducts({
            categoryId,
            search,
            stockStatus
        });

        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET single product
router.get('/:id', (req, res) => {
    try {
        const product = db.getProductById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST create product
router.post(
    '/',
    authenticateToken,
    upload.single('photo'),
    (req, res) => {
        try {
            const {
                name,
                categoryId,
                price,
                stockStatus,
                description,
                imageUrl
            } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama produk wajib diisi'
                });
            }

            if (!categoryId || !db.getCategoryById(categoryId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Kategori produk tidak valid'
                });
            }

            if (
                price === undefined ||
                price === '' ||
                !Number.isFinite(Number(price)) ||
                Number(price) <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: 'Harga produk harus angka positif'
                });
            }

            const finalImage = req.file
                ? `/uploads/${req.file.filename}`
                : (imageUrl || '');

            const newProduct = db.addProduct({
                name: name.trim(),
                categoryId,
                price: Number(price),
                stockStatus: stockStatus || 'Tersedia',
                description: description ? description.trim() : '',
                image: finalImage
            });

            res.status(201).json({
                success: true,
                message: 'Produk berhasil ditambahkan',
                data: newProduct
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// PUT update product
router.put(
    '/:id',
    authenticateToken,
    upload.single('photo'),
    (req, res) => {
        try {
            const { id } = req.params;

            const {
                name,
                categoryId,
                price,
                stockStatus,
                description,
                imageUrl
            } = req.body;

            const existing = db.getProductById(id);

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Produk tidak ditemukan'
                });
            }

            const updatePayload = {};

            if (name !== undefined) {
                if (!name.trim()) {
                    return res.status(400).json({
                        success: false,
                        message: 'Nama produk tidak boleh kosong'
                    });
                }
                updatePayload.name = name.trim();
            }

            if (categoryId !== undefined) {
                if (!db.getCategoryById(categoryId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Kategori tidak valid'
                    });
                }
                updatePayload.categoryId = categoryId;
            }

            if (price !== undefined) {
                if (
                    price === '' ||
                    !Number.isFinite(Number(price)) ||
                    Number(price) <= 0
                ) {
                    return res.status(400).json({
                        success: false,
                        message: 'Harga harus angka positif'
                    });
                }
                updatePayload.price = Number(price);
            }

            if (stockStatus !== undefined) {
                updatePayload.stockStatus = stockStatus;
            }

            if (description !== undefined) {
                updatePayload.description = description.trim();
            }

            if (req.file) {
                updatePayload.image = `/uploads/${req.file.filename}`;
            } else if (imageUrl !== undefined) {
                updatePayload.image = imageUrl.trim();
            }

            const updated = db.updateProduct(id, updatePayload);

            res.json({
                success: true,
                message: 'Produk berhasil diperbarui',
                data: updated
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);

// PATCH toggle stock
router.patch('/:id/stock', authenticateToken, (req, res) => {
    try {
        const updated = db.toggleStock(req.params.id);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: `Status stok diubah menjadi: ${updated.stockStatus}`,
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE product
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const deleted = db.deleteProduct(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Produk berhasil dihapus'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
