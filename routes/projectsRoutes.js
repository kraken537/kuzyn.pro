// nodeapp/routes/projectsRoutes.js
const express = require('express');
const path = require('path');
const { generateUniqueId } = require('../utils/helpers');
const { readJsonFile, writeJsonFile } = require('../utils/fileHandler');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const dataDir = path.join(__dirname, '..', '..', 'public');
const projectsDataPath = path.join(dataDir, 'projects', 'data.json');

// GET /api/projects - publiczne
router.get('/', (req, res) => {
    const projects = readJsonFile(projectsDataPath, []);
    res.json(projects);
});

// POST /api/projects - chronione
router.post('/', protect, (req, res) => {
    const projects = readJsonFile(projectsDataPath, []);
    // Zgodnie z oryginalnym server.js, pola to: title, category, description, status, imageUrl
    // W nowszej wersji było: name, description, technologies, link, image
    // Użyjemy pól z Twojego pierwotnego server.js dla spójności z ewentualnym frontendem
    const { title, category, description, status, imageUrl, technologies, link } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Tytuł i opis projektu są wymagane.' });
    }

    const newProject = {
        id: generateUniqueId(),
        title, // Zamiast 'name'
        category: category || 'Inne',
        description,
        status: status || 'W trakcie',
        imageUrl: imageUrl || `/api/placeholder/400/200`, // Domyślny placeholder
        technologies: technologies ? (Array.isArray(technologies) ? technologies : technologies.split(',').map(t => t.trim())) : [],
        link: link || '',
        date: new Date().toLocaleString('pl-PL'),
        authorId: req.user.id,
        authorUsername: req.user.username
    };

    projects.push(newProject);
    writeJsonFile(projectsDataPath, projects, res, 'Projekt zapisany!', { projectId: newProject.id, project: newProject });
});

// PUT /api/projects/:id - chronione
router.put('/:id', protect, (req, res) => {
    const projects = readJsonFile(projectsDataPath, []);
    const projectId = req.params.id;
    const { title, category, description, status, imageUrl, technologies, link } = req.body;
    const projectIndex = projects.findIndex(project => project.id === projectId);

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Projekt o podanym ID nie został znaleziony.' });
    }

    if (projects[projectIndex].authorId && projects[projectIndex].authorId !== req.user.id) {
        return res.status(403).json({ error: 'Brak uprawnień do edycji tego projektu.' });
    }

    const updatedProject = {
        ...projects[projectIndex],
        title: title || projects[projectIndex].title,
        category: category || projects[projectIndex].category,
        description: description || projects[projectIndex].description,
        status: status || projects[projectIndex].status,
        imageUrl: imageUrl || projects[projectIndex].imageUrl,
        technologies: technologies ? (Array.isArray(technologies) ? technologies : technologies.split(',').map(t => t.trim())) : projects[projectIndex].technologies,
        link: link !== undefined ? link : projects[projectIndex].link, // Umożliwia ustawienie pustego linku
        lastEdited: new Date().toLocaleString('pl-PL'),
        authorId: projects[projectIndex].authorId || req.user.id,
        authorUsername: projects[projectIndex].authorUsername || req.user.username
    };

     if (!updatedProject.title || !updatedProject.description) {
        return res.status(400).json({ error: 'Tytuł i opis projektu są wymagane.' });
    }

    projects[projectIndex] = updatedProject;
    writeJsonFile(projectsDataPath, projects, res, 'Projekt zaktualizowany!', { project: updatedProject });
});

// DELETE /api/projects/:id - chronione
router.delete('/:id', protect, (req, res) => {
    let projects = readJsonFile(projectsDataPath, []);
    const projectId = req.params.id;
    const projectToDelete = projects.find(project => project.id === projectId);

    if (!projectToDelete) {
        return res.status(404).json({ error: 'Projekt o podanym ID nie został znaleziony.' });
    }

    if (projectToDelete.authorId && projectToDelete.authorId !== req.user.id) {
        return res.status(403).json({ error: 'Brak uprawnień do usunięcia tego projektu.' });
    }

    const filteredProjects = projects.filter(project => project.id !== projectId);
    writeJsonFile(projectsDataPath, filteredProjects, res, 'Projekt został usunięty');
});

module.exports = router;