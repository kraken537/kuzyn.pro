// nodeapp/utils/helpers.js
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function validateNote(note) {
    return note && note.title && note.title.trim() !== '' &&
           note.content && note.content.trim() !== '';
}

// Możesz dodać inne potrzebne funkcje pomocnicze

module.exports = {
    generateUniqueId,
    validateNote
};
