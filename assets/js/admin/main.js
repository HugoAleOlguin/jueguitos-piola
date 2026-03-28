/**
 * ==========================================================================
 * ADMIN PANEL V3 - CORE ENGINE
 * Ultralight, Dependency-Free, Fast SPA Architecture.
 * ==========================================================================
 */

const CONFIG = {
    REPO_OWNER: 'HugoAleOlguin',
    REPO_NAME: 'jueguitos-piola',
    FILE_PATH: 'assets/js/games.js',
    VERSION_PATH: 'assets/data/version.json',
    BRANCH: 'gh-pages',
    // Hash for "159 159"
    PASSWORD_HASH: '8f03db6b63d7319da347b6feebe9999cbab2d234b997dfdc39998482018153ba',
    TAGS: ["Coop", "Terror", "Party", "Accion", "Roguelike", "Supervivencia", "Simulacion", "Estrategia", "Puzzle", "Carreras", "Crafteo", "Sandbox", "Utilidad"]
};

// ==========================================================================
// STATE MANAGEMENT
// ==========================================================================
const state = {
    games: [],
    pendingChanges: new Set(), // Using Set for uniqueness
    originalSha: null,
    editingIndex: null,
    dragSrcIndex: null
};

// ==========================================================================
// DOM CACHE & INIT
// ==========================================================================
const DOM = {
    loginScreen: document.getElementById('loginScreen'),
    appScreen: document.getElementById('appScreen'),
    loginForm: document.getElementById('loginForm'),
    passwordInput: document.getElementById('passwordInput'),
    loginError: document.getElementById('loginError'),
    
    views: document.querySelectorAll('.view-panel'),
    navBtns: document.querySelectorAll('.nav-btn'),
    
    gamesList: document.getElementById('gamesList'),
    searchFilter: document.getElementById('searchFilter'),
    
    editorTitle: document.getElementById('editorTitle'),
    form: {
        id: document.getElementById('inpId'),
        title: document.getElementById('inpTitle'),
        image: document.getElementById('inpImage'),
        desc: document.getElementById('inpDesc'),
        fullDesc: document.getElementById('inpFullDesc')
    },
    tagsContainer: document.getElementById('tagsContainer'),
    linksContainer: document.getElementById('linksContainer'),
    addLinkBtn: document.getElementById('addLinkBtn'),
    
    preview: {
        img: document.getElementById('prevImg'),
        title: document.getElementById('prevTitle'),
        desc: document.getElementById('prevDesc'),
        tags: document.getElementById('prevTags')
    },
    
    setupModal: document.getElementById('setupModal'),
    setupTokenBtn: document.getElementById('setupTokenBtn'),
    githubTokenInput: document.getElementById('githubTokenInput'),
    saveTokenBtn: document.getElementById('saveTokenBtn'),
    
    pendingBar: document.getElementById('pendingBar'),
    pendingCount: document.getElementById('pendingCount'),
    commitBtn: document.getElementById('commitBtn'),
    
    toastContainer: document.getElementById('toastContainer')
};

function init() {
    bindEvents();
    checkAuth();
}
document.addEventListener('DOMContentLoaded', init);

// ==========================================================================
// EVENT BINDINGS
// ==========================================================================
function bindEvents() {
    DOM.loginForm.addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    DOM.navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
    
    DOM.searchFilter.addEventListener('input', renderList);
    
    // Editor Form Live Preview
    Object.values(DOM.form).forEach(inp => inp.addEventListener('input', updatePreview));
    
    document.getElementById('cancelEditBtn').addEventListener('click', resetEditor);
    document.getElementById('saveGameBtn').addEventListener('click', saveGameLocal);
    
    DOM.addLinkBtn.addEventListener('click', () => addLinkRow());
    
    // Github Token
    DOM.setupTokenBtn.addEventListener('click', saveSetupToken);
    DOM.saveTokenBtn.addEventListener('click', updateSettingsToken);
    
    DOM.commitBtn.addEventListener('click', commitToGithub);
}

