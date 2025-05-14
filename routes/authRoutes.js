// Plik który należy umieścić w lokalizacji /nodeapp/routes/authRoutes.js (zaktualizowana wersja)

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUsers, saveUsers } = require('../config/db');
const { generateUniqueId } = require('../utils/helpers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const users = getUsers();
    if (users.find(user => user.username === username)) {
        return res.status(400).json({ error: 'User with this username already exists.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: generateUniqueId(),
            username,
            password: hashedPassword,
        };

        users.push(newUser);
        saveUsers(users, (err) => {
            if (err) {
                console.error("Error saving users:", err);
                return res.status(500).json({ error: 'Error while saving user.' });
            }
            res.status(201).json({
                message: 'User registered successfully.',
                userId: newUser.id,
                username: newUser.username
            });
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: 'Internal server error during registration.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const users = getUsers();
    const user = users.find(u => u.username === username);

    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'default_jwt_secret_for_development',
            { expiresIn: '24h' } // Token valid for 24 hours
        );
        res.json({
            message: 'Login successful.',
            token: token,
            username: user.username,
            userId: user.id
        });
    } else {
        res.status(401).json({ error: 'Invalid username or password.' });
    }
});

// GET /api/auth/validate - Endpoint to validate token
router.get('/validate', protect, (req, res) => {
    // If middleware passes, the token is valid
    res.json({
        message: 'Token is valid',
        user: {
            id: req.user.id,
            username: req.user.username
        }
    });
});

// GET /api/auth/user - Endpoint to get user data
router.get('/user', protect, (req, res) => {
    res.json({
        id: req.user.id,
        username: req.user.username
    });
});

module.exports = router;