document.addEventListener("DOMContentLoaded", function () {
    if (!localStorage.getItem("cookieConsent")) {
        document.getElementById("cookie-banner").style.display = "block";
    }

    document.getElementById("accept-cookies").addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "accepted");
        enableAnalytics();
        document.getElementById("cookie-banner").style.display = "none";
    });

    document.getElementById("decline-cookies").addEventListener("click", function () {
        localStorage.setItem("cookieConsent", "declined");
        document.getElementById("cookie-banner").style.display = "none";
    });
});

function enableAnalytics() {
    // Tutaj wstaw kod uruchamiający Google Analytics, np.
    // gtag('consent', 'update', { 'analytics_storage': 'granted' });
    console.log("Anonimowe statystyki włączone");
}
function enableAnalytics() {
    if (typeof gtag === 'function') {
        gtag('consent', 'update', { 'analytics_storage': 'granted' });
        console.log("Anonimowe statystyki włączone");
    } else {
        console.log("Biblioteka Google Analytics nie została załadowana");
    }
}