// ==========================================================================
// AUTH & ROUTING
// ==========================================================================
async function handleLogin(e) {
    e.preventDefault();
    const hash = await sha256(DOM.passwordInput.value);
    
    if (hash === CONFIG.PASSWORD_HASH) {
        sessionStorage.setItem('adminAuth', 'true');
        DOM.loginError.classList.add('hidden');
        checkAuth();
    } else {
        DOM.loginError.classList.remove('hidden');
    }
}

function checkAuth() {
    const isAuth = sessionStorage.getItem('adminAuth') === 'true';
    if (isAuth) {
        DOM.loginScreen.classList.add('hidden');
        DOM.appScreen.classList.remove('hidden');
        bootApp();
    } else {
        DOM.appScreen.classList.add('hidden');
        DOM.loginScreen.classList.remove('hidden');
    }
}

function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

function switchView(viewId) {
    DOM.views.forEach(v => v.classList.remove('active'));
    DOM.navBtns.forEach(b => b.classList.remove('active'));
    
    document.getElementById(`view-${viewId}`).classList.add('active');
    document.querySelector(`[data-view="${viewId}"]`).classList.add('active');
    
    if (viewId === 'dashboard') renderList();
    if (viewId === 'settings') DOM.githubTokenInput.value = getToken() || '';
}

// ==========================================================================
// GITHUB API CORE
// ==========================================================================
function getToken() {
    return localStorage.getItem('gh_token') || sessionStorage.getItem('gh_token');
}

function setToken(token) {
    localStorage.setItem('gh_token', token); // Using simple persistent storage as requested "ultralight"
}

function saveSetupToken() {
    const input = document.getElementById('setupTokenInput').value.trim();
    if (input) {
        setToken(input);
        DOM.setupModal.classList.add('hidden');
        fetchInitialData();
    }
}

function updateSettingsToken() {
    const input = DOM.githubTokenInput.value.trim();
    if (input) {
        setToken(input);
        toast('Token guardado exitosamente', 'success');
    }
}

