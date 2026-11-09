
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/db.js';
import { authenticateToken } from '../db/middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const createImageUpload = (prefix, formatErrorMessage) => multer({
    storage: multer.diskStorage({
        destination: uploadsDir,
        filename: (req, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase();
            callback(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const validExtension = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
        const validMimeType = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);

        if (validExtension && validMimeType) {
            return callback(null, true);
        }

        callback(new Error(formatErrorMessage));
    }
});

const logoUpload = createImageUpload('logo', 'Format logo harus JPG, PNG, WEBP, atau GIF.');
const homepageImageUpload = createImageUpload(
    'homepage',
    'Format gambar beranda harus JPG, PNG, WEBP, atau GIF.'
);
const getStoreSettings = () => {
    const settings = db.getSettings();
    const recommendedProducts = settings.recommendedProductIds
        .map((id) => db.getProductById(id))
        .filter(Boolean);

    return {
        ...settings,
        recommendedProductIds: recommendedProducts.map((product) => product.id),
        recommendedMenus: [...settings.recommendedMenus, ...recommendedProducts]
    };
};

// GET Store settings (public)
router.get('/', (req, res) => {
    try {
        const settings = getStoreSettings();

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST Upload public store logo (admin protected)
router.post('/logo', authenticateToken, (req, res, next) => {
    logoUpload.single('logo')(req, res, (error) => {
        if (!error) return next();

        const isSizeLimitError = error instanceof multer.MulterError
            && error.code === 'LIMIT_FILE_SIZE';
        res.status(isSizeLimitError ? 413 : 400).json({
            success: false,
            message: isSizeLimitError
                ? 'Ukuran logo maksimal 5 MB.'
                : error.message
        });
    });
}, (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'File logo wajib dipilih.'
        });
    }

    try {
        db.updateSettings({ logo: `/uploads/${req.file.filename}` });
        res.json({
            success: true,
            message: 'Logo toko berhasil diperbarui.',
            data: getStoreSettings()
        });
    } catch (error) {
        fs.unlink(req.file.path, (unlinkError) => {
            if (unlinkError) console.error('Gagal menghapus unggahan logo yang tidak tersimpan:', unlinkError);
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/homepage-image', authenticateToken, (req, res, next) => {
    homepageImageUpload.single('image')(req, res, (error) => {
        if (!error) return next();

        const isSizeLimitError = error instanceof multer.MulterError
            && error.code === 'LIMIT_FILE_SIZE';
        res.status(isSizeLimitError ? 413 : 400).json({
            success: false,
            message: isSizeLimitError
                ? 'Ukuran gambar beranda maksimal 5 MB.'
                : error.message
        });
    });
}, (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'File gambar beranda wajib dipilih.'
        });
    }

    try {
        db.updateSettings({ homepageImage: `/uploads/${req.file.filename}` });
        res.json({
            success: true,
            message: 'Gambar beranda berhasil diperbarui.',
            data: getStoreSettings()
        });
    } catch (error) {
        fs.unlink(req.file.path, (unlinkError) => {
            if (unlinkError) console.error('Gagal menghapus unggahan gambar beranda yang tidak tersimpan:', unlinkError);
        });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/recommended-products/:id', authenticateToken, (req, res) => {
    try {
        const product = db.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan.'
            });
        }

        const recommendedProductIds = getStoreSettings().recommendedProductIds;
        if (recommendedProductIds.includes(product.id)) {
            return res.status(409).json({
                success: false,
                message: 'Produk ini sudah ada di menu yang disarankan.'
            });
        }

        db.updateSettings({
            recommendedProductIds: JSON.stringify([...recommendedProductIds, product.id])
        });
        res.status(201).json({
            success: true,
            message: 'Produk berhasil ditambahkan ke menu yang disarankan.',
            data: getStoreSettings()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.delete('/recommended-products/:id', authenticateToken, (req, res) => {
    try {
        const recommendedProductIds = getStoreSettings().recommendedProductIds;
        if (!recommendedProductIds.includes(req.params.id)) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan di menu yang disarankan.'
            });
        }

        db.updateSettings({
            recommendedProductIds: JSON.stringify(
                recommendedProductIds.filter((id) => id !== req.params.id)
            )
        });
        res.json({
            success: true,
            message: 'Produk dihapus dari menu yang disarankan.',
            data: getStoreSettings()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT Update store settings (admin protected)
router.put('/', authenticateToken, (req, res) => {
    try {
        const { storeName, tagline, homepageDescription, phone, address } = req.body;

        const current = db.getSettings();

        if (
            homepageDescription !== undefined &&
            (typeof homepageDescription !== 'string' || homepageDescription.length > 500)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Deskripsi beranda maksimal 500 karakter.'
            });
        }

        db.updateSettings({
            storeName: storeName ?? current.storeName,
            tagline: tagline ?? current.tagline,
            ...(homepageDescription !== undefined && { homepageDescription }),
            phone: phone !== undefined
                ? phone.replace(/[^0-9]/g, '')
                : current.phone,
            address: address ?? current.address
        });
        const updated = getStoreSettings();

        res.json({
            success: true,
            message: 'Pengaturan toko berhasil disimpan',
            data: updated
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
