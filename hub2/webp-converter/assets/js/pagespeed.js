/**
 * PageSpeed Insights Module
 * Handles PageSpeed analysis, results display, and optimization tips
 * This file extends the ImageConverter class with PageSpeed functionality
 */

ImageConverter.prototype.displayCurrentStrategy = function() {
    const data = this.currentPageSpeedData[this.pagespeedStrategy];

    if (!data) {
        this.pagespeedResults.innerHTML = `
            <div class="metrics-section">
                <h3><i class="fas fa-info-circle me-2"></i>No Data Available</h3>
                <p class="no-data-message">
                    ${this.pagespeedStrategy === 'mobile' ? 'Mobile' : 'Desktop'} data not yet analyzed. Please run an analysis first.
                </p>
            </div>
        `;
        this.pagespeedResults.classList.remove('d-none');
        return;
    }

    // Preserve current accordion states before switching
    this.saveAccordionStates();
    
    this.displayPageSpeedResults(data, this.pagespeedStrategy);
};

ImageConverter.prototype.analyzePageSpeed = async function() {
    if (!this.pagespeedUrl) return;
    if (this.isAnalyzingPageSpeed) return;

    let url = this.pagespeedUrl.value.trim();

    if (!url) {
        alert('Please enter a URL to analyze');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    try {
        new URL(url);
    } catch (e) {
        alert('Please enter a valid URL (e.g., https://example.com)');
        return;
    }

    this.isAnalyzingPageSpeed = true;
    console.log('🚀 Starting SIMULTANEOUS mobile + desktop analysis');

    // Reset accordion states for new analysis (all open by default)
    this.accordionStates = {
        'performance': true,
        'accessibility': true,
        'best-practices': true,
        'seo': true
    };

    this.pagespeedLoading.classList.remove('d-none');
    this.pagespeedResults.classList.add('d-none');
    this.analyzePageSpeedBtn.disabled = true;
    this.analyzePageSpeedBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>Analyzing Both...`;

    this.pagespeedLoading.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-text">Analyzing Performance...</p>
            <p class="loading-hint">This may take 20-30 seconds...</p>
        </div>
    `;

    try {
        // Cloudflare Worker URL
        const workerBaseUrl = 'https://pagespeed-insights.can-akcam.workers.dev';

        const [mobileResponse, desktopResponse] = await Promise.all([
            fetch(`${workerBaseUrl}?url=${encodeURIComponent(url)}&strategy=mobile`).then(async res => {
                const data = await res.json();
                const status = document.getElementById('mobileStatus');
                if (data.error) {
                    if (status) status.textContent = '✗ Error';
                    throw new Error(`Mobile: ${data.error.message || 'Unknown error'}`);
                }
                if (status) status.textContent = '✓ Complete';
                return data;
            }),
            fetch(`${workerBaseUrl}?url=${encodeURIComponent(url)}&strategy=desktop`).then(async res => {
                const data = await res.json();
                const status = document.getElementById('desktopStatus');
                if (data.error) {
                    if (status) status.textContent = '✗ Error';
                    throw new Error(`Desktop: ${data.error.message || 'Unknown error'}`);
                }
                if (status) status.textContent = '✓ Complete';
                return data;
            })
        ]);

        console.log('✅ Both analyses complete');

        if (!mobileResponse.lighthouseResult || !desktopResponse.lighthouseResult) {
            throw new Error('No lighthouse results in response');
        }

        this.currentPageSpeedData.mobile = mobileResponse;
        this.currentPageSpeedData.desktop = desktopResponse;

        this.displayPageSpeedResults(
            this.currentPageSpeedData[this.pagespeedStrategy],
            this.pagespeedStrategy
        );

        const currentData = {
            url: url,
            timestamp: new Date().toISOString(),
            mobile: this.currentPageSpeedData.mobile ? this.extractScores(this.currentPageSpeedData.mobile) : null,
            desktop: this.currentPageSpeedData.desktop ? this.extractScores(this.currentPageSpeedData.desktop) : null
        };

        this.savePreviousPageSpeed(currentData);

    } catch (error) {
        console.error('❌ PageSpeed error:', error);
        const errorMessage = error.message || 'Unknown error';

        this.pagespeedResults.innerHTML = `
            <div class="metrics-section error-section">
                <h3><i class="fas fa-exclamation-triangle me-2"></i>Analysis Error</h3>
                <p class="error-message">${errorMessage}</p>
                <div class="troubleshooting-tips">
                    <h4>Troubleshooting Tips:</h4>
                    <ul>
                        <li>Make sure the URL is publicly accessible</li>
                        <li>Try with "https://" instead of "http://"</li>
                        <li>Verify the website is online and responding</li>
                        <li>Check if the URL is complete</li>
                    </ul>
                </div>
                <div class="error-action">
                    <a href="https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}" target="_blank" class="btn-action primary">
                        <i class="fas fa-external-link-alt me-2"></i>Try on PageSpeed.web.dev
                    </a>
                </div>
            </div>
        `;
        this.pagespeedResults.classList.remove('d-none');
    } finally {
        this.pagespeedLoading.classList.add('d-none');
        this.analyzePageSpeedBtn.disabled = false;
        this.analyzePageSpeedBtn.innerHTML = '<i class="fas fa-search me-2"></i>Analyze';
        this.isAnalyzingPageSpeed = false;
    }
};

// ============================================================
// SCORE EXTRACTION & HELPERS
// ============================================================

ImageConverter.prototype.extractScores = function(data) {
    const categories = data.lighthouseResult.categories;
    return {
        performance: categories.performance?.score ? Math.round(categories.performance.score * 100) : 0,
        accessibility: categories.accessibility?.score ? Math.round(categories.accessibility.score * 100) : 0,
        bestPractices: categories['best-practices']?.score ? Math.round(categories['best-practices'].score * 100) : 0,
        seo: categories.seo?.score ? Math.round(categories.seo.score * 100) : 0
    };
};

ImageConverter.prototype.getScoreClass = function(score) {
    if (score === 100) return 'perfect';
    if (score >= 90) return 'good';
    if (score >= 50) return 'average';
    return 'poor';
};

ImageConverter.prototype.getMetricClass = function(score) {
    if (score >= 0.9) return 'good';
    if (score >= 0.5) return 'average';
    return 'poor';
};

ImageConverter.prototype.getScoreDifference = function(category) {
    if (!this.previousPageSpeedResults) return null;

    const prevScores = this.previousPageSpeedResults[this.pagespeedStrategy];
    if (!prevScores) return null;

    const currentScores = this.extractScores(this.currentPageSpeedData[this.pagespeedStrategy]);

    const prev = prevScores[category];
    const curr = currentScores[category];

    if (prev === undefined || curr === undefined) return null;

    const diff = curr - prev;
    if (diff === 0) return null;

    return {
        value: diff,
        increased: diff > 0,
        decreased: diff < 0
    };
};

ImageConverter.prototype.getAuditsForCategory = function(category, audits) {
    if (!category || !category.auditRefs) return [];

    return category.auditRefs
        .map(ref => audits[ref.id])
        .filter(audit => {
            if (!audit) return false;
            if (audit.score === null) return false;
            if (audit.score >= 0.9) return false;
            if (audit.scoreDisplayMode === 'informative') return false;
            if (audit.scoreDisplayMode === 'notApplicable') return false;
            return true;
        })
        .sort((a, b) => (a.score || 0) - (b.score || 0));
};

// ============================================================
// ACCORDION STATE MANAGEMENT
// ============================================================

ImageConverter.prototype.initAccordionStates = function() {
    if (!this.accordionStates) {
        this.accordionStates = {
            'performance': true,
            'accessibility': true,
            'best-practices': true,
            'seo': true
        };
    }
};

ImageConverter.prototype.saveAccordionStates = function() {
    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    categories.forEach(categoryId => {
        const card = document.getElementById(`category-${categoryId}`);
        if (card) {
            this.accordionStates[categoryId] = card.classList.contains('open');
        }
    });
};

ImageConverter.prototype.restoreAccordionStates = function() {
    this.initAccordionStates();
    
    setTimeout(() => {
        const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
        categories.forEach(categoryId => {
            const content = document.getElementById(`content-${categoryId}`);
            const card = document.getElementById(`category-${categoryId}`);
            
            if (content && card) {
                const shouldBeOpen = this.accordionStates[categoryId];
                
                if (shouldBeOpen) {
                    card.classList.add('open');
                    content.style.maxHeight = content.scrollHeight + 'px';
                    const icon = card.querySelector('.accordion-icon');
                    if (icon) icon.style.transform = 'rotate(180deg)';
                } else {
                    card.classList.remove('open');
                    content.style.maxHeight = '0px';
                    const icon = card.querySelector('.accordion-icon');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                }
            }
        });
    }, 100);
};

// ============================================================
// SCROLL TO CATEGORY
// ============================================================

ImageConverter.prototype.scrollToCategory = function(categoryId) {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Add a brief highlight effect
        element.style.transition = 'background-color 0.3s';
        element.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 1000);
        
        // Open the accordion if it's closed
        const content = document.getElementById(`content-${categoryId}`);
        const card = element;
        if (content && !card.classList.contains('open')) {
            this.toggleAccordion(categoryId);
        }
    }
};