async function bootApp() {
    if (!getToken()) {
        DOM.setupModal.classList.remove('hidden');
    } else {
        fetchInitialData();
    }
}

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const opts = {
        method,
        headers: {
            'Authorization': `token ${getToken()}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
    };
    if (body) opts.body = JSON.stringify(body);
    
    const res = await fetch(`https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/${endpoint}`, opts);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
}

async function fetchInitialData() {
    try {
        toast('Cargando datos...');
        const data = await fetchAPI(`contents/${CONFIG.FILE_PATH}?ref=${CONFIG.BRANCH}`);
        const content = decodeURIComponent(escape(atob(data.content)));
        
        // Parsear JS del catálogo de forma segura
        const match = content.match(/(?:window\.|const\s+)gamesData\s*=\s*\[([\s\S]*)\];/);
        if (match) {
            state.games = new Function(`return [${match[1]}]`)();
            state.originalSha = data.sha;
            renderList();
            renderTagsPicker();
            toast(`${state.games.length} juegos cargados`, 'success');
        }
    } catch (e) {
        toast('Error al descargar datos: Verifica el Token', 'error');
        console.error(e);
        DOM.setupModal.classList.remove('hidden'); // Show setup again if fails
    }
}

async function commitToGithub() {
    if (state.pendingChanges.size === 0) return;
    const btn = DOM.commitBtn;
    
    try {
        btn.textContent = 'Publicando...';
        btn.disabled = true;
        
        // 1. Obtener ultimo commit
        const ref = await fetchAPI(`git/refs/heads/${CONFIG.BRANCH}`);
        const latestCommitSha = ref.object.sha;
        
        // 2. Serializar juegos
        const fileContent = serializeGamesInfo(state.games);
        
        // 3. Crear blobs
        const jsBlob = await fetchAPI('git/blobs', 'POST', { content: fileContent, encoding: 'utf-8' });
        
        const now = new Date();
        const vDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
        const verStr = JSON.stringify({ version: vDate, updated: now.toISOString() }, null, 4);
        const verBlob = await fetchAPI('git/blobs', 'POST', { content: verStr, encoding: 'utf-8' });

        // 4. Crear tree
        const parentCommit = await fetchAPI(`git/commits/${latestCommitSha}`);
        const newTree = await fetchAPI('git/trees', 'POST', {
            base_tree: parentCommit.tree.sha,
            tree: [
                { path: CONFIG.FILE_PATH, mode: '100644', type: 'blob', sha: jsBlob.sha },
                { path: CONFIG.VERSION_PATH, mode: '100644', type: 'blob', sha: verBlob.sha }
            ]
        });

        // 5. Commit & Push con mensaje compacto
        const commitMsg = buildCommitMessage(vDate);
        const newCommit = await fetchAPI('git/commits', 'POST', {
            message: commitMsg,
            tree: newTree.sha,
            parents: [latestCommitSha]
        });
        
        await fetchAPI(`git/refs/heads/${CONFIG.BRANCH}`, 'PATCH', { sha: newCommit.sha, force: false });
        
        state.pendingChanges.clear();
        updatePendingUI();
        toast('Publicado correctamente', 'success');
        
    } catch (e) {
        toast(`Error al publicar: ${e.message}`, 'error');
    } finally {
        btn.textContent = 'Publicar cambios';
        btn.disabled = false;
    }
}

/**
 * Genera un mensaje de commit compacto y legible.
 * Si hay 1 cambio, lo muestra con su prefijo (+/-/~).
 * Si hay mas de 1, agrupa en una linea compacta.
 */
function buildCommitMessage(vDate) {
    const changes = Array.from(state.pendingChanges);
    let summary;
    if (changes.length === 1) {
        summary = changes[0];
    } else {
        // Contar tipos
        const adds    = changes.filter(c => c.startsWith('+')).length;
        const deletes = changes.filter(c => c.startsWith('-')).length;
        const edits   = changes.filter(c => c.startsWith('~')).length;
        const parts   = [];
        if (adds)    parts.push(`${adds} nuevo${adds > 1 ? 's' : ''}`);
        if (edits)   parts.push(`${edits} editado${edits > 1 ? 's' : ''}`);
        if (deletes) parts.push(`${deletes} eliminado${deletes > 1 ? 's' : ''}`);
        summary = `juegos: ${parts.join(', ')}`;
    }
    return `${summary} (v${vDate})`;
}

function serializeGamesInfo(games) {
    const lines = games.map(game => {
        let props = [];
        const keys = ['id', 'title', 'description', 'fullDescription', 'image', 'tags', 'downloadUrl', 'fixOnlineUrl', 'modsUrl', 'externalLink', 'internalLink', 'customPage', 'customUrl', 'buttons', 'hidden'];
        
        keys.forEach(key => {
            if (game[key] !== undefined && game[key] !== "") {
                let val = JSON.stringify(game[key]);
                if (key === 'buttons' || key === 'tags') {
                    val = JSON.stringify(game[key]).replace(/,/g, ', ');
                }
                props.push(`${key}: ${val}`);
            }
        });
        return `    { ${props.join(', ')} }`;
    });
    return `window.gamesData = [\n${lines.join(',\n')}\n];\n`;
}

// ==========================================================================
// LIST VIEW & DRAG/DROP
// ==========================================================================
function renderList() {
    const list = DOM.gamesList;
    const term = DOM.searchFilter.value.toLowerCase();
    
    // SVG icons inline para evitar dependencias externas
    const iconEye     = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const iconEyeOff  = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>`;
    const iconTrash   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    const iconGrip    = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>`;

    list.innerHTML = state.games
        .map((g, i) => ({ ...g, oIndex: i }))
        .filter(g => g.title.toLowerCase().includes(term) || g.id.toLowerCase().includes(term))
        .map(g => `
            <li class="game-row ${g.hidden ? 'is-hidden' : ''}" data-index="${g.oIndex}" draggable="true">
                <div class="drag-handle" title="Arrastrar para reordenar">${iconGrip}</div>
                <img src="${g.image || '../favicon.png'}" class="game-thumb" loading="lazy" onerror="this.src='../favicon.png'">
                <div class="game-info">
                    <h4>${g.title}${g.hidden ? ' <span class="text-muted">(oculto)</span>' : ''}</h4>
                    <p>${g.id}</p>
                </div>
                <div class="row-actions">
                    <button class="action-icon-btn" data-action="toggle" data-i="${g.oIndex}" title="${g.hidden ? 'Mostrar' : 'Ocultar'}">${g.hidden ? iconEyeOff : iconEye}</button>
                    <button class="action-icon-btn danger" data-action="delete" data-i="${g.oIndex}" title="Eliminar">${iconTrash}</button>
                </div>
            </li>
        `).join('');
        
    setupListEvents();
}

function setupListEvents() {
    // Actions delegation
    DOM.gamesList.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const index = parseInt(btn.dataset.i);
            
            if (action === 'toggle') {
                state.games[index].hidden = !state.games[index].hidden;
                logChange(`~${state.games[index].title}`);
                renderList();
            } else if (action === 'delete') {
                const title = state.games[index].title;
                if (confirm(`Eliminar "${title}"?`)) {
                    logChange(`-${title}`);
                    state.games.splice(index, 1);
                    renderList();
                }
            }
        });
    });
    
    // Row Edit
    DOM.gamesList.querySelectorAll('.game-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if(!e.target.closest('.action-btn') && !e.target.closest('.drag-handle')){
                openEditor(parseInt(row.dataset.index));
            }
        });
        
        // Native Drag & Drop
        row.addEventListener('dragstart', handleDragStart);
        row.addEventListener('dragover', handleDragOver);
        row.addEventListener('drop', handleDrop);
        row.addEventListener('dragend', handleDragEnd);
    });
}

// Drag Handlers — Solo desde el drag-handle por usabilidad
function handleDragStart(e) {
    if (!e.target.closest('.drag-handle')) { e.preventDefault(); return; }
    state.dragSrcIndex = parseInt(this.dataset.index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', state.dragSrcIndex);
    setTimeout(() => this.style.opacity = '0.35', 0);
}
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}
function handleDrop(e) {
    e.stopPropagation();
    const destIndex = parseInt(this.dataset.index);
    if (state.dragSrcIndex !== null && state.dragSrcIndex !== destIndex) {
        const item = state.games.splice(state.dragSrcIndex, 1)[0];
        state.games.splice(destIndex, 0, item);
        logChange('~orden');
        renderList();
    }
    state.dragSrcIndex = null;
    return false;
}
function handleDragEnd(e) {
    this.style.opacity = '1';
}

// ==========================================================================
// EDITOR ENGINE
// ==========================================================================
function openEditor(index = null) {
    state.editingIndex = index;
    DOM.editorTitle.textContent = index === null ? 'Nuevo Juego' : 'Editar Juego';
    
    if (index !== null) {
        const g = state.games[index];
        DOM.form.id.value = g.id || '';
        DOM.form.title.value = g.title || '';
        DOM.form.image.value = g.image || '';
        DOM.form.desc.value = g.description || '';
        DOM.form.fullDesc.value = (g.fullDescription || '').replaceAll('<br>', '\n');
        
        // Load tags
        renderTagsPicker(g.tags || []);
        
        // Load Links
        DOM.linksContainer.innerHTML = '';
        if (g.buttons) {
            g.buttons.forEach(b => addLinkRow(b[0], b[1], b[2]));
        } else {
            // Legacy fallbacks
            if(g.downloadUrl) addLinkRow('Descargar', g.downloadUrl, 'primary');
            if(g.fixOnlineUrl) addLinkRow('Fix Online', g.fixOnlineUrl, 'button');
        }
    } else {
        resetEditorForm();
    }
    
    updatePreview();
    switchView('editor');
}

function resetEditor() {
    resetEditorForm();
    switchView('dashboard');
}

function resetEditorForm() {
    Object.values(DOM.form).forEach(inp => inp.value = '');
    DOM.linksContainer.innerHTML = '';
    renderTagsPicker();
    updatePreview();
    state.editingIndex = null;
}

function renderTagsPicker(activeTags = []) {
    DOM.tagsContainer.innerHTML = CONFIG.TAGS.map(t => {
        const isActive = activeTags.includes(t);
        return `<button type="button" class="tag-btn ${isActive ? 'active' : ''}" onclick="this.classList.toggle('active'); updatePreview()">${t}</button>`;
    }).join('');
}

function addLinkRow(label = '', url = '', style = 'button') {
    const div = document.createElement('div');
    div.className = 'link-row';
    div.innerHTML = `
        <input type="text" class="input-flat l-lbl" placeholder="Nombre" value="${label}" style="width: 30%">
        <input type="text" class="input-flat l-url" placeholder="URL" value="${url}" style="flex: 1">
        <select class="input-flat l-sty" style="width: 100px">
            <option value="primary" ${style==='primary'?'selected':''}>Azul</option>
            <option value="button" ${style==='button'?'selected':''}>Gris</option>
            <option value="danger" ${style==='danger'?'selected':''}>Rojo</option>
        </select>
        <button type="button" class="btn-ghost" onclick="this.parentElement.remove()">✕</button>
    `;
    DOM.linksContainer.appendChild(div);
}

function updatePreview() {
    DOM.preview.title.textContent = DOM.form.title.value || 'Título...';
    DOM.preview.desc.textContent  = DOM.form.desc.value  || 'Resumen corto...';

    // Mostrar imagen solo si el usuario escribio una URL
    const imgUrl = DOM.form.image.value.trim();
    if (imgUrl) {
        DOM.preview.img.src     = imgUrl;
        DOM.preview.img.style.display = 'block';
    } else {
        DOM.preview.img.src     = '';
        DOM.preview.img.style.display = 'none';
    }

    const activeTags = Array.from(DOM.tagsContainer.querySelectorAll('.active')).map(b => b.textContent);
    DOM.preview.tags.innerHTML = activeTags.map(t => `<span>${t}</span>`).join('');
}
window.updatePreview = updatePreview; // Attach to window for onclick

function saveGameLocal() {
    const idStr = DOM.form.id.value.trim();
    if (!idStr) return toast('El ID es obligatorio', 'error');

    // Parse links
    const buttons = Array.from(DOM.linksContainer.children).map(row => [
        row.querySelector('.l-lbl').value.trim(),
        row.querySelector('.l-url').value.trim(),
        row.querySelector('.l-sty').value
    ]).filter(b => b[0] && b[1]);

    const newData = {
        id: idStr,
        title: DOM.form.title.value.trim(),
        image: DOM.form.image.value.trim(),
        description: DOM.form.desc.value.trim(),
        fullDescription: DOM.form.fullDesc.value.replace(/\n/g, '<br>'),
        tags: Array.from(DOM.tagsContainer.querySelectorAll('.active')).map(b => b.textContent),
        buttons: buttons
    };

    // Strip empty
    Object.keys(newData).forEach(k => { if(newData[k] === '') delete newData[k]; });

    if (state.editingIndex !== null) {
        state.games[state.editingIndex] = { ...state.games[state.editingIndex], ...newData };
        logChange(`~${newData.title}`);
    } else {
        if (state.games.some(g => g.id === idStr)) return toast('El ID ya existe', 'error');
        state.games.push(newData);
        logChange(`+${newData.title}`);
    }

    resetEditor();
    toast('Guardado localmente', 'success');
}

// ==========================================================================
// UTILS
// ==========================================================================
function logChange(msg) {
    state.pendingChanges.add(msg);
    updatePendingUI();
}

function updatePendingUI() {
    const total = state.pendingChanges.size;
    if (total > 0) {
        // Resumen compacto: "~Raft, +Nuevo" o "3 cambios sin publicar"
        const changes = Array.from(state.pendingChanges);
        const summaryText = total <= 2
            ? changes.join(', ')
            : `${total} cambios sin publicar`;
        document.getElementById('pendingSummary').textContent = summaryText;
        DOM.pendingBar.classList.remove('hidden');
        // Siguiente frame para que la transicion funcione
        requestAnimationFrame(() => DOM.pendingBar.classList.add('show'));
    } else {
        DOM.pendingBar.classList.remove('show');
        setTimeout(() => DOM.pendingBar.classList.add('hidden'), 280);
    }
}

function toast(message, type = '') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    DOM.toastContainer.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 200);
    }, 3000);
}

// Minimal async crypto
async function sha256(message) {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
