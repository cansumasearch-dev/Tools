/**
 * Changelog Module
 * Handles fetching and displaying changelog from GitHub
 * This file extends the ImageConverter class with Changelog functionality
 */

// ============================================================
// AUTO FETCH CHANGELOG
// ============================================================

ImageConverter.prototype.autoFetchChangelog = async function() {
    if (this.changelogCache && this.changelogCache.fetchedAt) {
        const cacheAge = Date.now() - new Date(this.changelogCache.fetchedAt).getTime();
        const oneHour = 60 * 60 * 1000;

        if (cacheAge < oneHour) {
            console.log('📋 Using cached changelog');
            this.renderChangelog(this.changelogCache.commits);
            this.changelogFetched = true;
            return;
        }
    }

    console.log('🔄 Fetching changelog...');
    $("#clLoading").removeClass("d-none");
    document.getElementById("changelogTimeline").innerHTML = '';

    try {
        const [owner, repo] = this.githubRepo.split('/');
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
        }

        const commits = await response.json();

        if (!commits || commits.length === 0) {
            throw new Error('No commits found');
        }

        const detailedCommits = await Promise.all(
            commits.map(async commit => {
                const detailResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`);
                return await detailResponse.json();
            })
        );

        this.saveChangelogCache({
            commits: detailedCommits,
            fetchedAt: new Date().toISOString()
        });

        this.renderChangelog(detailedCommits);
        this.changelogFetched = true;
        console.log('✅ Changelog updated');

    } catch (error) {
        console.error('❌ Changelog error:', error);

        if (this.changelogCache && this.changelogCache.commits) {
            console.log('📋 Showing cached changelog');
            this.renderChangelog(this.changelogCache.commits);
        } else {
            document.getElementById("changelogTimeline").innerHTML = `
                <div class="changelog-empty">
                    <i class="bi bi-exclamation-triangle"></i>
                    <p>Failed to load changelog</p>
                    <p style="font-size: 0.9rem; color: rgba(255,255,255,0.5);">${error.message}</p>
                </div>
            `;
        }
    } finally {
        $("#clLoading").addClass("d-none");
    }
};

// ============================================================
// RENDER CHANGELOG
// ============================================================

ImageConverter.prototype.renderChangelog = function(commits) {
    if (!commits || commits.length === 0) {
        document.getElementById("changelogTimeline").innerHTML = `
            <div class="changelog-empty">
                <i class="bi bi-inbox"></i>
                <p>No commits found</p>
            </div>
        `;
        return;
    }

    const html = commits.map((commit, index) => {
        const date = new Date(commit.commit.author.date);
        const formattedDate = date.toLocaleString();
        const message = commit.commit.message.split('\n')[0];
        const author = commit.commit.author.name;
        const sha = commit.sha.substring(0, 7);

        const filesHTML = commit.files ? this.renderCodeDiffs(commit.files, index) : '';

        return `
            <div class="commit-item">
                <div class="commit-header">
                    <h4 class="commit-message">${this.escapeHtml(message)}</h4>
                    <div class="commit-meta">
                        <div class="commit-author">
                            <i class="bi bi-person"></i>
                            ${this.escapeHtml(author)}
                        </div>
                        <div class="commit-date">
                            <i class="bi bi-calendar"></i>
                            ${formattedDate}
                        </div>
                        <div class="commit-sha">
                            <i class="bi bi-git"></i>
                            ${sha}
                        </div>
                    </div>
                </div>
                ${filesHTML}
            </div>
        `;
    }).join('');

    document.getElementById("changelogTimeline").innerHTML = html;
};

// ============================================================
// RENDER CODE DIFFS
// ============================================================

ImageConverter.prototype.renderCodeDiffs = function(files, commitIndex) {
    if (!files || files.length === 0) return '';

    const codeFiles = files.filter(file => {
        const ext = file.filename.split('.').pop().toLowerCase();
        return ['html', 'css', 'scss', 'js', 'jsx', 'ts', 'tsx'].includes(ext);
    });

    if (codeFiles.length === 0) {
        return `<div class="no-code-changes">No code file changes in this commit</div>`;
    }

    const filesHTML = codeFiles.map((file, fileIndex) => {
        const ext = file.filename.split('.').pop().toLowerCase();
        let icon = 'fa-file-code';
        let language = ext;

        if (['html'].includes(ext)) icon = 'fa-file-code';
        if (['css', 'scss'].includes(ext)) icon = 'fa-file-code';
        if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) icon = 'fa-file-code';

        const diffHTML = file.patch ? this.parseDiff(file.patch, language) : '<div class="no-diff">No changes to display</div>';

        let statusBadge = '';
        let statusClass = '';

        if (file.status === 'added') {
            statusBadge = '<span class="file-status-badge added">Added</span>';
            statusClass = 'file-added';
        } else if (file.status === 'removed') {
            statusBadge = '<span class="file-status-badge removed">Deleted</span>';
            statusClass = 'file-removed';
        } else if (file.status === 'modified') {
            statusBadge = '<span class="file-status-badge modified">Modified</span>';
            statusClass = 'file-modified';
        }

        return `
            <div class="code-diff-file ${statusClass}">
                <div class="code-file-header">
                    <div class="file-info">
                        <i class="fas ${icon}"></i>
                        <span class="file-name">${file.filename}</span>
                        ${statusBadge}
                    </div>
                    <div class="file-stats">
                        <span class="additions">+${file.additions}</span>
                        <span class="deletions">-${file.deletions}</span>
                        <button class="toggle-diff-btn" onclick="converter.toggleDiff(${commitIndex}, ${fileIndex})">
                            <i class="bi bi-chevron-up"></i>
                        </button>
                    </div>
                </div>
                <div class="code-diff-content" id="diff-${commitIndex}-${fileIndex}" style="display: block;">
                    ${diffHTML}
                </div>
            </div>
        `;
    }).join('');

    return `<div class="commit-code-changes">${filesHTML}</div>`;
};

// ============================================================
// PARSE DIFF
// ============================================================

ImageConverter.prototype.parseDiff = function(patch, language) {
    if (!patch) return '<div class="no-diff">No diff available</div>';

    const lines = patch.split('\n');
    let html = '<div class="diff-table">';
    let oldLineNum = 0;
    let newLineNum = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('@@')) {
            const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
            if (match) {
                oldLineNum = parseInt(match[1]);
                newLineNum = parseInt(match[2]);
            }
            html += `<div class="diff-hunk-header">${this.escapeHtml(line)}</div>`;
            continue;
        }

        const firstChar = line[0];
        const content = line.substring(1);

        if (firstChar === '-') {
            html += `
                <div class="diff-line removed">
                    <span class="line-num old">${oldLineNum}</span>
                    <span class="line-num new"></span>
                    <span class="line-content"><span class="diff-marker">-</span>${this.escapeHtml(content)}</span>
                </div>
            `;
            oldLineNum++;
        } else if (firstChar === '+') {
            html += `
                <div class="diff-line added">
                    <span class="line-num old"></span>
                    <span class="line-num new">${newLineNum}</span>
                    <span class="line-content"><span class="diff-marker">+</span>${this.escapeHtml(content)}</span>
                </div>
            `;
            newLineNum++;
        } else {
            html += `
                <div class="diff-line context">
                    <span class="line-num old">${oldLineNum}</span>
                    <span class="line-num new">${newLineNum}</span>
                    <span class="line-content">${this.escapeHtml(content)}</span>
                </div>
            `;
            oldLineNum++;
            newLineNum++;
        }
    }

    html += '</div>';
    return html;
};

// ============================================================
// TOGGLE DIFF
// ============================================================

ImageConverter.prototype.toggleDiff = function(commitIndex, fileIndex) {
    const diffContent = document.getElementById(`diff-${commitIndex}-${fileIndex}`);
    const btn = diffContent.previousElementSibling.querySelector('.toggle-diff-btn i');

    if (diffContent.style.display === 'none') {
        diffContent.style.display = 'block';
        btn.classList.remove('fa-chevron-down');
        btn.classList.add('fa-chevron-up');
    } else {
        diffContent.style.display = 'none';
        btn.classList.remove('fa-chevron-up');
        btn.classList.add('fa-chevron-down');
    }
};