// ============================================================
// ACCORDION TOGGLE
// ============================================================

ImageConverter.prototype.toggleAccordion = function(categoryId) {
    const card = document.getElementById(`category-${categoryId}`);
    const content = document.getElementById(`content-${categoryId}`);
    const icon = card.querySelector('.accordion-icon');
    
    if (!card || !content) return;
    
    const isOpen = card.classList.contains('open');
    
    if (isOpen) {
        // Close
        card.classList.remove('open');
        content.style.maxHeight = '0px';
        if (icon) icon.style.transform = 'rotate(0deg)';
    } else {
        // Open
        card.classList.add('open');
        content.style.maxHeight = content.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(180deg)';
    }
    
    // Save the new state
    this.initAccordionStates();
    this.accordionStates[categoryId] = !isOpen;
};

// ============================================================
// CATEGORY ISSUES RENDERING
// ============================================================

ImageConverter.prototype.renderCategoryIssues = function(categoryName, icon, color, audits) {
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    if (!audits || audits.length === 0) {
        return `
            <div class="category-issues-card accordion-card" id="category-${categoryId}" style="border-left: 4px solid ${color};">
                <div class="category-header accordion-header" onclick="converter.toggleAccordion('${categoryId}')">
                    <div class="category-title-wrapper">
                        <h3><i class="fas ${icon} me-2" style="color: ${color};"></i>${categoryName} Issues</h3>
                        <span class="issues-count good">0 issues</span>
                    </div>
                    <i class="fas fa-chevron-down accordion-icon"></i>
                </div>
                <div class="accordion-content" id="content-${categoryId}">
                    <div class="no-issues">
                        <i class="fas fa-check-circle"></i>
                        <p>All ${categoryName.toLowerCase()} checks passed!</p>
                    </div>
                </div>
            </div>
        `;
    }

    const issuesHTML = audits.map(audit => {
        const scorePercent = audit.score !== null ? Math.round(audit.score * 100) : 0;
        const scoreClass = this.getScoreClass(scorePercent);

        let savingsHTML = '';
        if (audit.details) {
            if (audit.details.overallSavingsMs) {
                savingsHTML += `<span class="savings-tag"><i class="fas fa-clock me-1"></i>${(audit.details.overallSavingsMs / 1000).toFixed(1)}s</span>`;
            }
            if (audit.details.overallSavingsBytes) {
                const kb = Math.round(audit.details.overallSavingsBytes / 1024);
                savingsHTML += `<span class="savings-tag"><i class="fas fa-weight me-1"></i>${kb} KB</span>`;
            }
        }

        let itemsHTML = '';
        if (audit.details && audit.details.items && audit.details.items.length > 0) {
            const items = audit.details.items.slice(0, 5);
            const moreCount = audit.details.items.length - 5;

            itemsHTML = `
                <div class="affected-items">
                    <div class="items-title">Affected resources:</div>
                    <div class="items-list">
                        ${items.map(item => {
                            const url = item.url || item.source?.url || item.node?.snippet || '';
                            if (!url) return '';
                            const shortUrl = url.length > 60 ? url.substring(0, 60) + '...' : url;
                            return `<div class="item-url" title="${this.escapeHtml(url)}">${this.escapeHtml(shortUrl)}</div>`;
                        }).join('')}
                        ${moreCount > 0 ? `<div class="item-more">+${moreCount} more resources</div>` : ''}
                    </div>
                </div>
            `;
        }

        return `
            <div class="issue-item">
                <div class="issue-header">
                    <div class="issue-score ${scoreClass}">${scorePercent}</div>
                    <div class="issue-info">
                        <h4 class="issue-title">${audit.title || 'Unknown Issue'}</h4>
                        <p class="issue-description">${audit.description || ''}</p>
                    </div>
                </div>
                ${savingsHTML ? `<div class="issue-savings">${savingsHTML}</div>` : ''}
                ${audit.displayValue ? `<div class="issue-value"><i class="fas fa-info-circle me-1"></i>${audit.displayValue}</div>` : ''}
                ${itemsHTML}
            </div>
        `;
    }).join('');

    const countClass = audits.length > 5 ? 'poor' : audits.length > 2 ? 'average' : 'good';

    return `
        <div class="category-issues-card accordion-card" id="category-${categoryId}" style="border-left: 4px solid ${color};">
            <div class="category-header accordion-header" onclick="converter.toggleAccordion('${categoryId}')">
                <div class="category-title-wrapper">
                    <h3><i class="fas ${icon} me-2" style="color: ${color};"></i>${categoryName} Issues</h3>
                    <span class="issues-count ${countClass}">${audits.length} issue${audits.length !== 1 ? 's' : ''}</span>
                </div>
                <i class="fas fa-chevron-down accordion-icon"></i>
            </div>
            <div class="accordion-content" id="content-${categoryId}">
                <div class="issues-list">
                    ${issuesHTML}
                </div>
            </div>
        </div>
    `;
};

