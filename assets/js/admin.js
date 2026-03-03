/**
 * Admin Panel Logic
 * Author: Hugo Ale Olguin
 */

const CONFIG = {
    REPO_OWNER: 'HugoAleOlguin',
    REPO_NAME: 'jueguitos-piola',
    FILE_PATH: 'assets/js/games.js',
    VERSION_PATH: 'assets/data/version.json',
    BRANCH: 'gh-pages',
    PASSWORD_HASH: '8f03db6b63d7319da347b6feebe9999cbab2d234b997dfdc39998482018153ba'
};

// State
let state = {
    games: [],
    pendingChanges: [],
    originalSha: null,
    isAuthenticated: false,
    editingIndex: null
};

// =============================================================================
// AUTHENTICATION
// =============================================================================

async function init() {
    // Check Session
    if (sessionStorage.getItem('adminAuth') === 'true') {
        showAdminPanel();
    } else {
        document.getElementById('loginScreen').classList.remove('hidden');
    }

    // Enter key support
    document.getElementById('passwordInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') login();
    });

    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.tab);
        });
    });

    // Initial Load
    loadTags();
    resetForm(); // Ensure default state with one button
}

async function login() {
    const input = document.getElementById('passwordInput').value;
    const hash = await sha256(input);

    if (hash === CONFIG.PASSWORD_HASH) {
        sessionStorage.setItem('adminAuth', 'true');
        showAdminPanel();
    } else {
        showToast('Contraseña incorrecta', 'error');
        document.getElementById('passwordInput').classList.add('error');
    }
}

function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

function showAdminPanel() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContainer').style.display = 'block';
    checkToken();
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// GITHUB API INTERACTION
// =============================================================================

function getToken() {
    return localStorage.getItem('githubToken');
}

function checkToken() {
    if (!getToken()) {
        document.getElementById('tokenModal').classList.remove('hidden');
    } else {
        loadData();
    }
}

function saveToken() {
    const token = document.getElementById('tokenInput').value.trim() || document.getElementById('tokenSettingsInput').value.trim();
    if (token) {
        localStorage.setItem('githubToken', token);
        document.getElementById('tokenModal').classList.add('hidden');
        loadData();
    }
}

async function loadData() {
    try {
        setLoading(true);
        const data = await fetchFile(CONFIG.FILE_PATH);
        state.originalSha = data.sha;

        // Parse JS content safely
        const content = decodeBase64(data.content);
        const match = content.match(/(?:window\.|const\s+)gamesData\s*=\s*\[([\s\S]*)\];/);

        if (match) {
            state.games = new Function(`return [${match[1]}]`)();
            renderGamesList();
            showToast('Datos cargados correctamente', 'success');
        } else {
            throw new Error('Formato de archivo inválido');
        }
    } catch (error) {
        showToast(`Error cargando datos: ${error.message}`, 'error');
        console.error(error);
    } finally {
        setLoading(false);
    }
}

