/**
 * Language Switcher for FHIR Drills
 * Handles multi-language functionality across the site
 */
class LanguageSwitcher {
    constructor() {
        this.init();
    }

    init() {
        // Run initialization when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeLanguage());
        } else {
            this.initializeLanguage();
        }
    }

    switchLanguage(lang) {
        // Remove existing language classes
        document.body.classList.remove('lang-en', 'lang-ru');
        
        // Add new language class
        document.body.classList.add('lang-' + lang);
        
        // Update active button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById('lang-' + lang + '-btn');
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Save preference to localStorage
        localStorage.setItem('preferred-language', lang);
        
        // Update HTML lang attribute for accessibility
        document.documentElement.lang = lang;
        
        // Update URL parameter
        this.updateUrlWithLanguage(lang);
    }
    
    initializeLanguage() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        
        // Then check localStorage
        const savedLang = localStorage.getItem('preferred-language');
        
        // Default to English
        const defaultLang = 'en';
        
        // Determine which language to use
        const currentLang = urlLang || savedLang || defaultLang;
        
        // Apply the language
        this.switchLanguage(currentLang);
    }
    
    updateUrlWithLanguage(lang) {
        const url = new URL(window.location);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url);
    }
}

// Initialize the language switcher
const languageSwitcher = new LanguageSwitcher();

// Make switchLanguage available globally for onclick handlers
window.switchLanguage = (lang) => languageSwitcher.switchLanguage(lang);
