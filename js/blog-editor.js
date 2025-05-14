// Plik do umieszczenia w /public/js/blog-editor.js

// Zmienne globalne
const postContent = document.getElementById('postContent');
const markdownPreview = document.getElementById('markdownPreview');
const emoticonBtn = document.getElementById('emoticonBtn');
const emoticonList = document.getElementById('emoticonList');
const saveButton = document.getElementById('saveButton');
const status = document.getElementById('status');
const postTitle = document.getElementById('postTitle');
const pageTitle = document.getElementById('pageTitle');
let currentPostId = null;
let isEditMode = false;

// Inicjalizacja przy załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    // Sprawdź, czy użytkownik jest zalogowany
    checkAuthentication();
    
    // Konfiguracja parsera markdown
    setupMarkdownRenderer();
    
    // Sprawdź, czy jesteśmy w trybie edycji
    checkEditMode();
    
    // Załaduj szkic, jeśli nie jesteśmy w trybie edycji
    loadDraft();
    
    // Dodaj nasłuchiwanie zdarzeń
    setupEventListeners();
});

// Funkcja sprawdzająca uwierzytelnienie
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        // Użytkownik nie jest zalogowany, przekieruj do strony logowania
        showStatus('You must be logged in to create or edit posts', 'error');
        setTimeout(() => {
            window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }, 2000);
    }
}

// Konfiguracja parsera markdown
function setupMarkdownRenderer() {
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function(code, language) {
            if (language && hljs.getLanguage(language)) {
                return hljs.highlight(code, { language }).value;
            }
            return hljs.highlightAuto(code).value;
        }
    });
}

// Sprawdzenie czy jesteśmy w trybie edycji
function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        isEditMode = true;
        currentPostId = editId;
        pageTitle.textContent = 'Edit Post';
        document.title = 'kuzyn.pro | Blog - Edit Post';
        
        // Pobierz dane postu
        fetchPostData(editId);
    }
}

