const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { initializeDB, pool } = require('./db');

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Registration Endpoint
app.post('/register', async (req, res) => {
    const { username, password, email, phone, role } = req.body;

    // Basic Validation
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password and email are required' });
    }

    try {
        // Check if user already exists
        const [existing] = await pool.query('SELECT * FROM KodUser WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'Customer';

        // Insert into DB (uid is auto-increment as per schema)
        await pool.query(
            'INSERT INTO KodUser (username, password, email, phone, role) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, email, phone, userRole]
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        // 1. Verify user
        const [users] = await pool.query('SELECT * FROM KodUser WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 2. Generate JWT
        const token = jwt.sign(
            { uid: user.uid, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h', subject: user.username }
        );

        // 3. Store token in DB (UserToken table)
        const expiryDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
        await pool.query(
            'INSERT INTO UserToken (token, uid, expairy) VALUES (?, ?, ?)',
            [token, user.uid, expiryDate]
        );

        // 4. Send cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            maxAge: 3600000 // 1 hour
        });

        res.json({ message: 'Login successful', role: user.role });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Get Balance Endpoint (Protected)
app.get('/getBalance', authenticateToken, async (req, res) => {
    try {
        // req.user contains the payload from JWT (uid, username, role)
        const [users] = await pool.query('SELECT balance FROM KodUser WHERE uid = ?', [req.user.uid]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ balance: users[0].balance });
    } catch (err) {
        console.error('GetBalance error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;

// Initialize DB schema on startup
initializeDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
