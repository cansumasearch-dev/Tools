(function() {
    'use strict';

    // ===== Elements =====
    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const sizeRange = document.getElementById('sizeRange');
    const sizeValue = document.getElementById('sizeValue');
    const errorLevel = document.getElementById('errorLevel');
    const fgColor = document.getElementById('fgColor');
    const bgColor = document.getElementById('bgColor');
    const qrPreview = document.getElementById('qrPreview');
    const actions = document.getElementById('actions');
    const downloadPng = document.getElementById('downloadPng');
    const downloadSvg = document.getElementById('downloadSvg');
    const copyImage = document.getElementById('copyImage');
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const toast = document.getElementById('toast');

    let currentText = '';
    let currentQR = null;
    const HISTORY_KEY = 'qr_generator_history';
    const MAX_HISTORY = 20;

    // ===== Toast Notification =====
    function showToast(message, duration = 2500) {
        toast.textContent = message;
        toast.classList.add('toast--visible');
        setTimeout(() => {
            toast.classList.remove('toast--visible');
        }, duration);
    }

    // ===== Size Display =====
    sizeRange.addEventListener('input', function() {
        sizeValue.textContent = this.value;
        if (currentText) generateQR();
    });

    // ===== Auto-Generate on Option Change =====
    [errorLevel, fgColor, bgColor].forEach(el => {
        el.addEventListener('change', function() {
            if (currentText) generateQR();
        });
    });

    // ===== Generate QR Code =====
    function generateQR() {
        const text = urlInput.value.trim();
        if (!text) {
            showToast('Bitte gib eine URL oder Text ein');
            return;
        }

        currentText = text;
        const size = parseInt(sizeRange.value);

        try {
            // qrcode-generator API
            // typeNumber: 0 = auto-detect
            const qr = qrcode(0, errorLevel.value);
            qr.addData(text);
            qr.make();

            currentQR = qr;

            // Auf Canvas zeichnen
            const moduleCount = qr.getModuleCount();
            const moduleSize = Math.floor(size / (moduleCount + 8)); // +8 für Quiet-Zone (4 Module pro Seite)
            const actualSize = moduleSize * (moduleCount + 8);
            const offset = moduleSize * 4;

            const canvas = document.createElement('canvas');
            canvas.width = actualSize;
            canvas.height = actualSize;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = bgColor.value;
            ctx.fillRect(0, 0, actualSize, actualSize);

            // QR Module zeichnen
            ctx.fillStyle = fgColor.value;
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(
                            col * moduleSize + offset,
                            row * moduleSize + offset,
                            moduleSize,
                            moduleSize
                        );
                    }
                }
            }

            qrPreview.innerHTML = '';
            qrPreview.appendChild(canvas);
            actions.hidden = false;

            addToHistory(text);
        } catch (err) {
            console.error('QR generation error:', err);
            showToast('Fehler: ' + err.message);
        }
    }

    generateBtn.addEventListener('click', generateQR);
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') generateQR();
    });

    // ===== Download as PNG =====
    downloadPng.addEventListener('click', function() {
        const canvas = qrPreview.querySelector('canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('PNG heruntergeladen');
    });

    // ===== Download as SVG =====
    downloadSvg.addEventListener('click', function() {
        if (!currentQR) return;

        try {
            const moduleCount = currentQR.getModuleCount();
            const moduleSize = 10;
            const quietZone = moduleSize * 4;
            const totalSize = moduleSize * moduleCount + quietZone * 2;

            let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
            svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;
            svg += `<rect width="${totalSize}" height="${totalSize}" fill="${bgColor.value}"/>`;
            svg += `<g fill="${fgColor.value}">`;

            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (currentQR.isDark(row, col)) {
                        const x = col * moduleSize + quietZone;
                        const y = row * moduleSize + quietZone;
                        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}"/>`;
                    }
                }
            }

            svg += `</g></svg>`;

            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            showToast('SVG heruntergeladen');
        } catch (err) {
            console.error('SVG download error:', err);
            showToast('Fehler beim SVG-Download');
        }
    });

    // ===== Copy to Clipboard =====
    copyImage.addEventListener('click', function() {
        const canvas = qrPreview.querySelector('canvas');
        if (!canvas) return;

        try {
            canvas.toBlob(async function(blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    showToast('In Zwischenablage kopiert');
                } catch (err) {
                    showToast('Browser unterstützt das Kopieren nicht');
                }
            }, 'image/png');
        } catch (err) {
            showToast('Fehler beim Kopieren');
        }
    });

    // ===== History Management =====
    function getHistory() {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (err) {
            return [];
        }
    }

    function saveHistory(history) {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (err) {
            console.error('Could not save history:', err);
        }
    }

    function addToHistory(text) {
        let history = getHistory();
        history = history.filter(item => item.text !== text);
        history.unshift({
            text: text,
            timestamp: Date.now()
        });
        if (history.length > MAX_HISTORY) {
            history = history.slice(0, MAX_HISTORY);
        }
        saveHistory(history);
        renderHistory();
    }

    function renderHistory() {
        const history = getHistory();
        if (history.length === 0) {
            historySection.hidden = true;
            return;
        }

        historySection.hidden = false;
        historyList.innerHTML = '';

        history.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <span class="history-item__url" title="Klicken zum erneut generieren">${escapeHtml(item.text)}</span>
                <button class="history-item__delete" data-index="${index}" title="Löschen">✕</button>
            `;

            li.querySelector('.history-item__url').addEventListener('click', function() {
                urlInput.value = item.text;
                generateQR();
            });

            li.querySelector('.history-item__delete').addEventListener('click', function() {
                deleteHistoryItem(index);
            });

            historyList.appendChild(li);
        });
    }

    function deleteHistoryItem(index) {
        const history = getHistory();
        history.splice(index, 1);
        saveHistory(history);
        renderHistory();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearHistoryBtn.addEventListener('click', function() {
        if (confirm('Möchtest du wirklich die gesamte Historie löschen?')) {
            localStorage.removeItem(HISTORY_KEY);
            renderHistory();
            showToast('Historie gelöscht');
        }
    });

    // ===== Initial Render =====
    renderHistory();
})();
