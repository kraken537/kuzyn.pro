// Plik do umieszczenia w /public/js/blog.js

// Funkcje dla strony głównej bloga
document.addEventListener('DOMContentLoaded', () => {
    // Sprawdź, czy użytkownik jest zalogowany, aby pokazać przycisk "Add New Post"
    updateActionButtons();

    // Przygotuj renderer markdown
    setupMarkdownRenderer();
    
    // Pobierz posty
    fetchPosts();
});

// Funkcja do sprawdzania, czy użytkownik jest zalogowany i aktualizacji przycisków akcji
function updateActionButtons() {
    const actionBtnContainer = document.getElementById('action-btn-container');
    const isLoggedIn = localStorage.getItem('authToken');
    
    if (isLoggedIn) {
        actionBtnContainer.innerHTML = `
            <a href="/blog/write.html" class="blog-button">
                <i class="fas fa-pen"></i> Add New Post
            </a>
        `;
    } else {
        actionBtnContainer.innerHTML = ''; // Ukryj przycisk dla niezalogowanych
    }
}

// Konfiguracja parsera markdown
function setupMarkdownRenderer() {
    marked.setOptions({
        highlight: function(code, language) {
            if (language && hljs.getLanguage(language)) {
                return hljs.highlight(code, { language }).value;
            }
            return hljs.highlightAuto(code).value;
        },
        breaks: true,
        gfm: true
    });

    const renderer = new marked.Renderer();

    renderer.image = function(href, title, text) {
        return `<img src="${href}" alt="${text}" title="${title || ''}" loading="lazy">`;
    };

    marked.use({ renderer });
}

// Pobieranie postów
function fetchPosts() {
    // Małe opóźnienie dla efektu ładowania
    setTimeout(() => {
        fetch('/api/posts')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network or server error');
                }
                return response.json();
            })
            .then(posts => {
                const postsContainer = document.getElementById('blog-posts-container');
                postsContainer.innerHTML = ''; // Usuń spinner ładowania
                
                if (posts.length === 0) {
                    postsContainer.innerHTML = '<div class="no-posts">No posts to display. Be the first to add a new post!</div>';
                    return;
                }
                
                // Opóźnione ładowanie postów dla efektu kaskadowego
                posts.forEach((post, index) => {
                    setTimeout(() => {
                        addPostToDOM(post, postsContainer);
                    }, index * 200);
                });
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
                const postsContainer = document.getElementById('blog-posts-container');
                postsContainer.innerHTML = '<div class="no-posts">An error occurred while fetching posts. Try refreshing the page.</div>';
            });
    }, 500);
}

// Dodanie postu do DOM
function addPostToDOM(post, container) {
    const html = marked.parse(post.content);
    const postElement = document.createElement('article');
    postElement.className = 'blog-post';
    postElement.setAttribute('data-post-id', post.id);
    
    // Sprawdź, czy użytkownik jest zalogowany
    const isLoggedIn = localStorage.getItem('authToken');
    
    // Podstawowa zawartość postu
    let postContent = `
        <h2>${post.title}</h2>
        <div class="post-meta">
            <span><i class="far fa-calendar-alt"></i> ${post.date || 'Unknown date'}</span>
            <span><i class="far fa-user"></i> ${post.author || 'Unknown author'}</span>
        </div>
        <div class="post-content">${html}</div>
    `;
    
    // Dodaj przyciski edycji/usuwania tylko dla zalogowanych użytkowników
    if (isLoggedIn) {
        postContent += `
            <div class="post-actions">
                <button class="post-action-btn edit-btn" onclick="editPost('${post.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="post-action-btn delete-btn" onclick="showDeleteModal('${post.id}')">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        `;
    }
    
    postElement.innerHTML = postContent;
    container.appendChild(postElement);
    hljs.highlightAll();
}

// Funkcja edycji postu
function editPost(postId) {
    window.location.href = `/blog/write.html?edit=${postId}`;
}

// Funkcje modalu usuwania
let currentPostId = null;

function showDeleteModal(postId) {
    currentPostId = postId;
    const modal = document.getElementById('deleteModal');
    modal.classList.add('show');
    
    // Ustaw przycisk potwierdzenia
    document.getElementById('confirmDeleteBtn').onclick = () => {
        deletePost(currentPostId);
    };
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
    currentPostId = null;
}

// Funkcja usuwania postu
function deletePost(postId) {
    // Pobierz token uwierzytelniający z localStorage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        alert('You must be logged in to delete posts');
        closeDeleteModal();
        return;
    }
    
    fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error deleting post');
        }
        return response.json();
    })
    .then(data => {
        // Zamknij modal
        closeDeleteModal();
        
        // Usuń post z DOM
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.style.opacity = '0';
            postElement.style.transform = 'translateY(20px)';
            setTimeout(() => {
                postElement.remove();
                
                // Sprawdź, czy nie ma już żadnych postów
                const postsContainer = document.getElementById('blog-posts-container');
                if (postsContainer.children.length === 0) {
                    postsContainer.innerHTML = '<div class="no-posts">No posts to display. Be the first to add a new post!</div>';
                }
            }, 300);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        closeDeleteModal();
        alert('Failed to delete the post. Please try again.');
    });
}