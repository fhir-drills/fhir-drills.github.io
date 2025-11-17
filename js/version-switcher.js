/**
 * FHIR Version Switcher for FHIR Drills
 * Handles R4/R5 version switching across the site
 */
class VersionSwitcher {
    constructor() {
        this.init();
    }

    init() {
        // Run initialization when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeVersion());
        } else {
            this.initializeVersion();
        }
    }

    switchVersion(version) {
        // Remove existing version classes
        document.body.classList.remove('version-r4', 'version-r5');

        // Add new version class
        document.body.classList.add('version-' + version);

        // Update dropdown selection
        const dropdown = document.getElementById('version-dropdown');
        if (dropdown) {
            dropdown.value = version;
        }

        // Save preference to localStorage
        localStorage.setItem('preferred-fhir-version', version);

        // Update URL parameter
        this.updateUrlWithVersion(version);

        // Notify main.js to update server endpoints
        if (window.updateServersForVersion) {
            window.updateServersForVersion(version);
        }
    }

    initializeVersion() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const urlVersion = urlParams.get('version');

        // Then check localStorage
        const savedVersion = localStorage.getItem('preferred-fhir-version');

        // Default to R4
        const defaultVersion = 'r4';

        // Determine which version to use
        const currentVersion = urlVersion || savedVersion || defaultVersion;

        // Apply the version
        this.switchVersion(currentVersion);
    }

    updateUrlWithVersion(version) {
        const url = new URL(window.location);
        url.searchParams.set('version', version);
        window.history.replaceState({}, '', url);
    }
}

// Initialize the version switcher
const versionSwitcher = new VersionSwitcher();

// Make switchVersion available globally for onclick handlers
window.switchVersion = (version) => versionSwitcher.switchVersion(version);
