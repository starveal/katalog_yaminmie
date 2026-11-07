
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import {
    authenticateToken,
    JWT_SECRET
} from '../db/middleware/auth.js';

const router = express.Router();

// Admin login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email dan password wajib diisi'
            });
        }

        const admin = db.getAdmin();

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Akun admin tidak ditemukan'
            });
        }

        if (email.trim().toLowerCase() !== admin.email.toLowerCase()) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        const isMatch = bcrypt.compareSync(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                name: admin.name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            message: 'Login berhasil',
            token,
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
});

// Verify token and get current profile
router.get('/me', authenticateToken, (req, res) => {
    const admin = db.getAdminById(req.user.id);

    if (!admin) {
        return res.status(404).json({
            success: false,
            message: 'Admin tidak ditemukan'
        });
    }

    res.json({
        success: true,
        user: {
            id: admin.id,
            name: admin.name,
            email: admin.email
        }
    });
});

router.put('/me', authenticateToken, (req, res) => {
    try {
        const admin = db.getAdminById(req.user.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin tidak ditemukan'
            });
        }

        const { name, email, currentPassword, newPassword } = req.body;
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        if (!normalizedName || !normalizedEmail || !currentPassword) {
            return res.status(400).json({
                success: false,
                message: 'Nama, email, dan password saat ini wajib diisi'
            });
        }

        if (normalizedName.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Nama maksimal 100 karakter'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Format email tidak valid'
            });
        }

        if (!bcrypt.compareSync(currentPassword, admin.password)) {
            return res.status(401).json({
                success: false,
                message: 'Password saat ini tidak sesuai'
            });
        }

        const existingEmail = db.getAdminByEmail(normalizedEmail);
        if (existingEmail && existingEmail.id !== admin.id) {
            return res.status(409).json({
                success: false,
                message: 'Email sudah digunakan akun lain'
            });
        }

        let passwordHash = admin.password;
        if (newPassword !== undefined && newPassword !== '') {
            if (typeof newPassword !== 'string' || newPassword.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password baru minimal 8 karakter'
                });
            }
            passwordHash = bcrypt.hashSync(newPassword, 10);
        }

        const updatedAdmin = db.updateAdmin(admin.id, {
            name: normalizedName,
            email: normalizedEmail,
            password: passwordHash
        });

        return res.json({
            success: true,
            message: 'Profil admin berhasil diperbarui',
            user: {
                id: updatedAdmin.id,
                name: updatedAdmin.name,
                email: updatedAdmin.email
            }
        });
    } catch (error) {
        if (error.code === 'ERR_SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({
                success: false,
                message: 'Email sudah digunakan akun lain'
            });
        }

        console.error('Update admin profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memperbarui profil admin'
        });
    }
});

router.put('/me/password', authenticateToken, (req, res) => {
    try {
        const admin = db.getAdminById(req.user.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin tidak ditemukan'
            });
        }

        const { currentPassword, newPassword } = req.body;
        if (
            typeof currentPassword !== 'string' ||
            typeof newPassword !== 'string' ||
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message: 'Password saat ini dan password baru wajib diisi'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password baru minimal 8 karakter'
            });
        }

        if (Buffer.byteLength(newPassword, 'utf8') > 72) {
            return res.status(400).json({
                success: false,
                message: 'Password baru maksimal 72 byte'
            });
        }

        if (!bcrypt.compareSync(currentPassword, admin.password)) {
            return res.status(401).json({
                success: false,
                message: 'Password saat ini tidak sesuai'
            });
        }

        db.updateAdminPassword(admin.id, bcrypt.hashSync(newPassword, 10));

        return res.json({
            success: true,
            message: 'Password admin berhasil diperbarui'
        });
    } catch (error) {
        console.error('Update admin password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat memperbarui password admin'
        });
    }
});

export default router;
