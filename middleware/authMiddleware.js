// Plik który należy umieścić w lokalizacji /nodeapp/middleware/authMiddleware.js (zaktualizowana wersja)

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_for_development');
            req.user = decoded; // Add decoded user data to req object
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } else if (req.cookies && req.cookies.token) {
        // Alternative: try to get token from cookies
        try {
            token = req.cookies.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret_for_development');
            req.user = decoded;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ error: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
};

module.exports = { protect };