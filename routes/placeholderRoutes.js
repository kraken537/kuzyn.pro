// nodeapp/routes/placeholderRoutes.js
const express = require('express');
const router = express.Router();

// GET /api/placeholder/:width/:height
router.get('/:width/:height', (req, res) => {
    const width = parseInt(req.params.width) || 300; // Domyślna szerokość
    const height = parseInt(req.params.height) || 200; // Domyślna wysokość

    // Ograniczenie maksymalnych wymiarów dla bezpieczeństwa i wydajności
    const maxWidth = 2000;
    const maxHeight = 2000;

    const finalWidth = Math.min(width, maxWidth);
    const finalHeight = Math.min(height, maxHeight);

    res.set('Content-Type', 'image/svg+xml');
    // Prosty SVG placeholder
    res.send(`
        <svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 ${finalWidth} ${finalHeight}">
            <rect width="100%" height="100%" fill="#cccccc"/>
            <text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#555555" text-anchor="middle" dy=".3em">${finalWidth}x${finalHeight}</text>
        </svg>
    `);
});

module.exports = router;