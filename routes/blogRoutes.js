// Ten plik należy umieścić w folderze nodeapp/routes/blogRoutes.js

const express = require('express');
const path = require('path');
const { generateUniqueId } = require('../utils/helpers');
const { readJsonFile, writeJsonFile } = require('../utils/fileHandler');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const dataDir = path.join(__dirname, '..', '..', 'public');
const blogPostsPath = path.join(dataDir, 'blog', 'posts.json');

// GET /api/posts - publiczne, pobiera wszystkie posty (dostępne dla wszystkich)
router.get('/', (req, res) => {
    const posts = readJsonFile(blogPostsPath, []);
    // Sortuj posty od najnowszego do najstarszego na podstawie timestamp
    posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    res.json(posts);
});

// GET /api/posts/:id - publiczne, pobiera pojedynczy post
router.get('/:id', (req, res) => {
    const posts = readJsonFile(blogPostsPath, []);
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
});

// POST /api/posts - chronione, tworzenie nowego posta (tylko dla zalogowanych)
router.post('/', protect, (req, res) => {
    const posts = readJsonFile(blogPostsPath, []);
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    const newPost = {
        id: generateUniqueId(),
        title,
        content,
        author: req.user.username || req.body.author || 'Anonymous',
        authorId: req.user.id,
        date: req.body.date || new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        timestamp: Date.now()
    };

    posts.unshift(newPost); // Dodaj nowy post na początku listy
    writeJsonFile(blogPostsPath, posts, res, 'Post saved successfully!', { postId: newPost.id, post: newPost });
});

// PUT /api/posts/:id - chronione, aktualizacja istniejącego posta (tylko dla zalogowanych)
router.put('/:id', protect, (req, res) => {
    const posts = readJsonFile(blogPostsPath, []);
    const postId = req.params.id;
    const { title, content } = req.body;
    const postIndex = posts.findIndex(post => post.id === postId);

    if (postIndex === -1) {
        return res.status(404).json({ error: 'Post with the given ID was not found.' });
    }

    // Sprawdzenie, czy zalogowany użytkownik jest autorem posta
    // W tym przykładzie pozwalamy każdemu zalogowanemu użytkownikowi edytować posty
    // W produkcji powinieneś dodać sprawdzanie authorId
    // if (posts[postIndex].authorId && posts[postIndex].authorId !== req.user.id) {
    //     return res.status(403).json({ error: 'You do not have permission to edit this post.' });
    // }

    const updatedPost = {
        ...posts[postIndex],
        title: title || posts[postIndex].title,
        content: content || posts[postIndex].content,
        date: req.body.date || new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) + ' (edited)',
        timestamp: Date.now() // Aktualizacja timestamp przy edycji
    };

    if (!updatedPost.title || !updatedPost.content) {
        return res.status(400).json({ error: 'Title and content are required.' });
    }

    posts[postIndex] = updatedPost;
    writeJsonFile(blogPostsPath, posts, res, 'Post has been updated', { post: updatedPost });
});

// DELETE /api/posts/:id - chronione, usuwanie posta (tylko dla zalogowanych)
router.delete('/:id', protect, (req, res) => {
    let posts = readJsonFile(blogPostsPath, []);
    const postId = req.params.id;
    const postToDelete = posts.find(post => post.id === postId);

    if (!postToDelete) {
        return res.status(404).json({ error: 'Post with the given ID was not found.' });
    }

    // Sprawdzenie, czy zalogowany użytkownik jest autorem posta
    // W tym przykładzie pozwalamy każdemu zalogowanemu użytkownikowi usuwać posty
    // W produkcji powinieneś dodać sprawdzanie authorId
    // if (postToDelete.authorId && postToDelete.authorId !== req.user.id) {
    //     return res.status(403).json({ error: 'You do not have permission to delete this post.' });
    // }

    const filteredPosts = posts.filter(post => post.id !== postId);
    writeJsonFile(blogPostsPath, filteredPosts, res, 'Post has been deleted');
});

module.exports = router;