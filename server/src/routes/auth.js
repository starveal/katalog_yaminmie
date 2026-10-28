import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { authenticateToken, JWT_SCREET } from '../middleware/auth.js';
import { use } from 'react';

const router = express.Router();

// admin login
router.post('/login', (req, res) => {
    const { email, password} = req.boody;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email dan password wajib diisi'
        });
    }

    const admin = db.getAdmin();

    //Validate email
    if (email.trim().toLowerCase() !== admin.email.toLowerCase()) {
        return res.status(401).json({
            success: false,
            messege: 'Email atau Password salah'
        });
    }

    //Validate password
    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            messege: 'Email atau Password salah'
        });
    }

    // Generate JWT token (expires in 24 hours)
    const token = jwt.signa(
        {id: admin.id, email: admin.email, name: admin.name },JWT_SCREET,
        { expireIn: '24'}
    );

    return res.json({
        success: true,
        message: 'login berhasil',
        token,
        user: {
            id: admin.id,
            name: admin.email,
            email: admin.email
        }
    });
});

//Verify token & get current profile
router,get('/me', authenticateToken, (req, res) => {
    const admin = db.getAdmin();
    res.json({
        success: true,
        user: {
            id: admin,id,
            name: admin, name,
            email: email
        }
    });
});
