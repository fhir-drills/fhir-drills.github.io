/**
 * FHIR version switcher (R4 / R5) for FHIR Drills.
 *
 * Load this from <head> (so before js/main.js):
 * it puts a `fhir-r4` / `fhir-r5` class on <html> straight away (so
 * version-specific content never flashes) and exposes `window.fhirVersion`,
 * which js/main.js reads to pick an R4 or R5 test server and example files.
 *
 * R4 is the default. With R4 selected, nothing on the page is changed apart
 * from adding the switcher itself. With R5 selected, once the DOM is ready:
 *  - links to the R4 spec (hl7.org/fhir/R4/...) are pointed at the R5 spec,
 *    and "R4" in their text/title (e.g. "FHIR R4 Release") becomes "R5";
 *  - "(version 4.0.1)" right after such a link becomes "(version 5.0.0)";
 *  - links to example files that have an R5 copy under resource-examples/R5/
 *    are pointed at that copy;
 *  - elements marked class="fhir-r4-only" / "fhir-r5-only" are hidden/shown
 *    (by css/version-switcher.css, keyed off the <html> class).
 *
 * The choice is kept in localStorage and can also be given in the URL as
 * ?fhir=r5 (or ?fhir=r4), which wins over the stored value. Changing it
 * reloads the page so the server selection, uploads and examples all match.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'preferred-fhir-version';
    var URL_PARAM = 'fhir';
    var DEFAULT_VERSION = 'r4';

    var VERSIONS = {
        r4: { id: 'r4', name: 'R4', number: '4.0.1' },
        r5: { id: 'r5', name: 'R5', number: '5.0.0' }
    };

    // Example files whose R4 content is not valid R5. Each has a copy at the
    // same path under resource-examples/R5/. Files not listed here are valid
    // in both versions and are used as they are.
    var R5_EXAMPLES = [
        'resource-examples/Encounter-f001.json',
        'resource-examples/ServiceRequest-f001.json',
        'resource-examples/Observation-f001.json',
        'resource-examples/Observation-f002.json',
        'resource-examples/ConceptMap-resources/ConceptMap.json',
        'resource-examples/sam-fhir-journey/Bundle.json'
    ];

    // Spec pages that have a different name in R5.
    var R5_RENAMED_PAGES = {
        'valueset-concept-map-equivalence.html': 'valueset-concept-map-relationship.html'
    };

    var SPEC_R4 = /^(https?:\/\/(?:www\.)?hl7\.org\/fhir\/)R4(?=\/|#|$)(\/?)([^#?]*)(.*)$/i;

    function normalise(version) {
        version = String(version || '').toLowerCase();
        return VERSIONS.hasOwnProperty(version) ? version : null;
    }

    function readStorage() {
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function writeStorage(version) {
        try {
            window.localStorage.setItem(STORAGE_KEY, version);
            return window.localStorage.getItem(STORAGE_KEY) === version;
        } catch (e) {
            return false;
        }
    }

    function readUrlParam() {
        try {
            return new URLSearchParams(window.location.search).get(URL_PARAM);
        } catch (e) {
            return null;
        }
    }

    var urlVersion = normalise(readUrlParam());
    var current = urlVersion || normalise(readStorage()) || DEFAULT_VERSION;
    var storageWorks = writeStorage(current);

    document.documentElement.classList.add('fhir-' + current);
    document.documentElement.setAttribute('data-fhir-version', current);

    // Reflect a non-default version in the address bar so the page can be shared.
    if (current !== DEFAULT_VERSION && !urlVersion) {
        try {
            var here = new URL(window.location.href);
            here.searchParams.set(URL_PARAM, current);
            window.history.replaceState(window.history.state, '', here);
        } catch (e) { /* not important */ }
    }

    // Path of the example file to use for the selected version.
    function examplePath(path) {
        if (current === 'r5' && R5_EXAMPLES.indexOf(path) !== -1) {
            return path.replace(/^resource-examples\//, 'resource-examples/R5/');
        }
        return path;
    }

    // R5 equivalent of an R4 spec URL (anything else is returned unchanged).
    function specUrl(url) {
        if (current !== 'r5') {
            return url;
        }
        var m = SPEC_R4.exec(url);
        if (!m) {
            return url;
        }
        var page = R5_RENAMED_PAGES[m[3]] || m[3];
        return m[1] + 'R5' + m[2] + page + m[4];
    }

    function replaceR4InText(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = node.nodeValue.replace(/\bR4\b/g, 'R5');
        } else {
            for (var i = 0; i < node.childNodes.length; i++) {
                replaceR4InText(node.childNodes[i]);
            }
        }
    }

    function updateSpecLinks() {
        var links = document.querySelectorAll('a[href]');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var href = link.getAttribute('href');
            var newHref = specUrl(href);
            if (newHref !== href) {
                link.setAttribute('href', newHref);
                replaceR4InText(link);
                if (link.title) {
                    link.title = link.title.replace(/\bR4\b/g, 'R5');
                }
                // "<a>FHIR R4</a> (version 4.0.1)" -> "<a>FHIR R5</a> (version 5.0.0)"
                var next = link.nextSibling;
                if (next && next.nodeType === Node.TEXT_NODE && /^\s*\([^()]*\b4\.0\.1\)/.test(next.nodeValue)) {
                    next.nodeValue = next.nodeValue.replace('4.0.1', VERSIONS[current].number);
                }
            } else if (/^resource-examples\//.test(href)) {
                link.setAttribute('href', examplePath(href));
            }
        }
    }

    // Without localStorage, carry the choice to other pages in the URL instead.
    function carryVersionInLinks() {
        var links = document.querySelectorAll('a[href]');
        for (var i = 0; i < links.length; i++) {
            var href = links[i].getAttribute('href');
            if (/^(\.\/)?[\w-]+\.html([?#].*)?$/i.test(href)) {
                var url = new URL(href, window.location.href);
                url.searchParams.set(URL_PARAM, current);
                links[i].setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
            }
        }
    }

    function setVersion(version) {
        version = normalise(version);
        if (!version || version === current) {
            return;
        }
        writeStorage(version);
        var url = new URL(window.location.href);
        url.searchParams.set(URL_PARAM, version);
        window.location.assign(url.toString());
    }

    function buildSwitcher() {
        var headerRow = document.querySelector('.mdl-layout__header-row');
        if (!headerRow || document.getElementById('fhir-version-select')) {
            return;
        }

        var wrapper = document.createElement('div');
        wrapper.className = 'fhir-version-switcher';
        wrapper.innerHTML =
            '<label for="fhir-version-select">' +
                '<span class="lang-content lang-en inline">FHIR version</span>' +
                '<span class="lang-content lang-ru inline">Версия FHIR</span>' +
            '</label>' +
            '<select id="fhir-version-select" class="fhir-version-dropdown"' +
                ' title="Choose which FHIR version the tutorials, examples and test server use">' +
                '<option value="r4">R4 (4.0.1)</option>' +
                '<option value="r5">R5 (5.0.0)</option>' +
            '</select>';

        var select = wrapper.querySelector('select');
        select.value = current;
        select.addEventListener('change', function () {
            setVersion(select.value);
        });

        // after the spacer, so it sits on the right next to the search box
        var spacer = headerRow.querySelector('.mdl-layout-spacer');
        headerRow.insertBefore(wrapper, spacer ? spacer.nextSibling : headerRow.firstChild);
    }

    function applyToPage() {
        buildSwitcher();
        if (current !== DEFAULT_VERSION) {
            updateSpecLinks();
            if (!storageWorks) {
                carryVersionInLinks();
            }
        }
    }

    window.fhirVersion = {
        current: current,
        name: VERSIONS[current].name,
        number: VERSIONS[current].number,
        examplePath: examplePath,
        specUrl: specUrl,
        set: setVersion
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyToPage);
    } else {
        applyToPage();
    }
})();
