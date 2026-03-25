/**
 * Update Checker
 * Checks for new app versions every 30 seconds and shows update banner
 */
(function() {
    'use strict';

    const UPDATE_CHECK_INTERVAL = 30 * 1000;
    const VERSION_URL = './assets/json/version.json';
    const STORAGE_KEY = 'webp_converter_version';

    let currentVersion = null;
    let updateBanner   = null;

    function init() {
        createUpdateBanner();
        currentVersion = localStorage.getItem(STORAGE_KEY);
        checkForUpdates();
        setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
        console.log('🔄 Update checker initialized (checking every 30 seconds)');
    }

    function createUpdateBanner() {
        updateBanner = document.getElementById('updateStrip');
        if (!updateBanner) {
            updateBanner = document.createElement('div');
            updateBanner.id = 'updateStrip';
            updateBanner.className = 'update-strip';
            document.body.insertBefore(updateBanner, document.body.firstChild);
        }
        const dismiss   = document.getElementById('updateDismiss');
        const updateNow = document.getElementById('updateNowBtn');
        if (dismiss)   dismiss.addEventListener('click',   () => hideUpdateBanner());
        if (updateNow) updateNow.addEventListener('click', () => {
            // Save the latest version before reload so banner won't reappear
            fetch(VERSION_URL + '?t=' + Date.now())
                .then(r => r.json())
                .then(data => {
                    const v = data.version || data.hash || String(data.timestamp);
                    localStorage.setItem(STORAGE_KEY, v);
                    location.reload();
                })
                .catch(() => location.reload());
        });
    }

    async function checkForUpdates() {
        try {
            const res  = await fetch(VERSION_URL + '?t=' + Date.now());
            const data = await res.json();
            const latestVersion = data.version || data.hash || String(data.timestamp);

            console.log('📦 Current:', currentVersion, ', Latest:', latestVersion);

            if (!currentVersion) {
                // First visit — just store and don't show banner
                localStorage.setItem(STORAGE_KEY, latestVersion);
                currentVersion = latestVersion;
                return;
            }

            if (currentVersion !== latestVersion) {
                showUpdateBanner('A new version is available!', latestVersion);
            }
        } catch (err) {
            console.warn('Update check failed:', err);
        }
    }

    function showUpdateBanner(message, newVersion) {
        const msgEl = document.getElementById('updateMsg');
        if (msgEl) msgEl.textContent = message;
        if (updateBanner) {
            updateBanner.classList.add('show');
            document.body.classList.add('update-visible');
        }
    }

    function hideUpdateBanner() {
        if (updateBanner) {
            updateBanner.classList.remove('show');
            document.body.classList.remove('update-visible');
        }
        // Fetch and store latest version so banner stays gone until next real update
        fetch(VERSION_URL + '?t=' + Date.now())
            .then(r => r.json())
            .then(data => {
                const v = data.version || data.hash || String(data.timestamp);
                localStorage.setItem(STORAGE_KEY, v);
                currentVersion = v;
            })
            .catch(() => {});
    }

    // Force show for testing
    window.showUpdateBanner = () => showUpdateBanner('Test update!', 'test');

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