// ============================================================
// RESULTS DISPLAY
// ============================================================

ImageConverter.prototype.displayPageSpeedResults = function(data, strategy) {
    try {
        const lighthouse = data.lighthouseResult;

        if (!lighthouse || !lighthouse.categories) {
            throw new Error('Invalid response from PageSpeed API');
        }

        const categories = lighthouse.categories;
        const audits = lighthouse.audits;

        const performanceScore = categories.performance?.score ? Math.round(categories.performance.score * 100) : 0;
        const accessibilityScore = categories.accessibility?.score ? Math.round(categories.accessibility.score * 100) : 0;
        const bestPracticesScore = categories['best-practices']?.score ? Math.round(categories['best-practices'].score * 100) : 0;
        const seoScore = categories.seo?.score ? Math.round(categories.seo.score * 100) : 0;

        const fcp = audits['first-contentful-paint']?.displayValue || 'N/A';
        const lcp = audits['largest-contentful-paint']?.displayValue || 'N/A';
        const tbt = audits['total-blocking-time']?.displayValue || 'N/A';
        const cls = audits['cumulative-layout-shift']?.displayValue || 'N/A';
        const si = audits['speed-index']?.displayValue || 'N/A';

        const performanceAudits = this.getAuditsForCategory(categories.performance, audits);
        const accessibilityAudits = this.getAuditsForCategory(categories.accessibility, audits);
        const bestPracticesAudits = this.getAuditsForCategory(categories['best-practices'], audits);
        const seoAudits = this.getAuditsForCategory(categories.seo, audits);

        const perfDiff = this.getScoreDifference('performance');
        const accDiff = this.getScoreDifference('accessibility');
        const bpDiff = this.getScoreDifference('bestPractices');
        const seoDiff = this.getScoreDifference('seo');

        const comparisonBadge = (diff) => {
            if (!diff || diff.value === 0) return '';
            const sign = diff.increased ? '+' : '';
            const color = diff.increased ? '#10b981' : '#ef4444';
            return `<div class="score-change" style="background: ${color};">${sign}${diff.value}</div>`;
        };

        const deviceIcon = strategy === 'mobile' ? '📱' : '🖥️';
        const deviceName = strategy === 'mobile' ? 'Mobile' : 'Desktop';

        const mobileAvailable = this.currentPageSpeedData.mobile !== null;
        const desktopAvailable = this.currentPageSpeedData.desktop !== null;

        const html = `
            <div class="device-indicator">
                <h3>${deviceIcon} ${deviceName} Performance</h3>
                <p>${mobileAvailable && desktopAvailable ? '✓ Click device buttons above to switch instantly' : 'Click "Analyze" to get both mobile and desktop results'}</p>
            </div>

            <div class="pagespeed-actions">
                ${this.previousPageSpeedResults ? `
                    <button class="btn-action" onclick="converter.showComparison()">
                        <i class="fas fa-history me-2"></i>Compare with Previous
                    </button>
                ` : ''}
                <button class="btn-action" onclick="converter.showOptimizationTips('octobercms')">
                    <i class="fab fa-laravel me-2"></i>OctoberCMS Tips
                </button>
                <button class="btn-action" onclick="converter.showOptimizationTips('wordpress')">
                    <i class="fab fa-wordpress me-2"></i>WordPress Tips
                </button>
            </div>

            <div class="score-summary">
                <div class="score-card clickable" onclick="converter.scrollToCategory('performance')">
                    ${comparisonBadge(perfDiff)}
                    <div class="score-label">Performance</div>
                    <div class="score-circle ${this.getScoreClass(performanceScore)}">
                        ${performanceScore}
                    </div>
                    <div class="click-hint">Click to view details</div>
                </div>
                <div class="score-card clickable" onclick="converter.scrollToCategory('accessibility')">
                    ${comparisonBadge(accDiff)}
                    <div class="score-label">Accessibility</div>
                    <div class="score-circle ${this.getScoreClass(accessibilityScore)}">
                        ${accessibilityScore}
                    </div>
                    <div class="click-hint">Click to view details</div>
                </div>
                <div class="score-card clickable" onclick="converter.scrollToCategory('best-practices')">
                    ${comparisonBadge(bpDiff)}
                    <div class="score-label">Best Practices</div>
                    <div class="score-circle ${this.getScoreClass(bestPracticesScore)}">
                        ${bestPracticesScore}
                    </div>
                    <div class="click-hint">Click to view details</div>
                </div>
                <div class="score-card clickable" onclick="converter.scrollToCategory('seo')">
                    ${comparisonBadge(seoDiff)}
                    <div class="score-label">SEO</div>
                    <div class="score-circle ${this.getScoreClass(seoScore)}">
                        ${seoScore}
                    </div>
                    <div class="click-hint">Click to view details</div>
                </div>
            </div>

            <div class="metrics-section">
                <h3><i class="fas fa-clock me-2"></i>Core Web Vitals</h3>
                <div class="metric-item">
                    <div class="metric-name">
                        <strong>First Contentful Paint (FCP)</strong>
                        <div>Measures when content first appears</div>
                    </div>
                    <div class="metric-value ${audits['first-contentful-paint']?.score ? this.getMetricClass(audits['first-contentful-paint'].score) : 'average'}">${fcp}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-name">
                        <strong>Largest Contentful Paint (LCP)</strong>
                        <div>Measures loading performance</div>
                    </div>
                    <div class="metric-value ${audits['largest-contentful-paint']?.score ? this.getMetricClass(audits['largest-contentful-paint'].score) : 'average'}">${lcp}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-name">
                        <strong>Total Blocking Time (TBT)</strong>
                        <div>Measures interactivity</div>
                    </div>
                    <div class="metric-value ${audits['total-blocking-time']?.score ? this.getMetricClass(audits['total-blocking-time'].score) : 'average'}">${tbt}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-name">
                        <strong>Cumulative Layout Shift (CLS)</strong>
                        <div>Measures visual stability</div>
                    </div>
                    <div class="metric-value ${audits['cumulative-layout-shift']?.score ? this.getMetricClass(audits['cumulative-layout-shift'].score) : 'average'}">${cls}</div>
                </div>
                <div class="metric-item">
                    <div class="metric-name">
                        <strong>Speed Index</strong>
                        <div>How quickly content is displayed</div>
                    </div>
                    <div class="metric-value ${audits['speed-index']?.score ? this.getMetricClass(audits['speed-index'].score) : 'average'}">${si}</div>
                </div>
            </div>

            ${this.renderCategoryIssues('Performance', 'fa-tachometer-alt', '#ef4444', performanceAudits)}
            ${this.renderCategoryIssues('Accessibility', 'fa-universal-access', '#8b5cf6', accessibilityAudits)}
            ${this.renderCategoryIssues('Best Practices', 'fa-check-double', '#f59e0b', bestPracticesAudits)}
            ${this.renderCategoryIssues('SEO', 'fa-search', '#10b981', seoAudits)}

            <div class="chatgpt-section">
                <button class="btn-chatgpt" onclick="converter.openChatGPT('octobercms')">
                    <i class="fas fa-comments me-2"></i>Chat with AI about OctoberCMS Optimization
                </button>
                <button class="btn-chatgpt" onclick="converter.openChatGPT('wordpress')">
                    <i class="fas fa-comments me-2"></i>Chat with AI about WordPress Optimization
                </button>
            </div>
        `;

        this.pagespeedResults.innerHTML = html;
        this.pagespeedResults.classList.remove('d-none');

        // Restore accordion states (or open all on first analysis)
        this.restoreAccordionStates();

    } catch (error) {
        console.error('Error displaying PageSpeed results:', error);
        this.pagespeedResults.innerHTML = `
            <div class="metrics-section">
                <h3><i class="fas fa-exclamation-triangle me-2"></i>Display Error</h3>
                <p class="error-message">Failed to display PageSpeed results</p>
            </div>
        `;
        this.pagespeedResults.classList.remove('d-none');
    }
};

