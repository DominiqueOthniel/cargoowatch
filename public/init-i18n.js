// Script d'initialisation rapide pour i18n
(function() {
    function initI18n() {
        if (window.i18n) {
            console.log('i18n initialized, applying translations...');
            window.i18n.updatePage();
            return true;
        }
        return false;
    }
    
    // Essayer immédiatement
    if (initI18n()) return;
    
    // Si pas disponible, attendre DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                if (!initI18n()) {
                    // Dernier essai après 500ms
                    setTimeout(initI18n, 500);
                }
            }, 100);
        });
    } else {
        // DOM déjà chargé
        setTimeout(function() {
            if (!initI18n()) {
                setTimeout(initI18n, 500);
            }
        }, 100);
    }
})();

