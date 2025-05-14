// nodeapp/config/db.js
const fs = require('fs');
const path = require('path');
const { readJsonFile, writeJsonFile } = require('../utils/fileHandler'); // Używamy ogólnych funkcji

const usersFilePath = path.join(__dirname, '..', 'data', 'users.json'); // Przechowamy użytkowników w nodeapp/data/users.json

// Upewnij się, że katalog 'data' istnieje
const dataDir = path.dirname(usersFilePath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Inicjalizuj plik users.json, jeśli nie istnieje
if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([]), 'utf8');
}

const getUsers = () => {
    return readJsonFile(usersFilePath, []);
};

const saveUsers = (users, callback) => { // zmiana: callback dla operacji zapisu
    const dir = path.dirname(usersFilePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Błąd zapisu pliku użytkowników:', err);
            if (callback) callback(err);
            return;
        }
        if (callback) callback(null);
    });
};

module.exports = {
    getUsers,
    saveUsers
};