// Pobieranie danych postu do edycji
function fetchPostData(postId) {
    const token = localStorage.getItem('authToken');
    
    fetch(`/api/posts/${postId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch post');
        }
        return response.json();
    })
    .then(post => {
        // Wypełnij formularz
        postTitle.value = post.title;
        postContent.value = post.content;
        updatePreview();
        
        // Aktualizuj tekst przycisku zapisu
        saveButton.innerHTML = '<i class="fas fa-save"></i> Update Post';
    })
    .catch(error => {
        console.error('Error:', error);
        showStatus('Failed to load post data. Please try again.', 'error');
    });
}

// Aktualizacja podglądu
function updatePreview() {
    const html = marked.parse(postContent.value);
    markdownPreview.innerHTML = html;
    hljs.highlightAll();
    
    // Automatyczne zapisanie do localStorage
    localStorage.setItem('blog_draft_content', postContent.value);
    localStorage.setItem('blog_draft_title', postTitle.value);
}

// Wstawianie znaczników Markdown
function insertMarkdown(startTag, endTag = '') {
    const start = postContent.selectionStart;
    const end = postContent.selectionEnd;
    const selectedText = postContent.value.substring(start, end);
    
    if (selectedText) {
        // Jeśli tekst jest zaznaczony
        postContent.value = postContent.value.substring(0, start) + startTag + selectedText + endTag + postContent.value.substring(end);
        postContent.setSelectionRange(start + startTag.length, start + startTag.length + selectedText.length);
    } else {
        // Jeśli tekst nie jest zaznaczony
        postContent.value = postContent.value.substring(0, start) + startTag + endTag + postContent.value.substring(end);
        postContent.setSelectionRange(start + startTag.length, start + startTag.length);
    }
    
    postContent.focus();
    updatePreview();
}

// Wstawianie linku
function insertLink() {
    const start = postContent.selectionStart;
    const end = postContent.selectionEnd;
    const selectedText = postContent.value.substring(start, end);
    
    let text = selectedText || 'Link text';
    let url = 'https://example.com';
    
    postContent.value = postContent.value.substring(0, start) + '[' + text + '](' + url + ')' + postContent.value.substring(end);
    
    // Jeśli nie ma zaznaczonego tekstu, zaznacz "Link text"
    if (!selectedText) {
        postContent.setSelectionRange(start + 1, start + 10);
    } else {
        // Jeśli tekst był zaznaczony, zaznacz URL
        postContent.setSelectionRange(start + text.length + 3, start + text.length + 3 + url.length);
    }
    
    postContent.focus();
    updatePreview();
}

// Wstawianie obrazu
function insertImage() {
    const start = postContent.selectionStart;
    const end = postContent.selectionEnd;
    const selectedText = postContent.value.substring(start, end);
    
    let altText = selectedText || 'Image description';
    let url = 'https://example.com/image.jpg';
    
    postContent.value = postContent.value.substring(0, start) + '![' + altText + '](' + url + ')' + postContent.value.substring(end);
    
    // Zaznacz URL obrazu
    postContent.setSelectionRange(start + altText.length + 4, start + altText.length + 4 + url.length);
    
    postContent.focus();
    updatePreview();
}

// Wstawianie tabeli
function insertTable() {
    const start = postContent.selectionStart;
    const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    
    postContent.value = postContent.value.substring(0, start) + tableTemplate + postContent.value.substring(start);
    postContent.setSelectionRange(start + 1, start + tableTemplate.length - 1);
    postContent.focus();
    updatePreview();
}

// Ładowanie zapisanego szkicu
function loadDraft() {
    // Ładuj szkic tylko, jeśli nie jesteśmy w trybie edycji
    if (!isEditMode) {
        const savedContent = localStorage.getItem('blog_draft_content');
        const savedTitle = localStorage.getItem('blog_draft_title');
        
        if (savedContent) postContent.value = savedContent;
        if (savedTitle) postTitle.value = savedTitle;
        
        updatePreview();
    }
}

// Konfiguracja nasłuchiwania zdarzeń
function setupEventListeners() {
    // Aktualizacja podglądu podczas pisania
    postContent.addEventListener('input', updatePreview);
    
    postTitle.addEventListener('input', function() {
        localStorage.setItem('blog_draft_title', postTitle.value);
    });
    
    // Obsługa emotikon
    emoticonBtn.addEventListener('click', function(e) {
        e.preventDefault();
        emoticonList.style.display = emoticonList.style.display === 'none' ? 'grid' : 'none';
    });
    
    // Zamknij listę emotikon po kliknięciu poza nią
    document.addEventListener('click', function(e) {
        if (!emoticonBtn.contains(e.target) && !emoticonList.contains(e.target)) {
            emoticonList.style.display = 'none';
        }
    });
    
    // Przycisk zapisu
    saveButton.addEventListener('click', savePost);
    
    // Automatyczne zapisywanie co 30 sekund
    setInterval(updatePreview, 30000);
}

// Zapisywanie posta
function savePost() {
    if (!postTitle.value.trim()) {
        showStatus('Title is required!', 'error');
        postTitle.focus();
        return;
    }
    
    if (!postContent.value.trim()) {
        showStatus('Post content is required!', 'error');
        postContent.focus();
        return;
    }
    
    // Zmień stan przycisku podczas wysyłania
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveButton.disabled = true;
    
    // Pobierz nazwę użytkownika z localStorage lub użyj domyślnej
    const username = localStorage.getItem('username') || 'Admin';
    
    const postData = {
        title: postTitle.value,
        content: postContent.value,
        author: username,
        date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        timestamp: Date.now()
    };
    
    // Pobierz token uwierzytelniający
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        showStatus('You must be logged in to save posts', 'error');
        saveButton.disabled = false;
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Post';
        return;
    }
    
    let apiUrl = '/api/posts';
    let method = 'POST';
    
    // Jeśli jesteśmy w trybie edycji, użyj PUT zamiast POST
    if (isEditMode && currentPostId) {
        apiUrl = `/api/posts/${currentPostId}`;
        method = 'PUT';
    }
    
    // Wyślij dane do API
    fetch(apiUrl, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error saving post');
        }
        return response.json();
    })
    .then(data => {
        const successMessage = isEditMode ? 'Post updated successfully!' : 'Post saved successfully!';
        showStatus(successMessage, 'success');
        
        // Wyczyść szkic, jeśli nie jesteśmy w trybie edycji
        if (!isEditMode) {
            localStorage.removeItem('blog_draft_content');
            localStorage.removeItem('blog_draft_title');
        }
        
        // Przekieruj do strony bloga po 2 sekundach
        setTimeout(() => {
            window.location.href = '/blog';
        }, 2000);
    })
    .catch(error => {
        console.error('Error:', error);
        showStatus('Error saving post. Please try again.', 'error');
        saveButton.innerHTML = isEditMode ? '<i class="fas fa-save"></i> Update Post' : '<i class="fas fa-save"></i> Save Post';
        saveButton.disabled = false;
    });
}

// Wyświetlanie komunikatu statusu
function showStatus(message, type) {
    status.textContent = message;
    status.className = type + ' show';
    
    setTimeout(() => {
        status.className = status.className.replace('show', '');
    }, 5000);
}