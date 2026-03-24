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
        // Use the existing #updateStrip element from the HTML
        updateBanner = document.getElementById('updateStrip');
        if (!updateBanner) {
            // Fallback: create one
            updateBanner = document.createElement('div');
            updateBanner.id = 'updateStrip';
            updateBanner.className = 'update-strip';
            document.body.insertBefore(updateBanner, document.body.firstChild);
        }
        // Wire up dismiss button
        const dismiss = document.getElementById('updateDismiss');
        const updateNow = document.getElementById('updateNowBtn');
        if (dismiss) dismiss.addEventListener('click', () => hideUpdateBanner());
        if (updateNow) updateNow.addEventListener('click', () => { location.reload(); });
    }

    ;