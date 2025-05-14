// nodeapp/server.js
require('dotenv').config(); // Wczytuje zmienne środowiskowe z pliku .env na samym początku

const express = require('express');
const path = require('path');
// const cors = require('cors'); // Możesz odkomentować, jeśli będziesz potrzebował CORS

const authRoutes = require('./routes/authRoutes');
const notesRoutes = require('./routes/notesRoutes');
const codingRoutes = require('./routes/codingRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const blogRoutes = require('./routes/blogRoutes');
const placeholderRoutes = require('./routes/placeholderRoutes');

const app = express();

// Middleware podstawowe
// app.use(cors()); // Włączenie CORS, jeśli jest potrzebne
app.use(express.json()); // Do parsowania JSON w ciele żądania
app.use(express.urlencoded({ extended: true })); // Do parsowania danych z formularzy URL-encoded

// Serwowanie plików statycznych z katalogu 'public'
// Zakładając, że 'public' jest katalogiem równorzędnym do 'nodeapp' (np. /var/www/kuzyn.pro/public)
const publicDirectoryPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicDirectoryPath));

// Rejestracja routerów dla API
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/posts', blogRoutes); // Endpoint dla postów blogowych
app.use('/api/placeholder', placeholderRoutes);

// --- Usunięto stare definicje API i funkcje pomocnicze ---
// Wszystkie endpointy API są teraz w katalogu 'routes'
// Funkcje pomocnicze (generateUniqueId, readJsonFile itp.) są w 'utils/'

// Podstawowe przekierowanie dla ścieżki głównej
// Zakładając, że główną stroną jest blog dostępny pod /blog/ (co wskazuje na public/blog/index.html)
app.get('/', (req, res) => {
    res.redirect('/blog/'); // Lub res.sendFile(path.join(publicDirectoryPath, 'index.html')) jeśli masz główny public/index.html
});

// Obsługa stron HTML (jeśli chcesz, aby /blog serwował public/blog/index.html itp.)
// express.static powinno już obsługiwać /login.html, /write.html, /blog/index.html
// Jeśli chcesz, aby np. /blog bez '/' na końcu też działało:
app.get('/blog', (req, res) => {
    res.redirect('/blog/');
});

// Jeśli masz inne pliki HTML, które mają być serwowane dla konkretnych ścieżek:
// app.get('/nazwa-sciezki', (req, res) => {
//     res.sendFile(path.join(publicDirectoryPath, 'nazwa-pliku.html'));
// });
// Np. plik login.html jest już dostępny pod /login.html dzięki express.static

// Uruchomienie serwera
const PORT = process.env.PORT || 3000; // Używa portu z .env lub domyślnie 3000

app.listen(PORT, () => {
    console.log(`Serwer Node.js (kuzyn.pro backend) działa.`);
    console.log(`Nasłuchuje na porcie ${PORT}.`);
    console.log(`Dostępny lokalnie pod adresem: http://localhost:${PORT}`);
    console.log(`Dostępny publicznie (przez proxy Nginx/Apache) pod adresem: https://kuzyn.pro`);
    if (!process.env.JWT_SECRET) {
        console.warn('OSTRZEŻENIE: Zmienna środowiskowa JWT_SECRET nie jest ustawiona! Funkcje autentykacji nie będą działać poprawnie.');
    }
    if (process.env.NODE_ENV === 'development') {
        console.warn('Serwer działa w trybie deweloperskim (NODE_ENV=development).');
    }
});