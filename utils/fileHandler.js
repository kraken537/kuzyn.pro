// nodeapp/utils/fileHandler.js
const fs = require('fs');
const path = require('path');

function readJsonFile(filePath, defaultValue = []) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`Błąd odczytu pliku ${filePath}:`, error);
        // W przypadku błędu parsowania JSON, zwróć pustą tablicę lub oryginalny defaultValue
        // aby uniknąć crashu aplikacji przy uszkodzonym pliku JSON.
        return defaultValue;
    }
}

function writeJsonFile(filePath, dataToWrite, res, successMessage, entityInfo = null) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFile(filePath, JSON.stringify(dataToWrite, null, 2), 'utf8', (err) => {
        if (err) {
            console.error(`Błąd zapisu pliku ${filePath}:`, err);
            return res.status(500).json({ error: 'Błąd zapisu pliku' });
        }

        const response = { message: successMessage };

        if (entityInfo) {
            if (typeof entityInfo === 'string') {
                if (Array.isArray(dataToWrite) && dataToWrite.length > 0 && dataToWrite[dataToWrite.length - 1] && dataToWrite[dataToWrite.length - 1].id) {
                    response[entityInfo] = dataToWrite[dataToWrite.length - 1].id;
                } else if (dataToWrite && dataToWrite.id) {
                     response[entityInfo] = dataToWrite.id;
                }
            } else if (typeof entityInfo === 'object') {
                for (const key in entityInfo) {
                    response[key] = entityInfo[key];
                }
            }
        }
        res.json(response);
    });
}

module.exports = {
    readJsonFile,
    writeJsonFile
};
