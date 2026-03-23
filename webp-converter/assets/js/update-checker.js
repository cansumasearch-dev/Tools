/**
 * Update Checker
 * Checks for new app versions every 30 seconds and shows update banner
 */

(function() {
    'use strict';

    const UPDATE_CHECK_INTERVAL = 30 * 1000; // 30 seconds (changed from 1 hour)
    const VERSION_URL = './assets/json/version.json';
    const STORAGE_KEY = 'webp_converter_version';
    const DISMISSED_KEY = 'webp_converter_update_dismissed';

    let currentVersion = null;
    let updateBanner = null;
    let checkIntervalId = null;

    /**
     * Initialize the update checker
     */
    function init() {
        // Create banner element
        createUpdateBanner();
        
        // Get stored version
        currentVersion = localStorage.getItem(STORAGE_KEY);
        
        // Check immediately on load
        checkForUpdates();
        
        // Then check every 30 seconds
        checkIntervalId = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
        
        console.log('🔄 Update checker initialized (checking every 30 seconds)');
    }

    /**
     * Create the update banner element
     */
    function createUpdateBanner() {
        updateBanner = document.createElement('div');
        updateBanner.id = 'updateBanner';
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-banner-content">
                <i class="fas fa-arrow-circle-up"></i>
                <span class="update-message">A new version is available!</span>
                <button class="update-btn" id="updateNowBtn">
                    <i class="fas fa-sync-alt me-1"></i>Update Now
                </button>
                <button class="update-dismiss" id="dismissUpdateBtn" title="Dismiss">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Insert at the very top of body
        document.body.insertBefore(updateBanner, document.body.firstChild);
        
        // Bind events
        document.getElementById('updateNowBtn').addEventListener('click', applyUpdate);
        document.getElementById('dismissUpdateBtn').addEventListener('click', dismissUpdate);
    }

    /**
     * Check for updates by fetching version.json
     */
    async function checkForUpdates() {
        try {
            // Add cache-busting parameter
            const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error('Version file not found');
            }
            
            const data = await response.json();
            const newVersion = data.version || data.timestamp || data.hash;
            const updateMessage = data.message || 'A new version is available!';
            
            console.log(`📦 Current: ${currentVersion || 'none'}, Latest: ${newVersion}`);
            
            // First time - just store the version
            if (!currentVersion) {
                localStorage.setItem(STORAGE_KEY, newVersion);
                currentVersion = newVersion;
                console.log('✅ Version stored:', newVersion);
                return;
            }
            
            // Check if dismissed version is the same as new version
            const dismissedVersion = localStorage.getItem(DISMISSED_KEY);
            if (dismissedVersion === newVersion) {
                return; // User already dismissed this version
            }
            
            // Compare versions - ANY change triggers update
            if (String(newVersion) !== String(currentVersion)) {
                console.log('🆕 New version detected!');
                console.log('   Old:', currentVersion);
                console.log('   New:', newVersion);
                
                // Stop checking to prevent multiple banners
                if (checkIntervalId) {
                    clearInterval(checkIntervalId);
                    checkIntervalId = null;
                }
                
                showUpdateBanner(updateMessage, newVersion);
            }
            
        } catch (error) {
            console.warn('⚠️ Update check failed:', error.message);
        }
    }

    /**
     * Show the update banner
     */
    function showUpdateBanner(message, version) {
        const messageEl = updateBanner.querySelector('.update-message');
        messageEl.innerHTML = `<strong>New Update (v${version}):</strong> ${message}`;
        
        updateBanner.classList.add('visible');
        
        // Adjust body padding to account for banner
        document.body.style.paddingTop = '50px';
        
        console.log('🎉 Update banner displayed');
    }

    /**
     * Hide the update banner
     */
    function hideUpdateBanner() {
        updateBanner.classList.remove('visible');
        document.body.style.paddingTop = '';
    }

    /**
     * Apply the update (reload page)
     */
    function applyUpdate() {
        console.log('🔄 Applying update...');
        
        // Clear the stored version so it gets updated after reload
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DISMISSED_KEY);
        
        // Force reload without cache
        window.location.reload(true);
    }

    /**
     * Dismiss the update notification
     */
    function dismissUpdate() {
        console.log('✖️ Update dismissed');
        
        // Store which version was dismissed
        fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                const version = data.version || data.timestamp || data.hash;
                localStorage.setItem(DISMISSED_KEY, version);
                console.log('💾 Dismissed version saved:', version);
            })
            .catch(err => {
                console.warn('⚠️ Could not save dismissed version:', err);
            });
        
        hideUpdateBanner();
        
        // Restart checking after dismissal
        if (!checkIntervalId) {
            checkIntervalId = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);
            console.log('▶️ Update checking resumed');
        }
    }

    /**
     * Manually trigger update check (for testing)
     */
    window.checkForUpdates = checkForUpdates;

    /**
     * Force show update banner (for testing)
     */
    window.showUpdateBanner = function() {
        showUpdateBanner('Test update message!', '9.9.9');
    };

    /**
     * Clear version storage (for testing)
     */
    window.clearVersionStorage = function() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DISMISSED_KEY);
        console.log('🗑️ Version storage cleared');
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();