// nodeapp/routes/notesRoutes.js
const express = require('express');
const path = require('path');
const { generateUniqueId, validateNote } = require('../utils/helpers');
const { readJsonFile, writeJsonFile } = require('../utils/fileHandler');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Ścieżka do pliku data.json dla notatek
// Zakładając, że nodeapp jest w kuzyn.pro/nodeapp a public w kuzyn.pro/public
const dataDir = path.join(__dirname, '..', '..', 'public');
const notesPath = path.join(dataDir, 'notes', 'data.json');

// GET /api/notes - publiczne, pobiera wszystkie notatki
router.get('/', (req, res) => {
    const notes = readJsonFile(notesPath, []);
    res.json(notes);
});

// POST /api/notes - chronione, tworzenie nowej notatki
router.post('/', protect, (req, res) => {
    const notes = readJsonFile(notesPath, []);
    const { title, content, color } = req.body;

    const newNote = {
        id: generateUniqueId(),
        title,
        content,
        color: color || 'yellow', // Domyślny kolor
        date: new Date().toLocaleString('pl-PL'),
        authorId: req.user.id,
        authorUsername: req.user.username
    };

    if (!validateNote(newNote)) {
        return res.status(400).json({ error: 'Nieprawidłowe dane notatki. Tytuł i treść są wymagane.' });
    }

    notes.push(newNote);
    writeJsonFile(notesPath, notes, res, 'Notatka zapisana!', { noteId: newNote.id, note: newNote });
});

// PUT /api/notes/:id - chronione, aktualizacja istniejącej notatki
router.put('/:id', protect, (req, res) => {
    const notes = readJsonFile(notesPath, []);
    const noteId = req.params.id;
    const { title, content, color } = req.body;
    const noteIndex = notes.findIndex(note => note.id === noteId);

    if (noteIndex === -1) {
        return res.status(404).json({ error: 'Notatka o podanym ID nie została znaleziona.' });
    }

    // Sprawdzenie, czy użytkownik jest autorem notatki
    // Jeśli notatka nie ma authorId, traktujemy ją jako nieedytowalną przez ten mechanizm
    // lub można pozwolić na edycję adminowi itp. (bardziej złożona logika)
    if (notes[noteIndex].authorId && notes[noteIndex].authorId !== req.user.id) {
        return res.status(403).json({ error: 'Brak uprawnień do edycji tej notatki.' });
    }
    // Jeśli notatka nie ma authorId, a chcemy pozwolić na "przejęcie" jej przez pierwszego edytującego:
    // if (!notes[noteIndex].authorId) {
    //     notes[noteIndex].authorId = req.user.id;
    //     notes[noteIndex].authorUsername = req.user.username;
    // } else if (notes[noteIndex].authorId !== req.user.id) {
    //     return res.status(403).json({ error: 'Brak uprawnień do edycji tej notatki.' });
    // }


    const updatedNote = {
        ...notes[noteIndex],
        title: title || notes[noteIndex].title,
        content: content || notes[noteIndex].content,
        color: color || notes[noteIndex].color,
        lastEdited: new Date().toLocaleString('pl-PL'),
        // Upewnij się, że authorId i authorUsername nie są nadpisywane, jeśli nie są przekazywane
        authorId: notes[noteIndex].authorId || req.user.id, // Przypisz autora jeśli go nie było
        authorUsername: notes[noteIndex].authorUsername || req.user.username // Przypisz autora jeśli go nie było
    };

    if (!validateNote(updatedNote)) {
        return res.status(400).json({ error: 'Nieprawidłowe dane notatki. Tytuł i treść nie mogą być puste.' });
    }

    notes[noteIndex] = updatedNote;
    writeJsonFile(notesPath, notes, res, 'Notatka zaktualizowana!', { note: updatedNote });
});

// DELETE /api/notes/:id - chronione, usuwanie notatki
router.delete('/:id', protect, (req, res) => {
    let notes = readJsonFile(notesPath, []);
    const noteId = req.params.id;
    const noteToDelete = notes.find(note => note.id === noteId);

    if (!noteToDelete) {
        return res.status(404).json({ error: 'Notatka o podanym ID nie została znaleziona.' });
    }

    // Sprawdzenie, czy użytkownik jest autorem notatki
    if (noteToDelete.authorId && noteToDelete.authorId !== req.user.id) {
        return res.status(403).json({ error: 'Brak uprawnień do usunięcia tej notatki.' });
    }
    // Jeśli notatka nie ma authorId, można pozwolić na usunięcie (lub tylko adminowi)
    // W tym przypadku, jeśli nie ma authorId, a użytkownik jest zalogowany, pozwalamy usunąć.
    // Jeśli chcesz bardziej rygorystycznie:
    // if (!noteToDelete.authorId || noteToDelete.authorId !== req.user.id) {
    //    return res.status(403).json({ error: 'Brak uprawnień do usunięcia tej notatki.' });
    // }


    const filteredNotes = notes.filter(note => note.id !== noteId);
    if (filteredNotes.length === notes.length) {
        // To nie powinno się zdarzyć, jeśli noteToDelete zostało znalezione
        return res.status(404).json({ error: 'Nie udało się usunąć notatki.' });
    }
    writeJsonFile(notesPath, filteredNotes, res, 'Notatka została usunięta');
});

module.exports = router;