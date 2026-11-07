
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

const logoUpload = multer({
    storage: multer.diskStorage({
        destination: uploadsDir,
        filename: (req, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase();
            callback(null, `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        const validExtension = /\.(jpe?g|png|webp|gif)$/i.test(file.originalname);
        const validMimeType = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);

        if (validExtension && validMimeType) {
            return callback(null, true);
        }

        callback(new Error('Format logo harus JPG, PNG, WEBP, atau GIF.'));
    }
});

// GET Store settings (public)
router.get('/', (req, res) => {
    try {
        const settings = db.getSettings();

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
        const updated = db.updateSettings({ logo: `/uploads/${req.file.filename}` });
        res.json({
            success: true,
            message: 'Logo toko berhasil diperbarui.',
            data: updated
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

// PUT Update store settings (admin protected)
router.put('/', authenticateToken, (req, res) => {
    try {
        const { storeName, tagline, phone, address } = req.body;

        const current = db.getSettings();

        const updated = db.updateSettings({
            storeName: storeName ?? current.storeName,
            tagline: tagline ?? current.tagline,
            phone: phone !== undefined
                ? phone.replace(/[^0-9]/g, '')
                : current.phone,
            address: address ?? current.address
        });

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