async function fetchFile(path) {
    const response = await fetch(
        `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${path}?ref=${CONFIG.BRANCH}`,
        {
            headers: {
                'Authorization': `token ${getToken()}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        }
    );
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
}

async function commitChanges() {
    if (state.pendingChanges.length === 0) return;

    try {
        setLoading(true, 'Sincronizando con GitHub...');

        // 1. Get HEAD Ref
        const refData = await fetchAPI(`git/refs/heads/${CONFIG.BRANCH}`);
        const latestCommitSha = refData.object.sha;

        // 2. Get Tree of HEAD
        const commitData = await fetchAPI(`git/commits/${latestCommitSha}`);
        const baseTreeSha = commitData.tree.sha;

        // 3. Prepare Blobs (Content)
        // Custom Serializer for Compact Games Data
        function serializeGames(games) {
            const lines = games.map(game => {
                let props = [];
                // Order matters for consistency: id, title, description first
                const keys = ['id', 'title', 'description', 'fullDescription', 'image', 'tags', 'downloadUrl', 'fixOnlineUrl', 'modsUrl', 'externalLink', 'internalLink', 'customPage', 'customUrl', 'buttons', 'hidden'];

                // Add known keys first
                keys.forEach(key => {
                    if (game[key] !== undefined && game[key] !== "") {
                        let val = JSON.stringify(game[key]);
                        if (key === 'buttons' || key === 'tags') {
                            // keep arrays somewhat compact, removing extra spaces if possible
                            val = JSON.stringify(game[key]).replace(/,/g, ', ');
                        }
                        props.push(`${key}: ${val}`);
                    }
                });

                // Add any remaining unknown keys
                Object.keys(game).forEach(k => {
                    if (!keys.includes(k) && game[k] !== undefined && game[k] !== "") {
                        props.push(`${k}: ${JSON.stringify(game[k])}`);
                    }
                });

                return `    { ${props.join(', ')} }`;
            });

            return `window.gamesData = [\n${lines.join(',\n')}\n];\n`;
        }

        const gamesContent = serializeGames(state.games);
        const gamesBlob = await createBlob(gamesContent);

        const currentVersion = await fetchFile(CONFIG.VERSION_PATH);
        const versionData = JSON.parse(decodeBase64(currentVersion.content));
        const now = new Date();
        const newVersion = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        versionData.version = newVersion;
        versionData.updated = now.toISOString();
        const versionBlob = await createBlob(JSON.stringify(versionData, null, 4));

        // 4. Create New Tree
        const treeData = await createTree(baseTreeSha, [
            {
                path: CONFIG.FILE_PATH,
                mode: '100644', // file
                type: 'blob',
                sha: gamesBlob.sha
            },
            {
                path: CONFIG.VERSION_PATH,
                mode: '100644', // file
                type: 'blob',
                sha: versionBlob.sha
            }
        ]);

        // 5. Create Commit
        const message = `${state.pendingChanges.join(', ')} (v${newVersion})`;
        const newCommit = await createCommit(message, treeData.sha, latestCommitSha);

        // 6. Update Ref (Force push slightly safer in this context as we based on latest)
        await updateRef(newCommit.sha);

        // Cleanup
        state.pendingChanges = [];
        updatePendingUI();
        showToast('Cambios publicados exitosamente (v' + newVersion + ')', 'success');

    } catch (error) {
        showToast(`Error publicando: ${error.message}`, 'error');
        console.error(error);
    } finally {
        setLoading(false);
    }
}

// --- Low Level Git API Helpers ---

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `token ${getToken()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/${endpoint}`, options);
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || res.statusText);
    }
    return await res.json();
}

async function createBlob(content) {
    return await fetchAPI('git/blobs', 'POST', {
        content: content,
        encoding: 'utf-8'
    });
}

async function createTree(base_tree, tree_items) {
    return await fetchAPI('git/trees', 'POST', {
        base_tree,
        tree: tree_items
    });
}

async function createCommit(message, tree, parent) {
    return await fetchAPI('git/commits', 'POST', {
        message,
        tree,
        parents: [parent]
    });
}

async function updateRef(sha) {
    return await fetchAPI(`git/refs/heads/${CONFIG.BRANCH}`, 'PATCH', {
        sha,
        force: false
    });
}

// Deprecated high-level helpers (kept for read operations if needed)
async function pushFile(path, content, sha, message) {
    // Replaced by Git Tree flow
}
async function updateVersion() {
    // Replaced by Git Tree flow
}

function decodeBase64(str) {
    return decodeURIComponent(escape(atob(str)));
}

// =============================================================================
// UI LOGIC
// =============================================================================

function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`${tabId}View`).classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('active');

    if (tabId !== 'add' && state.editingIndex !== null) {
        resetForm();
    }
}


// ICOTNS (SVGs)
const ICONS = {
    DRAG: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
    VISIBLE: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    HIDDEN: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>',
    DELETE: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>'
};

function renderGamesList() {
    const container = document.getElementById('gamesList');
    const filter = document.getElementById('searchGames').value.toLowerCase();

    container.innerHTML = state.games
        .map((game, index) => ({ ...game, originalIndex: index }))
        .filter(game => game.title.toLowerCase().includes(filter) || game.id.includes(filter))
        .map((game) => {
            const isHidden = game.hidden === true;
            return `
            <div class="game-card-item" data-index="${game.originalIndex}"
                 role="button" tabindex="0"
                 onkeydown="if(event.key==='Enter'||event.key===' ') editGame(${game.originalIndex})"
                 style="${isHidden ? 'opacity: 0.6; border: 1px dashed var(--text-muted);' : ''} cursor: pointer; position: relative; overflow:hidden;">

                <div class="drag-handle" title="Arrastrar para reordenar"
                     role="button" tabindex="0" aria-label="Arrastrar para reordenar"
                     onpointerdown="initSortable(event, this)"
                     onclick="event.stopPropagation()"
                     onkeydown="if(event.key==='Enter'||event.key===' '){ event.stopPropagation(); }"
                     style="padding: 10px; cursor: grab; color: var(--text-muted);">
                     ${ICONS.DRAG}
                </div>

                <img src="${game.image}" class="game-thumb" width="120" height="68"
                     alt="${game.title}"
                     onerror="this.src='../favicon.png'"
                     style="${isHidden ? 'filter:grayscale(100%)' : ''}; pointer-events:none;">

                <div style="flex:1; pointer-events:none;">
                    <h4 style="margin:0;">${game.title} ${isHidden ? '<small style="color:var(--warning); font-size:0.7em">(OCULTO)</small>' : ''}</h4>
                    <p class="text-sm" style="margin:2px 0 0 0;">${game.id}</p>
                </div>

                <div class="tags-wrapper" style="pointer-events:none;">
                    ${(game.tags || []).map(t => `<span class="tag-badge">${t}</span>`).join('')}
                </div>

                <div style="display:flex; gap:5px; align-items:center;" onclick="event.stopPropagation()">
                    <button class="btn btn-ghost action-btn"
                            data-action="toggle" data-index="${game.originalIndex}"
                            title="${isHidden ? 'Mostrar juego' : 'Ocultar juego'}"
                            style="padding: 8px;">
                        ${isHidden ? ICONS.HIDDEN : ICONS.VISIBLE}
                    </button>
                    <button class="btn btn-ghost action-btn"
                            data-action="delete" data-index="${game.originalIndex}"
                            data-title="${game.title.replace(/"/g, '&quot;')}"
                            style="color:var(--danger); padding: 8px;"
                            title="Eliminar juego">
                        ${ICONS.DELETE}
                    </button>
                </div>
            </div>
        `}).join('');

    // Reasignar delegation en cada render
    setupListDelegation(container);
}

/**
 * Event delegation para la lista de juegos.
 * Usa AbortController para limpiar el listener anterior antes de cada re-render,
 * evitando duplicados sin romper el pointer capture del drag-and-drop.
 */
let listDelegationController = null;

function setupListDelegation(container) {
    // Cancelar listener anterior si existe
    if (listDelegationController) {
        listDelegationController.abort();
    }
    listDelegationController = new AbortController();

    container.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('.action-btn');
        const card = e.target.closest('.game-card-item');

        if (actionBtn) {
            e.stopPropagation();
            const index = parseInt(actionBtn.dataset.index);
            const action = actionBtn.dataset.action;

            if (action === 'delete') {
                const title = actionBtn.dataset.title;
                if (confirm(`¿Seguro que querés borrar "${title}"?`)) {
                    state.games.splice(index, 1);
                    state.pendingChanges.push(`- ${title}`);
                    renderGamesList();
                    updatePendingUI();
                }
            } else if (action === 'toggle') {
                toggleVisibility(index);
            }
            return;
        }

        // Click en la card (no en un botón de acción ni en el drag handle)
        if (card && !e.target.closest('.drag-handle')) {
            editGame(parseInt(card.dataset.index));
        }
    }, { signal: listDelegationController.signal });
}


// End of admin.js

function toggleVisibility(index) {
    const game = state.games[index];
    game.hidden = !game.hidden;
    state.pendingChanges.push(`~ Visibilidad: ${game.title}`);
    updatePendingUI();
    renderGamesList();
}

// =============================================================================
// DRAG AND DROP LOGIC
// =============================================================================

let draggedItem = null;

function addDragListeners() {
    const items = document.querySelectorAll('.game-card-item');

    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.index);
    setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragEnter(e) {
    e.preventDefault();
    if (this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation(); // stops the browser from redirecting.
    this.classList.remove('drag-over');

    if (draggedItem !== this) {
        const srcIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const targetIndex = parseInt(this.dataset.index);

        // Reorder array
        const itemToMove = state.games[srcIndex];
        state.games.splice(srcIndex, 1);
        state.games.splice(targetIndex, 0, itemToMove);

        // Add to pending changes if not already generic update
        if (!state.pendingChanges.includes('~ Orden actualizado')) {
            state.pendingChanges.push('~ Orden actualizado');
        }

        updatePendingUI();
        renderGamesList();
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.game-card-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedItem = null;
}

function loadTags() {
    const tags = ["Coop", "Terror", "Party", "Accion", "Roguelike", "Supervivencia", "Simulacion", "Estrategia", "Puzzle", "Carreras", "Crafteo", "Sandbox", "Utilidad"];
    const container = document.getElementById('tagsSelector');

    container.innerHTML = tags.map(tag => `
        <button type="button" class="tag-badge" onclick="toggleTag(this, '${tag}')">${tag}</button>
    `).join('');
}

function toggleTag(element, tag) {
    element.classList.toggle('selected');
    updatePreview();
}

// =============================================================================
// PREVIEW LOGIC
// =============================================================================

function updatePreview() {
    const title = document.getElementById('inpTitle').value || 'Título del Juego';
    const desc = document.getElementById('inpDesc').value || 'Descripción corta...';
    const img = document.getElementById('inpImage').value || '../favicon.png';
    const tags = Array.from(document.querySelectorAll('#tagsSelector .selected')).map(el => el.textContent);

    document.getElementById('previewTitleEl').textContent = title;
    document.getElementById('previewDescEl').textContent = desc;

    const imgEl = document.getElementById('previewImgEl');

    if (img) {
        imgEl.src = img;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    // Handle Img Error
    imgEl.onerror = function () {
        this.style.display = 'none';
    };

    const tagsContainer = document.getElementById('previewTagsEl');
    tagsContainer.innerHTML = tags.map(t => `<span>${t}</span>`).join('');
}

// =============================================================================
// FORM HANDLING
// =============================================================================

function addDynamicButton(data = null) {
    let label = '', url = '', style = 'button';

    if (data) {
        if (Array.isArray(data)) {
            [label, url, style] = data;
        } else {
            ({ label, url, style } = data);
        }
    }

    const container = document.getElementById('dynamicButtonsList');
    const div = document.createElement('div');
    div.className = 'btn-row';
    div.innerHTML = `
        <input type="text" class="input-field input-sm d-btn-name" placeholder="Nombre" value="${label}" style="width:25%" aria-label="Nombre del botón">
        <input type="text" class="input-field input-sm d-btn-url" placeholder="URL" value="${url}" style="flex:1" aria-label="URL del botón">
        <select class="select-sm d-btn-style" style="width:90px" aria-label="Estilo del botón">
            <option value="primary" ${style === 'primary' ? 'selected' : ''}>Azul</option>
            <option value="button" ${(!style || style === 'button') ? 'selected' : ''}>Normal</option>
            <option value="secondary" ${style === 'secondary' ? 'selected' : ''}>Gris</option>
            <option value="danger" ${style === 'danger' ? 'selected' : ''}>Rojo</option>
        </select>
        <button type="button" class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()" style="color:#666; padding:0 8px" aria-label="Eliminar botón">✕</button>
    `;
    container.appendChild(div);
}

function handleFormSubmit(e) {
    e.preventDefault();

    // Harvest Dynamic Buttons
    const buttons = [];
    document.querySelectorAll('.btn-row').forEach(row => {
        const label = row.querySelector('.d-btn-name').value.trim();
        const url = row.querySelector('.d-btn-url').value.trim();
        const style = row.querySelector('.d-btn-style').value;
        if (label && url) {
            // Save as compact array: ["Label", "URL", "style"]
            buttons.push([label, url, style]);
        }
    });

    // Convert newlines to <br> for FullDesc
    let fullDescRaw = document.getElementById('inpFullDesc').value;
    let fullDescProcessed = fullDescRaw.replace(/\n/g, '<br>');

    const formData = {
        id: document.getElementById('inpId').value,
        title: document.getElementById('inpTitle').value,
        description: document.getElementById('inpDesc').value,
        fullDescription: fullDescProcessed,
        image: document.getElementById('inpImage').value,
        tags: Array.from(document.querySelectorAll('#tagsSelector .selected')).map(el => el.textContent),
        buttons: buttons // New Array
    };

    // Remove empty keys
    Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null) delete formData[key];
    });

    if (state.editingIndex !== null) {
        state.games[state.editingIndex] = formData;
        state.pendingChanges.push(`~ ${formData.title}`);
    } else {
        if (state.games.some(g => g.id === formData.id)) {
            showToast('El ID ya existe', 'error');
            return;
        }
        state.games.push(formData);
        state.pendingChanges.push(`+ ${formData.title}`);
    }

    resetForm();
    updatePendingUI();
    showToast('Juego guardado localmente', 'success');
    renderGamesList();
}

function editGame(index) {
    state.editingIndex = index;
    const game = state.games[index];

    document.getElementById('inpId').value = game.id;
    document.getElementById('inpTitle').value = game.title;
    document.getElementById('inpDesc').value = game.description || '';

    // Convert <br> back to \n for editing
    document.getElementById('inpFullDesc').value = (game.fullDescription || '').replaceAll('<br>', '\n');

    document.getElementById('inpImage').value = game.image || '';

    // Handle Buttons Migration
    document.getElementById('dynamicButtonsList').innerHTML = ''; // Clear list

    if (game.buttons && game.buttons.length > 0) {
        // Compatible with both new arrays and old objects via addDynamicButton logic
        game.buttons.forEach(btn => addDynamicButton(btn));
    } else {
        // Legacy System Migration
        if (game.downloadUrl) addDynamicButton(['Descargar', game.downloadUrl, 'primary']);
        if (game.fixOnlineUrl) addDynamicButton(['Fix Online', game.fixOnlineUrl, 'button']);
        if (game.modsUrl) addDynamicButton(['Mods', game.modsUrl, 'button']);
    }

    document.querySelectorAll('#tagsSelector .tag-badge').forEach(el => {
        el.classList.remove('selected');
        if (game.tags && game.tags.includes(el.textContent)) {
            el.classList.add('selected');
        }
    });

    document.getElementById('formTitle').textContent = 'Editar Juego';
    document.getElementById('submitBtnText').textContent = 'Guardar Cambios';
    switchTab('add');
    updatePreview();
}

function deleteGame(index) {
    if (confirm('¿Seguro que querés borrar este juego?')) {
        const game = state.games[index];
        state.games.splice(index, 1);
        state.pendingChanges.push(`- ${game.title}`);
        renderGamesList();
        updatePendingUI();
    }
}

function resetForm() {
    document.getElementById('gameForm').reset();
    document.getElementById('dynamicButtonsList').innerHTML = ''; // Clear dynamic buttons

    // Default "Descargar" button as requested
    addDynamicButton(['Descargar', '', 'primary']);

    state.editingIndex = null;
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    document.getElementById('formTitle').textContent = 'Agregar Nuevo Juego';
    document.getElementById('submitBtnText').textContent = 'Agregar a la lista';
    updatePreview();
}

function updatePendingUI() {
    const bar = document.getElementById('pendingBar');
    if (state.pendingChanges.length > 0) {
        bar.classList.remove('hidden');
        document.getElementById('pendingCount').textContent = state.pendingChanges.length;
    } else {
        bar.classList.add('hidden');
    }
}

function discardChanges() {
    if (confirm('¿Descartar todos los cambios no guardados?')) {
        loadData();
        state.pendingChanges = [];
        updatePendingUI();
    }
}

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `status-toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setLoading(isLoading, msg = 'Cargando...') {
    document.body.style.cursor = isLoading ? 'wait' : 'default';
}

// =============================================================================
// SMOOTH SORTABLE LOGIC (Pointer API)
// =============================================================================

let dragEl = null;
let ghostEl = null;
let placeholderEl = null;
let initialIndex = null;
let clone = null;
let dragOffset = { x: 0, y: 0 };

function initSortable(e, handle) {
    if (e.target.closest('button')) return;
    e.preventDefault();

    dragEl = handle.closest('.game-card-item');
    initialIndex = parseInt(dragEl.dataset.index);

    // 1. Create Placeholder
    placeholderEl = dragEl.cloneNode(true);
    placeholderEl.className = 'game-card-item sortable-ghost';
    placeholderEl.innerHTML = '';

    // 2. Create Floating Clone
    clone = dragEl.cloneNode(true);
    clone.classList.add('sortable-drag');
    const rect = dragEl.getBoundingClientRect();

    clone.style.top = rect.top + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.setProperty('--drag-width', rect.width + 'px');

    document.body.appendChild(clone);
    dragEl.parentNode.insertBefore(placeholderEl, dragEl);
    dragEl.style.display = 'none';

    // 3. Calc Offset
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    // 4. Attach Global Events
    dragEl.setPointerCapture(e.pointerId);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
}

function onPointerMove(e) {
    if (!clone) return;

    clone.style.top = (e.clientY - dragOffset.y) + 'px';
    clone.style.left = (e.clientX - dragOffset.x) + 'px';

    clone.style.display = 'none';
    const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
    clone.style.display = '';

    if (!elemBelow) return;
    const sortableItem = elemBelow.closest('.game-card-item');

    if (sortableItem && sortableItem !== placeholderEl && sortableItem.classList.contains('game-card-item')) {
        const bounding = sortableItem.getBoundingClientRect();
        const offset = bounding.y + bounding.height / 2;

        if (e.clientY - offset > 0) {
            sortableItem.after(placeholderEl);
        } else {
            sortableItem.before(placeholderEl);
        }
    }
}

function onPointerUp(e) {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);

    if (clone) {
        clone.remove();
        clone = null;
    }

    if (!dragEl) return;

    dragEl.style.display = '';

    if (placeholderEl && placeholderEl.parentNode) {
        placeholderEl.replaceWith(dragEl);
    }

    const container = document.getElementById('gamesList');
    const newIndex = Array.from(container.children).indexOf(dragEl);

    if (document.getElementById('searchGames').value === '') {
        // Update array
        const item = state.games.splice(initialIndex, 1)[0];
        state.games.splice(newIndex, 0, item);

        if (initialIndex !== newIndex) {
            if (!state.pendingChanges.includes('~ Orden actualizado')) {
                state.pendingChanges.push('~ Orden actualizado');
            }
            updatePendingUI();
            // Re-render handled by DOM manipulation (no full re-render needed visuals are done)
            // But we should re-render to sanitize indices
            renderGamesList();
        }
    } else {
        showToast('No se puede reordenar con filtro activo', 'error');
        renderGamesList();
    }

    dragEl = null;
    placeholderEl = null;
}

// =============================================================================
// DATA MANAGEMENT (BACKUP / RESTORE)
// =============================================================================

function downloadBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.games, null, 4));
    const downloadAnchorNode = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `jueguitos-backup-${date}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function handleRestore(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const json = JSON.parse(e.target.result);
            if (Array.isArray(json)) {
                if (confirm(`¿Seguro que quieres restaurar ${json.length} juegos? Esto reemplazará la lista actual.`)) {
                    state.games = json;
                    state.pendingChanges.push('~ Restauración completa');
                    updatePendingUI();
                    renderGamesList();
                    showToast('Datos restaurados correctamente', 'success');
                }
            } else {
                showToast('El archivo no tiene el formato correcto (Array)', 'error');
            }
        } catch (err) {
            showToast('Error al leer el archivo JSON', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
    input.value = ''; // Reset
}

function clearCache() {
    if (confirm('¿Borrar credenciales y caché local? Tendrás que iniciar sesión de nuevo.')) {
        localStorage.removeItem('githubToken');
        sessionStorage.removeItem('adminAuth');
        location.reload();
    }
}

// =============================================================================
// ADMIN TOOLS (HEALTH & STATS)
// =============================================================================

// --- Improved Health Check ---
async function runHealthCheck() {
    const output = document.getElementById('toolsOutput');
    output.classList.remove('hidden');
    output.innerHTML = '<span style="color:var(--warning)">⏳ Iniciando escaneo profundo...</span><br>';

    let issues = 0;
    const seenIds = new Set();
    const checks = [];

    // 1. Scan Duplicates & Empty Data
    state.games.forEach((game, idx) => {
        // Check Duplicates
        if (seenIds.has(game.id)) {
            output.innerHTML += `<span style="color:var(--danger)">[ID DUPLICADO]</span> ${game.id} (en "${game.title}")<br>`;
            issues++;
        }
        seenIds.add(game.id);

        // Check Mandatory Fields
        if (!game.id || !game.title) {
            output.innerHTML += `<span style="color:var(--danger)">[DATA CRITICA]</span> Juego #${idx} sin ID o Título<br>`;
            issues++;
        }

        // Check Links
        if (!game.downloadUrl && (!game.buttons || game.buttons.length === 0)) {
            output.innerHTML += `<span style="color:var(--warning)">[SIN LINKS]</span> ${game.title}<br>`;
            issues++;
        }

        // 2. Queue Image Check
        if (game.image) {
            checks.push(checkImage(game.image).then(ok => {
                if (!ok) {
                    output.innerHTML += `<span style="color:var(--danger)">[IMG ROTA]</span> ${game.title}<br>`;
                    issues++;
                }
            }));
        } else {
            output.innerHTML += `<span style="color:var(--text-muted)">[SIN IMG]</span> ${game.title}<br>`;
            issues++; // Count as minor issue
        }
    });

    await Promise.all(checks);

    if (issues === 0) {
        output.innerHTML += '<br><span style="color:var(--success)">✅ Sistema Impecable. 0 Errores.</span>';
    } else {
        output.innerHTML += `<br><span style="color:var(--text-main)">Escaneo completo. <strong>${issues} incidencias detectadas.</strong></span>`;
    }
}

function checkImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

function showStats() {
    const output = document.getElementById('toolsOutput');
    output.classList.remove('hidden');

    const total = state.games.length;
    const tagsCount = {};
    let noImg = 0;
    let noDesc = 0;

    state.games.forEach(g => {
        if (!g.image) noImg++;
        if (!g.description) noDesc++;
        if (g.tags) {
            g.tags.forEach(t => {
                tagsCount[t] = (tagsCount[t] || 0) + 1;
            });
        }
    });

    // Top Tags
    const topTags = Object.entries(tagsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8) // Top 8
        .map(([t, c]) => `<span style="background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px">${t}: ${c}</span>`)
        .join(' ');

    output.innerHTML = `
        <strong style="color:var(--primary)">📊 ESTADÍSTICAS DEL CATÁLOGO</strong><br>
        <div style="display:grid; grid-template-columns:1fr 1fr; margin-top:8px; gap:8px">
            <div>Total Juegos: <strong>${total}</strong></div>
            <div>Sin Imagen: <strong style="color:${noImg > 0 ? 'var(--warning)' : 'inherit'}">${noImg}</strong></div>
            <div>Sin Descripción: <strong>${noDesc}</strong></div>
        </div>
        <div style="margin-top:10px">
            <strong>Etiquetas Populares:</strong><br>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px">${topTags}</div>
        </div>
    `;
}

window.addEventListener('DOMContentLoaded', init);