// ============================================================
// COMPARISON MODAL
// ============================================================

ImageConverter.prototype.showComparison = function() {
    if (!this.previousPageSpeedResults) return;

    const modal = document.createElement('div');
    modal.className = 'duplicate-modal';
    modal.style.display = 'flex';

    const prev = this.previousPageSpeedResults[this.pagespeedStrategy];
    if (!prev) {
        alert(`No previous ${this.pagespeedStrategy} data available for comparison.`);
        return;
    }

    const curr = this.extractScores(this.currentPageSpeedData[this.pagespeedStrategy]);

    const compareRow = (label, prevVal, currVal) => {
        const diff = currVal - prevVal;
        const diffClass = diff > 0 ? 'improved' : diff < 0 ? 'declined' : 'same';
        const diffText = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0';
        return `
            <tr>
                <td>${label}</td>
                <td>${prevVal}</td>
                <td>${currVal}</td>
                <td class="${diffClass}">${diffText}</td>
            </tr>
        `;
    };

    const deviceName = this.pagespeedStrategy === 'mobile' ? 'Mobile' : 'Desktop';
    const deviceIcon = this.pagespeedStrategy === 'mobile' ? '📱' : '🖥️';

    modal.innerHTML = `
        <div class="duplicate-modal-content comparison-modal">
            <button class="close-modal">&times;</button>
            <div class="modal-header">
                <h3>${deviceIcon} ${deviceName} Performance Comparison</h3>
                <p>Comparing current ${deviceName.toLowerCase()} results with previous ${deviceName.toLowerCase()} analysis</p>
            </div>
            <div class="comparison-table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Previous</th>
                            <th>Current</th>
                            <th>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${compareRow('Performance', prev.performance, curr.performance)}
                        ${compareRow('Accessibility', prev.accessibility, curr.accessibility)}
                        ${compareRow('Best Practices', prev.bestPractices, curr.bestPractices)}
                        ${compareRow('SEO', prev.seo, curr.seo)}
                    </tbody>
                </table>
            </div>
            <div class="comparison-timestamp">
                Previous analysis: ${new Date(this.previousPageSpeedResults.timestamp).toLocaleString()}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// ============================================================
// OPTIMIZATION TIPS
// ============================================================

ImageConverter.prototype.showOptimizationTips = function(platform) {
    if (!this.currentPageSpeedData[this.pagespeedStrategy]) {
        alert('Please run a PageSpeed analysis first!');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'duplicate-modal';
    modal.style.display = 'flex';

    const audits = this.currentPageSpeedData[this.pagespeedStrategy].lighthouseResult.audits;
    const opportunities = Object.values(audits)
        .filter(audit => audit && audit.details && audit.details.type === 'opportunity' && audit.score !== null && audit.score < 1)
        .sort((a, b) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0));

    const tips = platform === 'octobercms'
        ? this.getOctoberCMSTips(opportunities)
        : this.getWordPressTips(opportunities);

    modal.innerHTML = `
        <div class="duplicate-modal-content tips-modal">
            <button class="close-modal">&times;</button>
            <div class="modal-header">
                <h3>
                    <i class="fab fa-${platform === 'octobercms' ? 'laravel' : 'wordpress'} me-2"></i>
                    ${platform === 'octobercms' ? 'OctoberCMS' : 'WordPress'} Optimization Tips (2025)
                </h3>
                <p>Best practices and plugins for your PageSpeed issues</p>
            </div>
            <div class="tips-content">
                ${tips}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// ============================================================
// OCTOBERCMS TIPS
// ============================================================

ImageConverter.prototype.getOctoberCMSTips = function(opportunities) {
    let html = '<div class="tips-container">';

    opportunities.forEach(opp => {
        const title = opp.title || '';
        const description = opp.description || '';
        let tip = '';

        if (title.toLowerCase().includes('image') || title.toLowerCase().includes('next-gen')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-image me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>OctoberCMS Solution:</strong>
                        <ul>
                            <li><strong>Responsiv.ImageResizer</strong> - Free plugin for automatic image resizing and optimization</li>
                            <li><strong>WebP Support:</strong> Use <code>|resize(width, height, {format: 'webp'})</code> in Twig</li>
                            <li><strong>Lazy Loading:</strong> Add <code>loading="lazy"</code> to image tags</li>
                            <li><strong>Cloudflare Polish:</strong> Enable auto WebP conversion via Cloudflare</li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (title.toLowerCase().includes('render-blocking') || title.toLowerCase().includes('css') || title.toLowerCase().includes('javascript')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-code me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>OctoberCMS Solution:</strong>
                        <ul>
                            <li><strong>Asset Combiner:</strong> Use <code>{% styles %}</code> and <code>{% scripts %}</code> with defer</li>
                            <li><strong>Critical CSS:</strong> Inline critical CSS in <code>{% put head %}</code></li>
                            <li><strong>Defer JavaScript:</strong> Add <code>defer</code> or <code>async</code> to script tags</li>
                            <li><strong>RainLab.Builder:</strong> Combine multiple CSS/JS files into one</li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (title.toLowerCase().includes('cache') || title.toLowerCase().includes('browser caching')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-server me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>OctoberCMS Solution:</strong>
                        <ul>
                            <li><strong>Enable October Cache:</strong> Set <code>APP_ENV=production</code> in .env</li>
                            <li><strong>Static Page Cache:</strong> Install RainLab.Pages with cache enabled</li>
                            <li><strong>.htaccess Caching:</strong> Add browser cache headers for static files</li>
                            <li><strong>Redis/Memcached:</strong> Configure in <code>config/cache.php</code></li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (title.toLowerCase().includes('text compression') || title.toLowerCase().includes('gzip')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-compress me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>OctoberCMS Solution:</strong>
                        <ul>
                            <li><strong>Enable Gzip:</strong> Add to .htaccess</li>
                            <li><strong>Brotli Compression:</strong> Enable via server config (Nginx/Apache)</li>
                            <li><strong>Minification:</strong> Use October's built-in asset minification</li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (title.toLowerCase().includes('unused css') || title.toLowerCase().includes('unused javascript')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-broom me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>OctoberCMS Solution:</strong>
                        <ul>
                            <li><strong>Component-Based Loading:</strong> Only load CSS/JS when component is used</li>
                            <li><strong>Conditional Loading:</strong> Use <code>{% if %}</code> to conditionally load assets</li>
                            <li><strong>PurgeCSS:</strong> Remove unused Tailwind/Bootstrap classes</li>
                            <li><strong>Tree Shaking:</strong> Use webpack/vite to remove unused code</li>
                        </ul>
                    </div>
                </div>
            `;
        }

        if (tip) html += tip;
    });

    html += `
        <div class="tip-card general-tips">
            <h4><i class="fas fa-star me-2"></i>General OctoberCMS Performance Tips (2025)</h4>
            <div class="tip-solution">
                <ul>
                    <li><strong>PHP 8.3:</strong> Upgrade to PHP 8.3 for 20-30% performance boost</li>
                    <li><strong>OPcache:</strong> Enable OPcache in php.ini</li>
                    <li><strong>Database Indexing:</strong> Add indexes to frequently queried columns</li>
                    <li><strong>CDN:</strong> Use Cloudflare or BunnyCDN for static assets</li>
                    <li><strong>Eager Loading:</strong> Use <code>->with()</code> to prevent N+1 queries</li>
                    <li><strong>Queue Jobs:</strong> Move heavy tasks to queues</li>
                </ul>
            </div>
        </div>
    `;

    html += '</div>';
    return html;
};

// ============================================================
// WORDPRESS TIPS
// ============================================================

ImageConverter.prototype.getWordPressTips = function(opportunities) {
    let html = '<div class="tips-container">';

    opportunities.forEach(opp => {
        const title = opp.title || '';
        const description = opp.description || '';
        let tip = '';

        if (title.toLowerCase().includes('image') || title.toLowerCase().includes('next-gen')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-image me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>WordPress Solution:</strong>
                        <ul>
                            <li><strong>Imagify</strong> (Free) - Auto WebP conversion and compression</li>
                            <li><strong>ShortPixel</strong> (Free tier) - Bulk optimize existing images</li>
                            <li><strong>Smush Pro</strong> - Lossless compression with CDN</li>
                            <li><strong>Native Lazy Loading:</strong> WordPress 5.5+ has built-in lazy loading</li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (title.toLowerCase().includes('render-blocking') || title.toLowerCase().includes('css') || title.toLowerCase().includes('javascript')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-code me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>WordPress Solution:</strong>
                        <ul>
                            <li><strong>WP Rocket</strong> (Premium) - Best all-in-one, auto defer JS/CSS</li>
                            <li><strong>Autoptimize</strong> (Free) - Combine & minify CSS/JS</li>
                            <li><strong>Flying Scripts</strong> (Free) - Delay JavaScript execution</li>
                            <li><strong>Asset CleanUp</strong> (Free) - Disable unused CSS/JS per page</li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (title.toLowerCase().includes('cache') || title.toLowerCase().includes('browser caching')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-server me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>WordPress Solution:</strong>
                        <ul>
                            <li><strong>WP Rocket</strong> (Premium, $59/yr) - Best caching plugin, easy setup</li>
                            <li><strong>W3 Total Cache</strong> (Free) - Advanced caching options</li>
                            <li><strong>LiteSpeed Cache</strong> (Free) - For LiteSpeed servers only</li>
                            <li><strong>Redis Object Cache</strong> (Free) - Database query caching</li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (title.toLowerCase().includes('text compression') || title.toLowerCase().includes('gzip')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-compress me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>WordPress Solution:</strong>
                        <ul>
                            <li><strong>WP Rocket:</strong> Enables Gzip automatically</li>
                            <li><strong>.htaccess Method:</strong> Add Gzip rules manually</li>
                            <li><strong>Cloudflare:</strong> Free Gzip + Brotli compression</li>
                            <li><strong>Host-Level:</strong> Most managed hosts enable this by default</li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (title.toLowerCase().includes('unused css') || title.toLowerCase().includes('unused javascript')) {
            tip = `
                <div class="tip-card">
                    <h4><i class="fas fa-broom me-2"></i>${title}</h4>
                    <p class="tip-description">${description}</p>
                    <div class="tip-solution">
                        <strong>WordPress Solution:</strong>
                        <ul>
                            <li><strong>Asset CleanUp Pro</strong> ($69) - Disable CSS/JS per page/post type</li>
                            <li><strong>Perfmatters</strong> ($29/yr) - Script manager + unused CSS removal</li>
                            <li><strong>WP Rocket:</strong> Has unused CSS removal feature</li>
                            <li><strong>Manual:</strong> Dequeue unused scripts in functions.php</li>
                        </ul>
                    </div>
                </div>
            `;
        }

        if (tip) html += tip;
    });

    html += `
        <div class="tip-card general-tips">
            <h4><i class="fas fa-star me-2"></i>General WordPress Performance Tips (2025)</h4>
            <div class="tip-solution">
                <ul>
                    <li><strong>PHP 8.3:</strong> Upgrade to PHP 8.3 for massive performance gains</li>
                    <li><strong>Managed Hosting:</strong> Use Kinsta, WP Engine, or Cloudways</li>
                    <li><strong>CDN:</strong> Cloudflare (Free) or BunnyCDN ($1/mo)</li>
                    <li><strong>Database Optimization:</strong> WP-Optimize (Free) - Clean up revisions, spam</li>
                    <li><strong>Limit Plugins:</strong> Deactivate unused plugins, quality over quantity</li>
                    <li><strong>Theme Choice:</strong> Use lightweight themes like GeneratePress or Astra</li>
                    <li><strong>Heartbeat Control:</strong> Limit WP Heartbeat API frequency</li>
                </ul>
            </div>
        </div>
    `;

    html += '</div>';
    return html;
};

// ============================================================
// CHATGPT INTEGRATION
// ============================================================

ImageConverter.prototype.openChatGPT = function(platform) {
    if (!this.currentPageSpeedData[this.pagespeedStrategy]) {
        alert('Please run a PageSpeed analysis first!');
        return;
    }

    const scores = this.extractScores(this.currentPageSpeedData[this.pagespeedStrategy]);
    const audits = this.currentPageSpeedData[this.pagespeedStrategy].lighthouseResult.audits;

    const issues = Object.values(audits)
        .filter(audit => audit && audit.score !== null && audit.score < 0.9)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map(audit => `- ${audit.title}: ${audit.description}`)
        .join('\n');

    const platformName = platform === 'octobercms' ? 'OctoberCMS' : 'WordPress';

    const prompt = encodeURIComponent(`I need help optimizing my ${platformName} website's performance. Here are my current PageSpeed Insights scores:

Performance: ${scores.performance}/100
Accessibility: ${scores.accessibility}/100
Best Practices: ${scores.bestPractices}/100
SEO: ${scores.seo}/100

Top issues identified:
${issues}

Device: ${this.pagespeedStrategy}

Can you provide specific, actionable steps to improve these scores for a ${platformName} website in 2025? Please include:
1. Free and premium plugin recommendations
2. Code snippets if applicable
3. Hosting/server optimization tips
4. Priority order (what to fix first)`);

    window.open(`https://chat.openai.com/?q=${prompt}`, '_blank');
};