/**
 * App Initialization
 * Main entry point that initializes the ImageConverter and sets up global event handlers
 * 
 * Load order:
 * 1. converter.js    - Main ImageConverter class
 * 2. pagespeed.js    - PageSpeed Insights module
 * 3. changelog.js    - Changelog module
 * 4. app.js          - This file (initialization)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the converter
    window.converter = new ImageConverter();

    // ============================================================
    // KEYBOARD SHORTCUTS
    // ============================================================
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'o':
                    // Ctrl/Cmd + O: Open file dialog
                    e.preventDefault();
                    document.getElementById('fileInput').click();
                    break;

                case 'Enter':
                    // Ctrl/Cmd + Enter: Start conversion
                    e.preventDefault();
                    if (!window.converter.isConverting && window.converter.files.length > 0) {
                        window.converter.startConversion();
                    }
                    break;
            }
        }
    });

    // ============================================================
    // PREVENT DEFAULT DRAG & DROP BEHAVIOR
    // ============================================================
    document.addEventListener('dragenter', (e) => e.preventDefault());
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    // ============================================================
    // SMOOTH SCROLLING
    // ============================================================
    document.documentElement.style.scrollBehavior = 'smooth';

    // ============================================================
    // DEBUG INFO (only in development)
    // ============================================================
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🚀 WebP Converter initialized');
        console.log('📦 Modules loaded: converter, pagespeed, changelog');
        console.log('⌨️ Shortcuts: Ctrl+O (open), Ctrl+Enter (convert)');
    }
});