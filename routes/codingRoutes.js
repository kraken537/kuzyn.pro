// nodeapp/routes/codingRoutes.js
const express = require('express');
const path = require('path');
const { generateUniqueId } = require('../utils/helpers');
const { readJsonFile, writeJsonFile } = require('../utils/fileHandler');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const dataDir = path.join(__dirname, '..', '..', 'public');
const codingDataPath = path.join(dataDir, 'coding', 'data.json');

// GET /api/coding - publiczne, pobiera wszystkie bloki kodu
router.get('/', (req, res) => {
    const blocks = readJsonFile(codingDataPath, []);
    res.json(blocks);
});

// POST /api/coding - chronione, tworzenie nowego bloku kodu
router.post('/', protect, (req, res) => {
    const blocks = readJsonFile(codingDataPath, []);
    const { title, language, code } = req.body;

    if (!title || !language || !code) {
        return res.status(400).json({ error: 'Tytuł, język i kod są wymagane.' });
    }

    const newBlock = {
        id: generateUniqueId(),
        title,
        language,
        code,
        date: new Date().toLocaleString('pl-PL'),
        authorId: req.user.id,
        authorUsername: req.user.username
    };

    blocks.push(newBlock);
    // Zwracamy cały obiekt, a nie tylko ID, dla spójności z innymi endpointami
    writeJsonFile(codingDataPath, blocks, res, 'Blok kodu zapisany!', { codeBlockId: newBlock.id, codeBlock: newBlock });
});

// PUT /api/coding/:id - chronione, aktualizacja bloku kodu
router.put('/:id', protect, (req, res) => {
    const blocks = readJsonFile(codingDataPath, []);
    const blockId = req.params.id;
    const { title, language, code } = req.body;
    const blockIndex = blocks.findIndex(block => block.id === blockId);

    if (blockIndex === -1) {
        return res.status(404).json({ error: 'Blok kodu o podanym ID nie został znaleziony.' });
    }

    if (blocks[blockIndex].authorId && blocks[blockIndex].authorId !== req.user.id) {
        return res.status(403).json({ error: 'Brak uprawnień do edycji tego bloku kodu.' });
    }

    const updatedBlock = {
        ...blocks[blockIndex],
        title: title || blocks[blockIndex].title,
        language: language || blocks[blockIndex].language,
        code: code || blocks[blockIndex].code,
        lastEdited: new Date().toLocaleString('pl-PL'),
        authorId: blocks[blockIndex].authorId || req.user.id,
        authorUsername: blocks[blockIndex].authorUsername || req.user.username
    };

    if (!updatedBlock.title || !updatedBlock.language || !updatedBlock.code) {
        return res.status(400).json({ error: 'Tytuł, język i kod są wymagane.' });
    }

    blocks[blockIndex] = updatedBlock;
    writeJsonFile(codingDataPath, blocks, res, 'Blok kodu zaktualizowany!', { codeBlock: updatedBlock });
});

// DELETE /api/coding/:id - chronione, usuwanie bloku kodu
router.delete('/:id', protect, (req, res) => {
    let blocks = readJsonFile(codingDataPath, []);
    const blockId = req.params.id;
    const blockToDelete = blocks.find(block => block.id === blockId);

    if (!blockToDelete) {
        return res.status(404).json({ error: 'Blok kodu o podanym ID nie został znaleziony.' });
    }

    if (blockToDelete.authorId && blockToDelete.authorId !== req.user.id) {
        return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego bloku kodu.' });
    }

    const filteredBlocks = blocks.filter(block => block.id !== blockId);
    writeJsonFile(codingDataPath, filteredBlocks, res, 'Blok kodu został usunięty');
});


module.exports = router;