// Plik który należy umieścić w lokalizacji /public/js/auth.js

// Funkcja do weryfikacji autentykacji użytkownika
function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

// Funkcja do weryfikacji, czy token jest ważny
async function validateToken() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return false;
    }

    try {
        // Możesz stworzyć endpoint do weryfikacji tokenu
        const response = await fetch('/api/auth/validate', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            return true;
        } else {
            // Token nieważny, wyczyść dane logowania
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            localStorage.removeItem('userId');
            return false;
        }
    } catch (error) {
        console.error('Error validating token:', error);
        return false; // W przypadku błędu zakładamy, że token jest nieprawidłowy
    }
}

// Funkcja do wylogowania użytkownika
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = '/login.html';
}

// Funkcja do dodania przycisków logowania/wylogowania i nazwy użytkownika do nawigacji
function updateNavigation() {
    const isLoggedIn = isAuthenticated();
    const navElement = document.querySelector('nav ul');
    
    if (!navElement) return;
    
    // Usuń istniejące przyciski logowania/wylogowania (jeśli istnieją)
    const existingAuthLinks = document.querySelectorAll('.auth-link');
    existingAuthLinks.forEach(link => link.remove());
    
    // Dodaj odpowiednie przyciski
    const authLinkItem = document.createElement('li');
    authLinkItem.className = 'auth-link';
    
    if (isLoggedIn) {
        const username = localStorage.getItem('username');
        if (username) {
            const userSpan = document.createElement('span');
            userSpan.className = 'username';
            userSpan.innerHTML = `<i class="fas fa-user"></i> ${username}`;
            userSpan.style.color = 'var(--accent-color)';
            userSpan.style.marginRight = '15px';
            
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
            
            authLinkItem.appendChild(userSpan);
            authLinkItem.appendChild(logoutLink);
        }
    } else {
        const loginLink = document.createElement('a');
        loginLink.href = '/login.html';
        loginLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        authLinkItem.appendChild(loginLink);
    }
    
    navElement.appendChild(authLinkItem);
}

// Funkcja do zabezpieczenia strony (przekierowanie na login, jeśli użytkownik nie jest zalogowany)
async function protectPage() {
    const publicPages = ['/login.html', '/index.html', '/', '/blog'];
    const currentPath = window.location.pathname;
    
    // Nie zabezpieczaj publicznych stron
    if (publicPages.some(page => currentPath === page || currentPath.startsWith(page + '/'))) {
        return;
    }
    
    // Sprawdź, czy użytkownik jest zalogowany
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(currentPath);
        return;
    }
    
    // Opcjonalnie: weryfikuj token na serwerze
    const isValid = await validateToken();
    if (!isValid) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(currentPath);
    }
}

// Inicjalizacja - wywołaj po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    
    // Jeśli nie jesteśmy na stronie logowania, zabezpiecz stronę
    if (!window.location.pathname.includes('login.html')) {
        protectPage();
    }
});