// ==UserScript==
// @name $IMPC!TYDOWNLOADER
// @namespace https://github.com/atedickfer/SIMPCITYDOWNLOADER
// @author atedickfer
// @description $IMPC!TYDOWNLOADER downloads images and videos from XenForo posts
// @version 4.3.2
// @icon https://simp4.cuckcapital.cr/simpcityIcon192.png
// @license WTFPL; http://www.wtfpl.net/txt/copying/
// @match https://simpcity.cr/threads/*
// @match https://simpcity.su/threads/*
// @match https://simpcity.is/threads/*
// @match https://simpcity.cz/threads/*
// @match https://simpcity.hk/threads/*
// @match https://simpcity.rs/threads/*
// @match https://simpcity.ax/threads/*
// @match https://gofile.io/*
// @require https://unpkg.com/@popperjs/core@2
// @require https://unpkg.com/tippy.js@6
// @require https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @connect self
// @connect simpcity.su
// @connect coomer.st
// @connect box.com
// @connect boxcloud.com
// @connect kemono.cr
// @connect github.com
// @connect scdn.st
// @connect cache8.st
// @connect bunkr.ac
// @connect bunkr.ax
// @connect bunkr.black
// @connect bunkr.cat
// @connect bunkr.ci
// @connect bunkr.cr
// @connect bunkr.fi
// @connect bunkr.is
// @connect bunkr.media
// @connect bunkr.nu
// @connect bunkr.red
// @connect bunkr.ru
// @connect bunkr.se
// @connect bunkr.si
// @connect bunkr.site
// @connect bunkr.pk
// @connect bunkr.ph
// @connect bunkr.ps
// @connect bunkr.sk
// @connect bunkr.ws
// @connect bunkrr.ru
// @connect bunkrr.su
// @connect bunkrrr.org
// @connect bunkr-cache.se
// @connect apidl.bunkr.ru
// @connect get.bunkrr.su
// @connect cdn.cr
// @connect glb-apisign.cdn.cr
// @connect b-cdn.net
// @connect gigachad-cdn.ru
// @connect cyberdrop.me
// @connect cyberdrop.cc
// @connect cyberdrop.ch
// @connect cyberdrop.cloud
// @connect cyberdrop.nl
// @connect cyberdrop.to
// @connect cyberdrop.cr
// @connect cyberfile.su
// @connect cyberfile.me
// @connect turbo.cr
// @connect turbocdn.st
// @connect saint2.su
// @connect saint2.cr
// @connect redd.it
// @connect onlyfans.com
// @connect i.ibb.co
// @connect ibb.co
// @connect imagebam.com
// @connect jpg.fish
// @connect jpg.fishing
// @connect jpg.pet
// @connect jpeg.pet
// @connect jpg1.su
// @connect jpg2.su
// @connect jpg3.su
// @connect jpg4.su
// @connect jpg5.su
// @connect jpg6.su
// @connect jpg7.cr
// @connect cuckcapital.cr
// @connect imgbox.com
// @connect pixhost.to
// @connect pomf2.lain.la
// @connect pornhub.com
// @connect postimg.cc
// @connect imgvb.com
// @connect pixxxels.cc
// @connect imagevenue.com
// @connect nhentai-proxy.herokuapp.com
// @connect pbs.twimg.com
// @connect media.tumblr.com
// @connect pixeldrain.com
// @connect pixeldrain.net
// @connect pixeldra.in
// @connect redgifs.com
// @connect rule34.xxx
// @connect noodlemagazine.com
// @connect pvvstream.pro
// @connect spankbang.com
// @connect sb-cd.com
// @connect gofile.io
// @connect phncdn.com
// @connect xvideos.com
// @connect give.xxx
// @connect goonbox.cr
// @connect githubusercontent.com
// @connect filester.me
// @connect filester.sh
// @connect filester.si
// @connect filester.gg
// @run-at document-start
// @grant GM_xmlhttpRequest
// @grant GM_download
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_log
// @grant GM_openInTab
// @grant GM_cookie

// ==/UserScript==
// --- tab handle helper (Tampermonkey can return either a Tab object or a Promise<Tab>) ---
function xfpdCloseTabHandle(tabOrPromise) {
    try {
        if (!tabOrPromise) return;
        // Promise-like (e.g., some GM implementations return Promise<Tab>)
        if (typeof tabOrPromise.then === 'function') {
            try {
                tabOrPromise.then(t => {
                    try { if (t && typeof t.close === 'function') t.close(); } catch (e) {}
                }).catch(() => {});
            } catch (e) {}
            return;
        }
        // Direct tab handle
        if (typeof tabOrPromise.close === 'function') {
            try { tabOrPromise.close(); } catch (e) {}
        }
    } catch (e) {}
}
// ---------------------------------------------------------------------------
// Userscript managers expose @require libraries and GM APIs in different globals.
// Resolve both forms so a manager update cannot silently disable the whole UI.
const JSZip = globalThis.JSZip || window.JSZip;
const tippy = globalThis.tippy || window.tippy;
const http =
    (typeof GM_xmlhttpRequest === 'function' && GM_xmlhttpRequest) ||
    (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function' && GM.xmlHttpRequest.bind(GM)) ||
    window.GM_xmlhttpRequest;
window.isFF = typeof InstallTrigger !== 'undefined';
window.logs = [];

const XFPD_SETTINGS_KEY = 'xfpd_post_settings_v4';

const xfpdSha256 = async value => {
    const bytes = new TextEncoder().encode(String(value ?? ''));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)]
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
};

const log = {
    /**
   * @returns {number}
   */
    separator: postId => window.logs.push({ postId, message: '-'.repeat(175) }),
    /**
   * @param postId
   * @param str
   * @param type
   * @param toConsole
   */
    write: (postId, str, type, toConsole = true) => {
        const date = new Date();
        const message = `[${date.toDateString()} ${date.toLocaleTimeString()}] [${type}] ${str}`
        .replace(/(::.*?::)/gi, (match, g) => g.toUpperCase())
        .replace(/::/g, '');
        window.logs.push({ postId, message });
        if (toConsole) {
            if (type.toLowerCase() === 'info') {
                console.info(message);
            } else if (type.toLowerCase() === 'warn') {
                console.warn(message);
            } else {
                console.error(message);
            }
        }
    },
    /**
   * @param postId
   * @param str
   * @param scope
   */
    info: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'INFO'),
    /**
   * @param postId
   * @param str
   * @param scope
   */
    warn: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'WARNING'),
    /**
   * @param postId
   * @param str
   * @param scope
   */
    error: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'ERROR'),
    // TODO: Fix param orders for the methods: -.-
    post: {
        /**
     * @param postId
     * @param str
     * @param postNumber
     * @returns {*}
     */
        info: (postId, str, postNumber) => log.info(postId, str, `POST #${postNumber}`),
        /**
     * @param postId
     * @param str
     * @param postNumber
     * @returns {*}
     */
        error: (postId, str, postNumber) => log.error(postId, str, `POST #${postNumber}`),
    },
    host: {
        /**
     * @param postId
     * @param str
     * @param host
     * @returns {*}
     */
        info: (postId, str, host) => log.info(postId, str, host),
        /**
     * @param postId
     * @param str
     * @param host
     * @returns {*}
     */
        error: (postId, str, host) => log.error(postId, str, host),
    },
};

const settings = {
    naming: {
        allowEmojis: false,
        invalidCharSubstitute: '-',
    },
    hosts: {
        goFile: {
            token: '',
        },
    },
    ui: {
        checkboxes: {
            toggleAllCheckboxLabel: 'All sources',
        },
    },
    extensions: {
        documents: ['.txt', '.doc', '.docx', '.pdf'],
        compressed: ['.zip', '.rar', '.7z', '.tar', '.bz2', '.gzip'],
        image: ['.jpg', '.jpeg', '.png', '.gif', '.gif', '.webp', '.jpe', '.svg', '.tif', '.tiff', '.jif'],
        video: [
            '.mpeg',
            '.avchd',
            '.webm',
            '.mpv',
            '.swf',
            '.avi',
            '.m4p',
            '.wmv',
            '.mp2',
            '.m4v',
            '.qt',
            '.mpe',
            '.mp4',
            '.flv',
            '.mov',
            '.mpg',
            '.ogg',
        ],
    },
};

// Chromium directory handles are stored in IndexedDB so every page of the same
// performer thread can reuse one destination without creating nested folders.
const XFPD_DIRECTORY_DB = 'xfpd_directory_handles_v1';
const XFPD_DIRECTORY_STORE = 'performer_folders';
const xfpdPerformerHandles = new Map();

const xfpdSanitizeDirectoryName = value => {
    let name = String(value || 'Performer').replace(/\s+/g, ' ').trim();
    const sub = settings?.naming?.invalidCharSubstitute ?? '-';
    name = name
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/[<>:"/\\|?*]/g, sub)
        .replace(/[. ]+$/g, '')
        .trim();
    if (!name) name = 'Performer';
    if (name.length > 180) name = name.slice(0, 180).trim();
    return name;
};

const xfpdDirectoryKey = performerName =>
    `${location.hostname}:${String(performerName || '').normalize('NFKC').toLocaleLowerCase()}`;

// File System Access API picker IDs must be no longer than 32 characters and
// may contain only ASCII letters, numbers, underscores, and hyphens.
const xfpdDirectoryPickerId = performerKey => {
    let hash = 2166136261;
    for (const char of String(performerKey || 'performer')) {
        hash ^= char.codePointAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return `xfpd-performer-${(hash >>> 0).toString(36)}`;
};

const xfpdOpenDirectoryDb = () => new Promise((resolve, reject) => {
    try {
        const request = indexedDB.open(XFPD_DIRECTORY_DB, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(XFPD_DIRECTORY_STORE)) {
                db.createObjectStore(XFPD_DIRECTORY_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not open directory storage.'));
    } catch (e) {
        reject(e);
    }
});

const xfpdGetStoredDirectory = async key => {
    try {
        const db = await xfpdOpenDirectoryDb();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(XFPD_DIRECTORY_STORE, 'readonly');
            const request = tx.objectStore(XFPD_DIRECTORY_STORE).get(key);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => db.close();
        });
    } catch (e) {
        return null;
    }
};

const xfpdStoreDirectory = async (key, handle) => {
    try {
        const db = await xfpdOpenDirectoryDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(XFPD_DIRECTORY_STORE, 'readwrite');
            tx.objectStore(XFPD_DIRECTORY_STORE).put(handle, key);
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    } catch (e) {
        console.info('[XFPD] The performer directory will be remembered only until this page closes.', e);
    }
};

const xfpdPreloadPerformerFolder = async () => {
    try {
        const performerName = xfpdSanitizeDirectoryName(parsers.thread.parsePerformerName());
        const performerKey = xfpdDirectoryKey(performerName);
        if (xfpdPerformerHandles.has(performerKey)) return;
        const storedHandle = await xfpdGetStoredDirectory(performerKey);
        if (storedHandle && !xfpdPerformerHandles.has(performerKey)) {
            xfpdPerformerHandles.set(performerKey, storedHandle);
        }
    } catch (e) {
        // Directory persistence is an enhancement; a direct picker remains available.
    }
};

const xfpdGetDirectoryPermission = async handle => {
    try {
        if (typeof handle.queryPermission !== 'function') return 'granted';
        let permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'prompt' && typeof handle.requestPermission === 'function') {
            permission = await handle.requestPermission({ mode: 'readwrite' });
        }
        return permission;
    } catch (e) {
        return 'denied';
    }
};

const xfpdPreparePerformerFolder = async (uiSettings, statusEl = null, { forcePicker = false } = {}) => {
    if (!uiSettings || !uiSettings.createPerformerFolder) {
        if (uiSettings) {
            delete uiSettings._xfpdFolderMode;
            delete uiSettings._xfpdPerformerDirectoryHandle;
            delete uiSettings._xfpdFolderError;
        }
        return 'off';
    }

    const performerName = xfpdSanitizeDirectoryName(parsers.thread.parsePerformerName());
    const performerKey = xfpdDirectoryKey(performerName);
    let performerHandle = forcePicker ? null : xfpdPerformerHandles.get(performerKey) || null;

    if (performerHandle && await xfpdGetDirectoryPermission(performerHandle) === 'granted') {
        xfpdPerformerHandles.set(performerKey, performerHandle);
        uiSettings._xfpdFolderMode = 'native';
        uiSettings._xfpdPerformerDirectoryHandle = performerHandle;
        delete uiSettings._xfpdFolderError;
        return 'native';
    }

    const picker = window.showDirectoryPicker || globalThis.showDirectoryPicker;
    if (typeof picker !== 'function') {
        uiSettings._xfpdFolderMode = 'archive';
        delete uiSettings._xfpdPerformerDirectoryHandle;
        uiSettings._xfpdFolderError = 'This browser cannot create folders here. Chrome or Edge is required.';
        return 'archive';
    }

    try {
        if (statusEl) {
            statusEl.textContent = `Choose Downloads or the “${performerName}” folder…`;
            statusEl.closest?.('.xfpd-progress')?.style.setProperty('display', 'block');
        }
        const selectedHandle = await picker.call(window, {
            id: xfpdDirectoryPickerId(performerKey),
            mode: 'readwrite',
            startIn: 'downloads',
        });

        // Selecting the performer folder itself uses it directly. Selecting a
        // parent such as Downloads creates/reuses exactly one performer child.
        if (xfpdSanitizeDirectoryName(selectedHandle.name).toLocaleLowerCase() === performerName.toLocaleLowerCase()) {
            performerHandle = selectedHandle;
        } else {
            performerHandle = await selectedHandle.getDirectoryHandle(performerName, { create: true });
        }

        xfpdPerformerHandles.set(performerKey, performerHandle);
        await xfpdStoreDirectory(performerKey, performerHandle);
        uiSettings._xfpdFolderMode = 'native';
        uiSettings._xfpdPerformerDirectoryHandle = performerHandle;
        delete uiSettings._xfpdFolderError;
        return 'native';
    } catch (e) {
        uiSettings._xfpdFolderMode = 'archive';
        delete uiSettings._xfpdPerformerDirectoryHandle;
        uiSettings._xfpdFolderError = e?.name === 'AbortError'
            ? 'Folder selection was canceled. Click Create directory to try again.'
            : `Could not create the folder${e?.message ? `: ${e.message}` : '.'}`;
        console.info('[XFPD] Directory picker failed; using a performer-rooted ZIP.', e);
        return 'archive';
    }
};

const xfpdGlobalProgress = (() => {
    const tasks = new Map();
    let hideTimer = null;

    const ensureElement = () => {
        let root = document.getElementById('xfpd-global-progress');
        if (root) return root;
        root = document.createElement('section');
        root.id = 'xfpd-global-progress';
        root.className = 'xfpd-global-progress';
        root.setAttribute('aria-live', 'polite');
        root.innerHTML = `
            <div class="xfpd-global-track"><div class="xfpd-global-fill"></div></div>
            <div class="xfpd-global-content">
                <span class="xfpd-global-title">Preparing downloads…</span>
                <span class="xfpd-global-meta">0%</span>
            </div>
        `;
        document.body.appendChild(root);
        return root;
    };

    const totals = () => {
        let total = 0;
        let completed = 0;
        let failed = 0;
        let active = 0;
        let partial = 0;
        tasks.forEach(task => {
            total += task.total;
            completed += task.completed;
            failed += task.failed;
            if (task.active) active++;
            task.progress.forEach(value => { partial += Math.min(0.98, Math.max(0, value)); });
        });
        return { total, completed, failed, active, partial };
    };

    const render = () => {
        const root = ensureElement();
        const state = totals();
        const progressUnits = Math.min(state.total, state.completed + state.partial);
        const percent = state.total ? Math.round((progressUnits / state.total) * 100) : 0;
        const title = root.querySelector('.xfpd-global-title');
        const meta = root.querySelector('.xfpd-global-meta');
        const fill = root.querySelector('.xfpd-global-fill');
        fill.style.width = `${percent}%`;
        if (state.active) {
            title.textContent = state.completed >= state.total ? 'Packaging downloads…' : 'Downloading all files…';
            meta.textContent = `${state.completed} / ${state.total} files  •  ${percent}%`;
        } else {
            title.textContent = state.failed ? `Finished with ${state.failed} failed file${state.failed === 1 ? '' : 's'}` : 'All downloads complete';
            meta.textContent = `${state.completed} / ${state.total} files  •  100%`;
            fill.style.width = '100%';
        }
        root.classList.add('is-visible');
        document.body.classList.add('xfpd-global-active');
    };

    return {
        begin: (taskId, total) => {
            if (![...tasks.values()].some(task => task.active)) tasks.clear();
            if (hideTimer) clearTimeout(hideTimer);
            tasks.set(taskId, { total: Math.max(0, total), completed: 0, failed: 0, active: true, progress: new Map(), done: new Set() });
            render();
        },
        setTotal: (taskId, total) => {
            const task = tasks.get(taskId);
            if (!task) return;
            task.total = Math.max(task.completed, Math.max(0, total));
            render();
        },
        update: (taskId, fileId, loaded, total) => {
            const task = tasks.get(taskId);
            if (!task || task.done.has(fileId) || !total || total <= 0) return;
            task.progress.set(fileId, Math.min(0.98, Math.max(0, loaded / total)));
            render();
        },
        complete: (taskId, fileId, ok = true) => {
            const task = tasks.get(taskId);
            if (!task || task.done.has(fileId)) return;
            task.done.add(fileId);
            task.progress.delete(fileId);
            task.completed = Math.min(task.total, task.completed + 1);
            if (!ok) task.failed++;
            render();
        },
        finish: taskId => {
            const task = tasks.get(taskId);
            if (!task) return;
            task.active = false;
            render();
            if (![...tasks.values()].some(item => item.active)) {
                hideTimer = setTimeout(() => {
                    document.getElementById('xfpd-global-progress')?.classList.remove('is-visible');
                    document.body.classList.remove('xfpd-global-active');
                }, 5000);
            }
        },
    };
})();

const xfpdWriteBlobToDirectory = async (rootHandle, relativePath, blob) => {
    if (!rootHandle || typeof rootHandle.getDirectoryHandle !== 'function') {
        throw new Error('No writable directory handle.');
    }

    const parts = String(relativePath || '')
        .split('/')
        .map(part => part.trim())
        .filter(part => part && part !== '.' && part !== '..');
    if (!parts.length) throw new Error('No output filename.');

    let directory = rootHandle;
    for (const part of parts.slice(0, -1)) {
        directory = await directory.getDirectoryHandle(part, { create: true });
    }

    const originalName = parts[parts.length - 1];
    const dot = originalName.lastIndexOf('.');
    const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
    const ext = dot > 0 ? originalName.slice(dot) : '';
    let candidate = originalName;
    let suffix = 2;

    while (true) {
        try {
            await directory.getFileHandle(candidate);
            candidate = `${stem} (${suffix++})${ext}`;
        } catch (e) {
            if (e && e.name && e.name !== 'NotFoundError') throw e;
            break;
        }
    }

    const fileHandle = await directory.getFileHandle(candidate, { create: true });
    const writable = await fileHandle.createWritable();
    try {
        await writable.write(blob);
    } finally {
        await writable.close();
    }
    return [...parts.slice(0, -1), candidate].join('/');
};

const xfpdMediaKindFromText = value => {
    let text = String(value || '').toLowerCase();
    try { text = decodeURIComponent(text); } catch (e) {}
    const hasExtension = extensions => extensions.some(ext => {
        const escaped = ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`${escaped}(?:$|[?#/&.]|%2f)`, 'i').test(text);
    });
    if (hasExtension(settings.extensions.image)) return 'image';
    if (hasExtension(settings.extensions.video)) return 'video';
    return null;
};

const xfpdMediaKindForResolved = resource => {
    const category = String(resource?.host?.category || '').toLowerCase();
    if (category.includes('image')) return 'image';
    if (category.includes('video')) return 'video';
    return xfpdMediaKindFromText(resource?.url) || xfpdMediaKindFromText(resource?.original);
};

const xfpdHostsForMedia = (hostsToFilter, kind) => (hostsToFilter || []).map(host => {
    const category = String(host.category || '').toLowerCase();
    if (category.includes(kind)) return { ...host, resources: [...host.resources], enabled: true };
    if (category.includes(kind === 'image' ? 'video' : 'image')) return null;

    // Mixed/unknown hosts (attachments, Bunkr, GoFile, etc.) keep URLs known to
    // be the requested type plus extensionless URLs that must be resolved first.
    const resources = host.resources.filter(resource => {
        const detected = xfpdMediaKindFromText(resource);
        return detected === kind || detected === null;
    });
    return resources.length ? { ...host, resources, enabled: true } : null;
}).filter(Boolean);

const xfpdDefaultUiSettings = () => ({
    zipped: true,
    flatten: false,
    createPerformerFolder: false,
    generateLinks: false,
    generateLog: false,
    skipDuplicates: false,
    skipDownload: false,
    verifyBunkrLinks: false,
    output: [],
});

const xfpdLoadUiSettings = () => {
    const base = xfpdDefaultUiSettings();
    try {
        const saved = typeof GM_getValue === 'function' ? GM_getValue(XFPD_SETTINGS_KEY, null) : null;
        if (saved && typeof saved === 'object') {
            return { ...base, ...saved, output: [] };
        }
    } catch (e) {}
    return base;
};

const xfpdPersistUiSettings = s => {
    try {
        if (typeof GM_setValue !== 'function') return;
        GM_setValue(XFPD_SETTINGS_KEY, {
            zipped: !!s.zipped,
            flatten: !!s.flatten,
            createPerformerFolder: !!s.createPerformerFolder,
            generateLinks: !!s.generateLinks,
            generateLog: !!s.generateLog,
            skipDuplicates: !!s.skipDuplicates,
            skipDownload: !!s.skipDownload,
            verifyBunkrLinks: !!s.verifyBunkrLinks,
        });
    } catch (e) {}
};

// GoFile filename hints (from API) so we don't rely on URL-encoded path segments
const gofileNameById = new Map();
const gofileNameByUrl = new Map();

// GoFile: the site itself authenticates CDN downloads (store*/cache*.gofile.io) via an
// "accountToken" cookie, set client-side in account.js as:
//   document.cookie = "accountToken=" + activeAccount.token + ";path=/;domain=gofile.io;SameSite=Lax;Secure;"
// Our GM_xmlhttpRequest download calls send cookies (anonymous: false), so mirroring that
// cookie with OUR already-resolved guest token keeps resolution and download on the same
// account. (The old warm-up-tab-only approach loaded a bare gofile.io tab whose own JS has
// no knowledge of our token -- it creates and cookies a brand-new, unrelated guest account,
// which only works by chance.) Cheap local browser API, safe to call before every request.
//
// Whatever accountToken cookie already exists (e.g. the user's own logged-in GoFile session)
// gets overwritten by this. Capture it once per run so it can be restored via
// gofileRestoreCookie() once no post is still processing (see setProcessing() below).
let gofileCookieCaptured = false;
let gofileOriginalCookieValue = null; // null = no cookie existed originally

const gofileCaptureOriginalCookie = () =>
    new Promise(resolve => {
        if (gofileCookieCaptured || typeof GM_cookie === 'undefined' || !GM_cookie || typeof GM_cookie.list !== 'function') {
            resolve();
            return;
        }
        try {
            GM_cookie.list({ url: 'https://gofile.io/', domain: 'gofile.io', name: 'accountToken' }, (cookies, error) => {
                if (error) {
                    console.warn('[GoFile] GM_cookie.list failed while capturing original accountToken cookie:', error);
                } else {
                    const existing = Array.isArray(cookies) ? cookies.find(c => c && c.name === 'accountToken') : null;
                    gofileOriginalCookieValue = existing ? existing.value : null;
                }
                gofileCookieCaptured = true;
                resolve();
            });
        } catch (e) {
            console.warn('[GoFile] GM_cookie.list threw while capturing original accountToken cookie:', e);
            gofileCookieCaptured = true;
            resolve();
        }
    });

const gofileSyncCookie = token =>
    new Promise(resolve => {
        (async () => {
            try {
                if (!token || typeof GM_cookie === 'undefined' || !GM_cookie || typeof GM_cookie.set !== 'function') {
                    resolve(false);
                    return;
                }
                await gofileCaptureOriginalCookie();
                GM_cookie.set(
                    {
                        url: 'https://gofile.io/',
                        name: 'accountToken',
                        value: String(token),
                        domain: 'gofile.io',
                        path: '/',
                        secure: true,
                        sameSite: 'lax',
                    },
                    error => {
                        if (error) console.warn('[GoFile] GM_cookie.set failed for accountToken:', error);
                        resolve(!error);
                    },
                );
            } catch (e) {
                console.warn('[GoFile] gofileSyncCookie threw:', e);
                resolve(false);
            }
        })();
    });

// Restore whatever accountToken cookie existed before we started overwriting it (or remove
// ours if none existed). Called once no post is still processing -- see setProcessing() below.
const gofileRestoreCookie = () =>
    new Promise(resolve => {
        try {
            if (!gofileCookieCaptured || typeof GM_cookie === 'undefined' || !GM_cookie) {
                resolve();
                return;
            }
            const originalValue = gofileOriginalCookieValue;
            gofileCookieCaptured = false;
            gofileOriginalCookieValue = null;

            if (originalValue === null) {
                if (typeof GM_cookie.delete === 'function') {
                    GM_cookie.delete({ url: 'https://gofile.io/', name: 'accountToken', domain: 'gofile.io', path: '/' }, error => {
                        if (error) console.warn('[GoFile] Failed to remove guest accountToken cookie during restore:', error);
                        resolve();
                    });
                    return;
                }
                resolve();
                return;
            }

            GM_cookie.set(
                {
                    url: 'https://gofile.io/',
                    name: 'accountToken',
                    value: originalValue,
                    domain: 'gofile.io',
                    path: '/',
                    secure: true,
                    sameSite: 'lax',
                },
                error => {
                    if (error) console.warn('[GoFile] Failed to restore original accountToken cookie:', error);
                    resolve();
                },
            );
        } catch (e) {
            resolve();
        }
    });

// Cyberdrop filename hints (from API)
const cyberdropNameBySlug = new Map();
const cyberdropNameByUrl = new Map();

// Filester filename/size hints (from API)
const filesterNameBySlug = new Map();
const filesterNameByUrl = new Map();
const filesterSizeBySlug = new Map();
const filesterSizeByUrl = new Map();
const filesterSlugByUrl = new Map();
const filesterRefByUrl = new Map();

// Filester: cache candidate fallback (some tokens are served from different cacheN hosts; cache6 is common but not guaranteed)
const filesterCandidatesByToken = new Map(); // token -> string[]
const filesterTriedByToken = new Map();      // token -> Set<string> of tried candidate URLs
const filester429AttemptsByKey = new Map(); // token/url -> number of 429 retries (rate limiting)
const filesterRetryAttemptsByKey = new Map(); // token/url -> number of retries on transient HTTP errors (429/400/etc)


function filesterTokenFromVUrl(u) {
    try {
        const m = /\/v\/([^\/?#]+)/i.exec(String(u || ''));
        return m && m[1] ? String(m[1]) : '';
    } catch (e) { return ''; }
}

function filesterBuildCandidates(token) {
    const t = String(token || '').trim();
    if (!t) return [];
    const order = [6, 1, 2, 3, 4, 5, 7, 8];
    const out = [];
    for (const n of order) out.push(`https://cache${n}.filester.me/v/${t}`);
    out.push(`https://filester.me/v/${t}`);
    return out;
}

// Bunkr filename hints (from /v/ pages)
const bunkrNameByUrl = new Map();

// Goonbox: embedded medium-res thumbnail per /img/ link, used as a download fallback when the
// API's original_url 404s (post-migration, some originals are missing but the .md. thumbnail --
// also hosted on cuckcapital.cr -- still exists).
const goonboxThumbByUrl = new Map();


// Bunkr/Cloudflare: best-effort warm-up to let the browser complete a JS-only CF interstitial ("Just a moment...").
// NOTE: This does NOT solve interactive Turnstile/CAPTCHA challenges; in that case you still need to do it manually.
const BUNKR_CF_WARMUP_MS = 6000;
const BUNKR_CF_MAX_RETRIES = 3;
const BUNKR_CF_WARMUP_ACTIVE_TAB = false;

const BUNKR_CF_WARMUP_COOLDOWN_MS = 15000; // reduce repeated warm-up tabs


// Bunkr fast-fail + domain blacklist:
// - On first 403 or obvious CF interstitial on a non-last domain, immediately switch to next domain (no extra retries).
// - Blacklist the failing domain for a while so subsequent links skip it entirely.
const BUNKR_FASTFAIL_ON_403 = true;
const BUNKR_DOMAIN_BLACKLIST_MS = 60 * 60 * 1000; // 60 minutes
const xfpdBunkrDomainBanUntil = new Map(); // baseOrigin -> timestamp

function xfpdBunkrNormalizeBase(baseOrUrl) {
    try {
        const u = new URL(String(baseOrUrl || ''));
        return u.origin;
    } catch (e) {
        return String(baseOrUrl || '').replace(/\/+$/, '');
    }
}

function xfpdBunkrIsBaseBanned(baseOrUrl) {
    try {
        const base = xfpdBunkrNormalizeBase(baseOrUrl);
        const until = xfpdBunkrDomainBanUntil.get(base);
        if (!until) return false;
        if (Date.now() >= until) {
            xfpdBunkrDomainBanUntil.delete(base);
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

function xfpdBunkrBanBase(baseOrUrl) {
    try {
        const base = xfpdBunkrNormalizeBase(baseOrUrl);
        // Don't blacklist the last-resort domain (it may be the only thing left).
        if (base === 'https://bunkr.cr') return;
        xfpdBunkrDomainBanUntil.set(base, Date.now() + BUNKR_DOMAIN_BLACKLIST_MS);
    } catch (e) {}
}

function xfpdBunkrFilterBases(bases) {
    const uniq = [];
    const seen = new Set();
    for (const b of (bases || [])) {
        const base = xfpdBunkrNormalizeBase(b);
        if (!base || seen.has(base)) continue;
        seen.add(base);
        uniq.push(base);
    }
    const filtered = uniq.filter(b => b === 'https://bunkr.cr' || !xfpdBunkrIsBaseBanned(b));
    // Never return an empty list; keep last-resort behavior intact.
    return filtered.length ? filtered : uniq;
}

function xfpdLooksLikeCfChallenge(source, dom) {
    try {
        const s = String(source || '');
        const head = s.slice(0, 8000).toLowerCase();

        const title =
            String(dom?.querySelector?.('title')?.textContent || '').trim();

        if (title && /just a moment|attention required|checking your browser/i.test(title)) return true;
        if (title && /cloudflare/i.test(title)) return true;

        if (head.includes('cdn-cgi/challenge-platform')) return true;
        if (head.includes('challenges.cloudflare.com')) return true;
        if (head.includes('cf-browser-verification')) return true;
        if (head.includes('checking your browser')) return true;
        if (head.includes('just a moment')) return true;
        if (head.includes('attention required')) return true;

        // DOM markers (when we have it)
        if (dom?.querySelector?.('#cf-challenge-running, #challenge-form, .cf-browser-verification, .cf-challenge')) return true;
    } catch (e) {}
    return false;
}

function xfpdLooksLikeCfFilenameHint(name) {
    const n = String(name || '').trim();
    return /^(?:just a moment\.{0,3}|checking your browser\.{0,3}|attention required\.{0,3})$/i.test(n) || /cloudflare/i.test(n);
}


// Try to extract the original filename from Bunkr /api/vs JSON (when /v/ is blocked by CF/403).
function xfpdBunkrExtractNameFromVsData(data) {
    try {
        const cands = [];
        const add = (v) => {
            if (!v) return;
            if (typeof v === 'string') cands.push(v);
            else if (typeof v === 'number') cands.push(String(v));
        };

        add(data?.name);
        add(data?.filename);
        add(data?.file_name);
        add(data?.original);
        add(data?.title);

        // common nesting patterns
        if (data?.data && typeof data.data === 'object') {
            add(data.data.name);
            add(data.data.filename);
            add(data.data.file_name);
            add(data.data.original);
            add(data.data.title);
        }
        if (data?.file && typeof data.file === 'object') {
            add(data.file.name);
            add(data.file.filename);
            add(data.file.original);
            add(data.file.title);
        }

        const norm = (s) => {
            let t = String(s || '').replace(/\s+/g, ' ').trim();
            t = t.replace(/\s*\|\s*Bunkr\s*$/i, '').trim();
            return t;
        };

        // Prefer candidates that look like a real filename with an extension.
        for (const raw of cands) {
            const t = norm(raw);
            if (!t) continue;
            if (xfpdLooksLikeCfFilenameHint(t)) continue;
            if (/\.[A-Za-z0-9]{1,8}$/.test(t)) return t;
        }
        // Otherwise, return the first non-empty non-CF string.
        for (const raw of cands) {
            const t = norm(raw);
            if (!t) continue;
            if (xfpdLooksLikeCfFilenameHint(t)) continue;
            return t;
        }
    } catch (e) {}
    return '';
}


async function xfpdWarmupTab(url, ms = BUNKR_CF_WARMUP_MS, active = BUNKR_CF_WARMUP_ACTIVE_TAB) {
    try {
        const tab = GM_openInTab(url, { active: !!active, insert: true, setParent: true });
        await h.delayedResolve(ms);
        try { tab?.close?.(); } catch (e) {}
    } catch (e) {
        // Ignore - warm-up is best-effort
        try { await h.delayedResolve(ms); } catch (e2) {}
    }
}

let xfpdBunkrCfWarmupPromise = null;
let xfpdBunkrCfWarmupLastAt = 0;

// Ensure we open at most ONE warm-up tab at a time (and no more than once per cooldown window).
async function xfpdBunkrCfWarmup(url) {
    try {
        const now = Date.now();

        // If a warm-up is already running, just wait for it.
        if (xfpdBunkrCfWarmupPromise) {
            return await xfpdBunkrCfWarmupPromise;
        }

        // If we recently warmed up, don't open another tab; just wait a bit to avoid hammering.
        if (now - xfpdBunkrCfWarmupLastAt < BUNKR_CF_WARMUP_COOLDOWN_MS) {
            try { await h.delayedResolve(Math.min(1000, BUNKR_CF_WARMUP_MS)); } catch (e) {}
            return null;
        }

        xfpdBunkrCfWarmupLastAt = now;

        xfpdBunkrCfWarmupPromise = (async () => {
            await xfpdWarmupTab(url);
        })();

        try {
            return await xfpdBunkrCfWarmupPromise;
        } finally {
            xfpdBunkrCfWarmupPromise = null;
        }
    } catch (e) {
        // Best-effort
        return null;
    }
}

async function xfpdBunkrGetWithCfRetry(http, url, warmUrlOrOrigin, allowWarmup = true) {
    let last = null;
    for (let attempt = 0; attempt <= BUNKR_CF_MAX_RETRIES; attempt++) {
        try {
            last = await http.get(url);
        } catch (e) {
            last = null;
        }

        const dom = last?.dom;
        const source = last?.source || '';


// Fast-fail on 403 / CF interstitial for non-last domains:
// Immediately blacklist this domain and return, so the caller can try the next domain.
const status = Number(last?.status || 0);
if (BUNKR_FASTFAIL_ON_403 && (status === 403) && !allowWarmup) {
    xfpdBunkrBanBase(warmUrlOrOrigin || url);
    return last || { dom: null, source: '' };
}
if (BUNKR_FASTFAIL_ON_403 && !allowWarmup && last && xfpdLooksLikeCfChallenge(source, dom)) {
    xfpdBunkrBanBase(warmUrlOrOrigin || url);
    return last || { dom: null, source: '' };
}

        if (last && !xfpdLooksLikeCfChallenge(source, dom)) return last;

        if (attempt < BUNKR_CF_MAX_RETRIES) {
            if (allowWarmup) {
                await xfpdBunkrCfWarmup(String(warmUrlOrOrigin || url));
            } else {
                try { await h.delayedResolve(200); } catch (e) {}
            }
}
    }
    return last || { dom: null, source: '' };
}

async function xfpdBunkrPostVsWithCfRetry(http, endpoint, slug, refererUrl, originUrl, allowWarmup = true) {
    let lastText = '';
    let lastStatus = 0;
    for (let attempt = 0; attempt <= BUNKR_CF_MAX_RETRIES; attempt++) {
        try {
            const response = await http.post(
                endpoint,
                JSON.stringify({ slug }),
                {},
                {
                    'Content-Type': 'application/json',
                    Referer: refererUrl,
                    Origin: originUrl,
                },
            );
            lastText = String(response?.source || '');
            lastStatus = Number(response?.status || 0);
        } catch (e) {
            lastText = '';
            lastStatus = 0;
        }



// Fast-fail on 403 / CF interstitial for non-last domains:
// Immediately blacklist this domain and return null so the caller tries the next domain.
if (BUNKR_FASTFAIL_ON_403 && (Number(lastStatus || 0) === 403) && !allowWarmup) {
    xfpdBunkrBanBase(originUrl || refererUrl || endpoint);
    return null;
}
if (BUNKR_FASTFAIL_ON_403 && !allowWarmup && xfpdLooksLikeCfChallenge(lastText, null)) {
    xfpdBunkrBanBase(originUrl || refererUrl || endpoint);
    return null;
}
try {
            return JSON.parse(lastText || '{}');
        } catch (e) {
            if (xfpdLooksLikeCfChallenge(lastText, null) && attempt < BUNKR_CF_MAX_RETRIES) {
                if (allowWarmup) {
                    await xfpdBunkrCfWarmup(String(refererUrl || originUrl || endpoint));
                } else {
                    try { await h.delayedResolve(200); } catch (e2) {}
                }
continue;
            }
            return null;
        }
    }
    return null;
}







// Sign a bunkr cdn.cr URL via glb-apisign.cdn.cr — required for download (unsigned URLs return 403).
async function xfpdBunkrSignCdnUrl(http, rawUrl) {
    try {
        const urlObj = new URL(rawUrl);
        const path = decodeURIComponent(urlObj.pathname);
        const signRes = await http.get(
            `https://glb-apisign.cdn.cr/sign?path=${encodeURIComponent(path)}`
        );
        const signText = String(signRes?.source || '');
        const signData = JSON.parse(signText);
        if (signData?.token && signData?.ex) {
            urlObj.searchParams.set('token', String(signData.token));
            urlObj.searchParams.set('ex', String(signData.ex));
            return urlObj.toString();
        }
    } catch (e) {}
    return rawUrl;
}

// Turbo mapping: signed turbocdn URL -> Turbo id (needed for re-sign when resolving from /a/ albums)
const turboIdBySignedUrl = new Map();

const h = {
    /**
   * @param v
   * @returns {arg is any[]}
   */
    isArray: v => Array.isArray(v),
    /**
   * @param v
   * @returns {boolean}
   */
    isObject: v => typeof v === 'object',
    /**
   * @param v
   * @returns {boolean}
   */
    isNullOrUndef: v => v === null || v === undefined || typeof v === 'undefined',
    /**
   * @param path
   * @returns {unknown}
   */
    basename: path =>
    path
    .replace(/\/(\s+)?$/, '')
    .split('/')
    .reverse()[0],
    /**
   * @param path
   * @returns {string}
   */
    fnNoExt: path => path.trim().split('.').reverse().slice(1).reverse().join('.'),
    /**
   * @param path
   * @returns {unknown}
   */
    ext: path => {
        return !path || path.indexOf('.') < 0 ? null : path.split('.').reverse()[0];
    },
    /**
   * @param element
   * @returns {string}
   */
    show: element => (element.style.display = 'block'),
    /**
   * @param element
   * @returns {string}
   */
    hide: element => (element.style.display = 'none'),
    /**
   * @param executor
   * @returns {Promise<unknown>}
   */
    promise: executor => new Promise(executor),
    /**
   * @param ms
   * @returns {Promise<unknown>}
   */
    delayedResolve: async ms => await h.promise(resolve => setTimeout(resolve, ms)),
    /**
   * @param tag
   * @param content
   * @returns {*}
   */
    stripTag: (tag, content) => content.replace(new RegExp(`<${tag}.*?<\/${tag}>`, 'igs'), ''),
    /**
   * @param tags
   * @param content
   * @returns {*}
   */
    stripTags: (tags, content) => tags.reduce((stripped, tag) => h.stripTag(tag, stripped), content),
    /**
   * @param string
   * @param maxLength
   * @returns {string|*}
   */
    limit: (string, maxLength = 20) => (string.length > maxLength ? `${string.substring(0, maxLength - 1)}...` : string),
    /**
   * @param selector
   * @param container
   * @returns {*}
   */
    element: (selector, container = document) => container.querySelector(selector),
    /**
   * @param selector
   * @param container
   * @returns {NodeListOf<*>}
   */
    elements: (selector, container = document) => container.querySelectorAll(selector),
    /**
   * @param needle
   * @param haystack
   * @param ignoreCase
   * @returns {boolean}
   */
    contains: (needle, haystack, ignoreCase = true) =>
    (ignoreCase ? haystack.toLowerCase().indexOf(needle.toLowerCase()) : haystack.indexOf(needle)) > -1,
    /**
   * @param str
   * @returns {*|string}
   */
    ucFirst: str => (!str ? str : `${str[0].toUpperCase()}${str.substring(1)}`),
    /**
   * @param items
   * @param cb
   * @returns {*}
   */
    unique: (items, cb) => {
        if (cb) {
            return items.reduce((acc, item) => (!acc.find(i => i[byKey] === item[byKey]) ? acc.concat(item) : acc), []);
        }

        return items.reduce((acc, item) => (acc.indexOf(item) < 0 ? acc.concat(item) : acc), []);
    },
    /**
   * https://github.com/sindresorhus/pretty-bytes
   *
   * @param number
   * @param options
   * @returns {string}
   */
    prettyBytes: (number, options = {}) => {
        const BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const BIBYTE_UNITS = ['B', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

        const BIT_UNITS = ['b', 'kbit', 'Mbit', 'Gbit', 'Tbit', 'Pbit', 'Ebit', 'Zbit', 'Ybit'];

        const BIBIT_UNITS = ['b', 'kibit', 'Mibit', 'Gibit', 'Tibit', 'Pibit', 'Eibit', 'Zibit', 'Yibit'];

        /*
    Formats the given number using `Number#toLocaleString`.
    - If locale is a string, the value is expected to be a locale-key (for example: `de`).
    - If locale is true, the system default locale is used for translation.
    - If no value for locale is specified, the number is returned unmodified.
    */
        const toLocaleString = (number, locale, options) => {
            let result = number;
            if (typeof locale === 'string' || Array.isArray(locale)) {
                result = number.toLocaleString(locale, options);
            } else if (locale === true || options !== undefined) {
                result = number.toLocaleString(undefined, options);
            }

            return result;
        };

        if (!Number.isFinite(number)) {
            throw new TypeError(`Expected a finite number, got ${typeof number}: ${number}`);
        }

        options = {
            bits: false,
            binary: false,
            space: true,
            ...options,
        };

        const UNITS = options.bits ? (options.binary ? BIBIT_UNITS : BIT_UNITS) : options.binary ? BIBYTE_UNITS : BYTE_UNITS;

        const separator = options.space ? ' ' : '';

        if (options.signed && number === 0) {
            return ` 0${separator}${UNITS[0]}`;
        }

        const isNegative = number < 0;
        const prefix = isNegative ? '-' : options.signed ? '+' : '';

        if (isNegative) {
            number = -number;
        }

        let localeOptions;

        if (options.minimumFractionDigits !== undefined) {
            localeOptions = { minimumFractionDigits: options.minimumFractionDigits };
        }

        if (options.maximumFractionDigits !== undefined) {
            localeOptions = { maximumFractionDigits: options.maximumFractionDigits, ...localeOptions };
        }

        if (number < 1) {
            const numberString = toLocaleString(number, options.locale, localeOptions);
            return prefix + numberString + separator + UNITS[0];
        }

        const exponent = Math.min(Math.floor(options.binary ? Math.log(number) / Math.log(1024) : Math.log10(number) / 3), UNITS.length - 1);
        number /= (options.binary ? 1024 : 1000) ** exponent;

        if (!localeOptions) {
            number = number.toPrecision(3);
        }

        const numberString = toLocaleString(Number(number), options.locale, localeOptions);

        const unit = UNITS[exponent];

        return prefix + numberString + separator + unit;
    },
    ui: {
        /**
     * @param element
     * @param text
     */
        setText: (element, text) => {
            element.textContent = text;
        },
        /**
     * @param element
     * @param props
     */
        setElProps: (element, props) => {
            for (const prop in props) {
                element.style[prop] = props[prop];
            }
        },
    },
    http: {
        /**
     * @param method
     * @param url
     * @param callbacks
     * @param headers
     * @param data
     * @param responseType
     * @returns {Promise<unknown>}
     */
        base: (method, url, callbacks = {}, headers = {}, data = {}, responseType = 'document') => {
            return h.promise((resolve, reject) => {
                let responseHeaders = null;
                let request = null;
                // Allow passing non-header request options via a special key in the headers object.
                // This keeps the original function signature intact.
                const hdrs = {
                    Referer: url,
                    ...(headers || {}),
                };
                const withCredentials = !!(hdrs && Object.prototype.hasOwnProperty.call(hdrs, '__xfpd_withCredentials') && hdrs.__xfpd_withCredentials);
                try { if (hdrs && Object.prototype.hasOwnProperty.call(hdrs, '__xfpd_withCredentials')) delete hdrs.__xfpd_withCredentials; } catch (e) {}

                request = http({
                    url,
                    method,
                    responseType,
                    data,
                    headers: hdrs,
                    ...(withCredentials ? { withCredentials: true, anonymous: false } : {}),
                    onreadystatechange: response => {
                        if (response.readyState === 2) {
                            responseHeaders = response.responseHeaders;
                            const finalUrl = response.finalUrl || response.responseURL || '';

                            if (callbacks && callbacks.onResponseHeadersReceieved) {
                                callbacks.onResponseHeadersReceieved({ request, response, status: response.status, responseHeaders });

                                if (request) {
                                    request.abort();
                                    resolve({ request, response, status: response.status, responseHeaders, finalUrl });
                                }
                            }
                        }

                        callbacks && callbacks.onStateChange && callbacks.onStateChange({ request, response });
                    },
                    onprogress: response => {
                        callbacks && callbacks.onProgress && callbacks.onProgress({ request, response });
                    },
                    onload: response => {
                        const { responseText, status } = response;
                        const dom = response?.response;
                        const finalUrl = response.finalUrl || response.responseURL || '';
                        callbacks && callbacks.onLoad && callbacks.onLoad(response);
                        resolve({ source: responseText, request, status, dom, responseHeaders, finalUrl });
                    },
                    onerror: error => {
                        callbacks && callbacks.onError && callbacks.onError(error);
                        reject(error);
                    },
                });
            });
        },
        /**
     * @param url
     * @param callbacks
     * @param headers
     * @param responseType
     * @returns {Promise<unknown>}
     */
        get: (url, callbacks = {}, headers = {}, responseType = 'document') => {
            return h.promise(resolve => resolve(h.http.base('GET', url, callbacks, headers, null, responseType)));
        },
        /**
     * @param url
     * @param data
     * @param callbacks
     * @param headers
     * @returns {Promise<unknown>}
     */
        post: (url, data = {}, callbacks = {}, headers = {}) => {
            return h.promise(resolve => resolve(h.http.base('POST', url, callbacks, headers, data)));
        },
    },
    re: {
        /**
     * @param pattern
     * @returns {string|*}
     */
        stripFlags: pattern => {
            if (!h.contains('/', pattern)) {
                return pattern;
            }

            const s = pattern.split('').reverse().join('');

            const index = s.indexOf('/');

            return s.substring(index).split('').reverse().join('');
        },
        /**
     * @param pattern
     * @returns {string|*}
     */
        toString: pattern => {
            let stringified = h.re.stripFlags(pattern.toString());

            if (stringified[0] === '/') {
                stringified = stringified.substring(1);
            }

            if (stringified[stringified.length - 1] === '/') {
                stringified = stringified.substring(0, stringified.length - 1);
            }

            return stringified;
        },
        /**
     * @param pattern
     * @param flags
     * @returns {RegExp}
     */
        toRegExp: (pattern, flags) => {
            return new RegExp(pattern, flags);
        },
        /**
     * @param pattern
     * @param subject
     * @returns {*|null}
     */
        match: (pattern, subject) => {
            const matches = pattern.exec(subject);
            return matches && matches.length ? matches[0] : null;
        },
        /**
     * @source regex101.com
     * @param pattern
     * @param subject
     * @returns {*[]}
     */
        matchAll: (pattern, subject) => {
            const matches = [];

            let m;

            while ((m = pattern.exec(subject)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === pattern.lastIndex) {
                    pattern.lastIndex++;
                }

                matches.push(m[0]);
            }

            return matches;
        },
    },
};

Array.prototype.unique = function (cb) {
    return h.unique(this, cb);
};

const parsers = {
    thread: {
        /**
     * @returns {string}
     */
        parseTitle: () => {
            const emojisPattern =
                  /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
            let parsed = h.stripTags(['a', 'span'], h.element('.p-title-value').innerHTML).replace('/\n/g', '');
            return !settings.naming.allowEmojis ? parsed.replace(emojisPattern, settings.naming.invalidCharSubstitute).trim() : parsed.trim();
        },
        /**
         * Return the performer portion of the XenForo thread title. Prefix labels such
         * as OnlyFans, Fansly, TikTok, and category badges are separate DOM elements.
         */
        parsePerformerName: () => {
            const title = h.element('.p-title-value');
            if (!title) return 'Performer';

            const clone = title.cloneNode(true);
            clone
                .querySelectorAll('.label, .labelLink, .prefix, [class*="label--"], a[href*="prefix_id"]')
                .forEach(el => el.remove());

            const parsed = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
            return parsed || parsers.thread.parseTitle() || 'Performer';
        },
        /**
     *
     * @param post
     * @returns {{pageNumber: string, post, spoilers: *, footer: HTMLElement, contentContainer: Element, textContent: (*|string|string), postId: string, postNumber: string, content: (*|string|string|string)}}
     */
        parsePost: post => {
            const article = post.closest('article.message, article[data-content], .message') || post.parentNode?.parentNode;
            const messageContent =
                article?.querySelector('.message-content > .message-userContent') ||
                article?.querySelector('.message-userContent') ||
                article?.querySelector('.message-body');
            const footer = article?.querySelector('footer') || null;

            if (!messageContent) {
                throw new Error('Unable to find this post\'s message content.');
            }

            const messageContentClone = messageContent.cloneNode(true);

            const postIdAnchor =
                post.querySelector('a[href*="/post-"]') ||
                article?.querySelector('.message-attribution a[href*="/post-"]') ||
                article?.querySelector('a[href*="/post-"]');
            const postIdMatch = /post-(\d+)/i.exec(postIdAnchor?.getAttribute('href') || article?.id || '');

            if (!postIdMatch) {
                throw new Error('Unable to determine this post\'s numeric id.');
            }

            const postId = postIdMatch[1];
            const postNumberText = postIdAnchor?.textContent || '';
            const postNumberMatch = /#\s*(\d+)/.exec(postNumberText);
            const postNumber = postNumberMatch?.[1] || postNumberText.replace('#', '').trim() || postId;

            // Remove the following from the post content:
            // 1. Quotes.
            // 2. CodeBlock headers
            // 3. Spoiler button text from each spoiler
            // 2. Icons from un-furled urls (url parser can sometimes match them).
            ['.contentRow-figure', '.js-unfurl-favicon', 'blockquote', '.button-text > span']
                .flatMap(i => [...messageContentClone.querySelectorAll(i)])
                .forEach(i => {
                if (i.tagName === 'BLOCKQUOTE') {
                    // Only remove blockquotes that quote the other posts.
                    if (i.querySelector('.bbCodeBlock-title')) {
                        i.remove();
                    }
                } else {
                    i.remove();
                }
            });

            // Remove thread links.
            [...messageContentClone.querySelectorAll('.contentRow-header > a[href^="https://simpcity.su/threads"]')]
                .map(a => a.parentNode.parentNode.parentNode.parentNode)
                .forEach(i => i.remove());

            // Prevent duplicate detection: Simpcity attachment links often wrap a JPGX preview image.
            // For parsing only, remove the preview <img> inside attachment links so we don't count/download it twice.
            try {
                messageContentClone.querySelectorAll('a[href*="/attachments/"] img').forEach((img) => img.remove());
            } catch (e) { /* ignore */ }

            // Goonbox links wrap a medium-res CDN thumbnail — suppress it so we call the API for the original instead.
            try {
                messageContentClone.querySelectorAll('a[href*="goonbox.cr"] img').forEach((img) => img.remove());
            } catch (e) { /* ignore */ }



            // Decode forum outbound link protection (e.g. /redirect/?to=...&m=b64) for parsing only.
            // Some forums wrap external URLs in a redirect/proxy URL and store the real target in query params
            // (often base64). If we don't decode it, host detection won't see the original domain.
            try {
                const __decodeB64Url = (s) => {
                    if (!s) return null;
                    let b = String(s).trim().replace(/-/g, '+').replace(/_/g, '/');
                    while (b.length % 4) b += '=';
                    try { return atob(b); } catch (e) { return null; }
                };

                const __decodeForumRedirect = (href) => {
                    if (!href) return null;
                    try {
                        const u = new URL(href, location.origin);
                        const p = (u.pathname || '').toLowerCase();

                        const looksRedirect = p === '/redirect' || p === '/redirect/' || p.startsWith('/redirect/');
                        const looksLinkProxy = p.includes('link-proxy');
                        if (!looksRedirect && !looksLinkProxy) return null;

                        const to = u.searchParams.get('to')
                                 || u.searchParams.get('url')
                                 || u.searchParams.get('u')
                                 || u.searchParams.get('link')
                                 || u.searchParams.get('target');
                        if (!to) return null;

                        const mode = (u.searchParams.get('m') || '').toLowerCase();
                        let decoded = null;

                        if (mode === 'b64' || mode === 'base64') {
                            decoded = __decodeB64Url(to);
                        }

                        // Some installs omit the mode flag even though `to` is base64.
                        if (!decoded) {
                            const looksB64 = /^[A-Za-z0-9+/_-]+={0,2}$/.test(to) && to.length >= 16 && (to.length % 4 !== 1);
                            if (looksB64) decoded = __decodeB64Url(to);
                        }

                        if (!decoded) {
                            try { decoded = decodeURIComponent(to); } catch (e) { decoded = to; }
                        }

                        decoded = String(decoded || '').trim();

                        // Some protectors double-encode.
                        if (decoded && !/^https?:\/\//i.test(decoded) && /%3a%2f%2f/i.test(decoded)) {
                            try {
                                const d2 = decodeURIComponent(decoded);
                                if (/^https?:\/\//i.test(d2)) decoded = d2;
                            } catch (e) { /* ignore */ }
                        }

                        if (!/^https?:\/\//i.test(decoded)) return null;
                        return decoded;
                    } catch (e) {
                        return null;
                    }
                };


                const __imagebamFullFromThumb = (thumbUrl) => {
                    if (!thumbUrl) return null;
                    const s = String(thumbUrl).trim();
                    if (!s) return null;

                    try {
                        const u = new URL(s, location.origin);
                        const host = (u.hostname || '').toLowerCase();
                        if (!host.endsWith('.imagebam.com')) return null;
                        if (!host.startsWith('thumbs')) return null;

                        const newHost = host.replace(/^thumbs/i, 'images');
                        let path = u.pathname || '';
                        // common thumb naming: *_t.jpg
                        path = path.replace(/_t(\.[a-z0-9]+)$/i, '$1');
                        // some variants use -t
                        path = path.replace(/-t(\.[a-z0-9]+)$/i, '$1');

                        return `${u.protocol}//${newHost}${path}`;
                    } catch (e) {
                        return null;
                    }
                };

                const sel = [
                    'a[href*="/redirect/"]',
                    'a[href^="/redirect"]',
                    'a[href*="redirect?"]',
                    'a[href*="link-proxy"]',
                ].join(', ');

                messageContentClone.querySelectorAll(sel).forEach((a) => {
                    // Some XenForo installs store the redirect/protected URL in different attrs.
                    const candidates = [
                        a.getAttribute('href'),
                        a.getAttribute('data-href'),
                        a.getAttribute('data-url'),
                    ].filter(Boolean);

                    for (const c of candidates) {
                        const decoded = __decodeForumRedirect(c);
                        if (decoded) {
                            let finalUrl = decoded;
a.setAttribute('data-url', finalUrl);
                            a.setAttribute('href', finalUrl);
                            a.setAttribute('data-xfpd-decoded', '1');
                            break;
                        }
                    }
                });

                // Prevent common thumbnail URLs inside decoded redirect links from being treated as direct downloads.
                // (Keeps the UI intact for non-thumb embeds, but avoids downloading *_t.jpg / thumbs.* previews.)
                try {
                    messageContentClone.querySelectorAll('a[data-xfpd-decoded="1"] img').forEach((img) => {
                        const u = (img.getAttribute('data-url') || img.getAttribute('src') || '').trim();
                        if (!u) return;

                        let host = '';
                        let path = '';
                        try {
                            const uu = new URL(u, location.origin);
                            host = (uu.hostname || '').toLowerCase();
                            path = (uu.pathname || '').toLowerCase();
                        } catch (e) {
                            // ignore
                        }

                        const isThumb =
                            host.includes('thumb') ||
                            /_t\.(?:jpe?g|png|webp|gif)$/i.test(u) ||
                            /\/thumbs?\//i.test(path);

                        if (isThumb) img.remove();
                    });
                } catch (e) { /* ignore */ }
            } catch (e) { /* ignore */ }

            // Extract spoilers from the post content.
            const spoilers = [...messageContentClone.querySelectorAll('.bbCodeBlock--spoiler > .bbCodeBlock-content')]
            .filter(s => !s.querySelector('.bbCodeBlock--unfurl'))
            .concat([...messageContentClone.querySelectorAll('.bbCodeInlineSpoiler')].filter(s => !s.querySelector('.bbCodeBlock--unfurl')))
            .map(s => s.innerText)
            .concat(
                h.re
                .matchAll(/(?<=pw|pass|passwd|password)(\s:|:)?\s+?[a-zA-Z0-9~!@#$%^&*()_+{}|:'"<>?\/,;.]+/gis, messageContentClone.innerText)
                .map(s => s.trim()),
            )
            .map(s =>
                 s
                 .trim()
                 .replace(/^:/, '')
                 .replace(/\bp:\b/i, '')
                 .replace(/\bpw:\b/i, '')
                 .replace(/\bkey:\b/i, '')
                 .trim(),
                )
            .filter(s => s !== '')
            .unique();

            const postContent = messageContentClone.innerHTML;
            const postTextContent = messageContentClone.innerText;

            const matches = /(?<=\/page-)\d+/is.exec(document.location.pathname);

            const pageNumber = matches && matches.length ? Number(matches[0]) : 1;

            return {
                post,
                postId,
                postNumber,
                pageNumber,
                spoilers,
                footer,
                content: postContent,
                textContent: postTextContent,
                contentContainer: messageContent,
            };
        },
    },
    hosts: {
        /**
     * @param postContent
     * @returns {(*&{id: number, enabled: boolean})[]}
     */
        parseHosts: postContent => {
            let parsed = [];

            for (const host of hosts) {
                // Require at-least the signature plus an array of matchers.
                if (host.length < 2) {
                    continue;
                }

                const signature = host[0].split(':');
                const matchers = host[1];

                if (!h.isArray(matchers) || !matchers.length) {
                    continue;
                }

                const name = signature[0];
                let category = signature.length > 1 ? signature[1] : 'misc';

                let singleMatcherPattern = matchers[0];
                let albumMatcherPattern = matchers.length > 1 ? matchers[1] : null;

                const execMatcher = matcher => {
                    let pattern = matcher.toString().replace(/~an@/g, 'a-zA-Z0-9');

                    const stripQueryString = h.contains('<no_qs>', pattern.toString());
                    const stripTrailingSlash = !h.contains('<keep_ts>', pattern.toString());
                    pattern = pattern.replace('<no_qs>', '').replace('<keep_ts>', '');

                    if (h.contains('!!', pattern)) {
                        pattern = pattern.replace('!!', '');
                        pattern = h.re.toRegExp(h.re.toString(pattern), 'igs');
                    } else {
                        const pat = `(?<=data-url="|src="|href=")${h.re.toString(pattern)}.*?(?=")|https?:\/\/(www.)?${h.re.toString(pattern)}.*?(?=("|<|$|\]|'))`;
                        pattern = h.re.toRegExp(pat, 'igs');
                    }

                    let matches = h.re.matchAll(pattern, postContent).unique();

                    matches = matches.map(url => {
                // Some XenForo post HTML can leak into the match (e.g. trailing </a>...</div>), which then
                // creates "ghost" resources (and broken filenames like "div>"). Strip anything after the URL.
                url = String(url || '');
                url = url.replace(/&amp;/g, '&');
                url = url.split(/[\s"'<>]/)[0].trim();
                // Normalize scheme so the same link in different representations dedupes cleanly.
                if (url && !/^https?:\/\//i.test(url)) {
                    url = `https://${url}`;
                }

                        if (stripQueryString && h.contains('?', url)) {
                            url = url.substring(0, url.indexOf('?'));
                        }

                        if (stripTrailingSlash && url[url.length - 1]) {
                            url = url[url.length - 1] === '/' ? url.substring(0, url.length - 1) : url;
                        }

                        return url.trim();
                    });

                    return h.unique(matches);
                };

                const categories = category.split(',');

                if (singleMatcherPattern) {
                    let singleCategory = [categories[0]].map(c => {
                        if (c === 'image' || c === 'video') {
                            return `${h.ucFirst(c)}s`;
                        }

                        if (c.trim() !== '') {
                            return h.ucFirst(c);
                        }

                        return 'Links';
                    })[0];

                    parsed.push({
                        name,
                        type: 'single',
                        category: singleCategory,
                        resources: execMatcher(singleMatcherPattern),
                    });
                }

                if (albumMatcherPattern) {
                    let albumCategory = categories.length > 1 ? categories[1] : categories[0];

                    albumCategory = `${h.ucFirst(albumCategory)} Albums`;

                    parsed.push({
                        name,
                        type: 'album',
                        category: albumCategory,
                        resources: execMatcher(albumMatcherPattern),
                    });
                }
            }

            return parsed
                .map(p => ({
                ...p,
                enabled: true,
                id: Math.round(Math.random() * Number.MAX_SAFE_INTEGER),
            }))
                .filter(p => p.resources.length);
        },
    },
};

const styles = {
    tippy: {
        theme: `.tippy-box[data-theme~=transparent]{background-color:transparent}.tippy-box[data-theme~=transparent]>.tippy-arrow{width:14px;height:14px}.tippy-box[data-theme~=transparent][data-placement^=top]>.tippy-arrow:before{border-width:7px 7px 0;border-top-color:rgba(127,127,127,.35)}.tippy-box[data-theme~=transparent][data-placement^=bottom]>.tippy-arrow:before{border-width:0 7px 7px;border-bottom-color:rgba(127,127,127,.35)}.tippy-box[data-theme~=transparent][data-placement^=left]>.tippy-arrow:before{border-width:7px 0 7px 7px;border-left-color:rgba(127,127,127,.35)}.tippy-box[data-theme~=transparent][data-placement^=right]>.tippy-arrow:before{border-width:7px 7px 7px 0;border-right-color:rgba(127,127,127,.35)}.tippy-box[data-theme~=transparent]>.tippy-backdrop{background-color:transparent}.tippy-box[data-theme~=transparent]>.tippy-svg-arrow{fill:gainsboro}`,
    },
    app: `
#xfpd-page-root, .xfpd-card, .xfpd-progress, .xfpd-split, .xfpd-chip, .xfpd-toggle {
  font-family: inherit;
  box-sizing: border-box;
}
#xfpd-page-root *, .xfpd-card *, .xfpd-progress *, .xfpd-split *, .xfpd-drawer * {
  box-sizing: border-box;
}
.xfpd-split {
  display: inline-flex;
  align-items: stretch;
  border-radius: 999px;
  overflow: hidden;
  vertical-align: middle;
  box-shadow: inset 0 0 0 1px rgba(61,183,199,.38);
  background: rgba(61,183,199,.08);
}
.xfpd-split a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 !important;
  padding: 6px 12px;
  color: #3db7c7 !important;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .01em;
  line-height: 1.1;
  text-decoration: none !important;
  background: transparent;
}
.xfpd-split a:hover { background: rgba(61,183,199,.16); }
.xfpd-split .xfpd-gear {
  padding: 6px 9px;
  border-left: 1px solid rgba(61,183,199,.28);
  opacity: .92;
}
.xfpd-split.is-busy {
  box-shadow: inset 0 0 0 1px rgba(70,156,243,.5);
  background: rgba(70,156,243,.1);
}
.xfpd-split.is-busy a { color: #469cf3 !important; }
.xfpd-attr {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  color: rgb(138,138,138) !important;
  font-size: 12px;
  text-decoration: none !important;
  background: rgba(127,127,127,.08);
}
.xfpd-attr:hover { background: rgba(127,127,127,.16); }
.xfpd-card {
  width: min(460px, 92vw);
  min-width: 320px;
  padding: 0 !important;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(127,127,127,.18);
  box-shadow: 0 18px 50px rgba(0,0,0,.28);
}
.xfpd-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(127,127,127,.14);
}
.xfpd-card-title {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .01em;
}
.xfpd-card-sub {
  margin-top: 2px;
  font-size: 12px;
  opacity: .62;
  font-weight: 500;
}
.xfpd-section {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(127,127,127,.12);
}
.xfpd-section:last-child { border-bottom: 0; }
.xfpd-label {
  display: block;
  margin: 0 0 8px;
  color: #3db7c7;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.xfpd-hint {
  margin-top: 6px;
  font-size: 11px;
  opacity: .55;
  line-height: 1.35;
}
.xfpd-input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(127,127,127,.22);
  background: rgba(127,127,127,.08);
  color: inherit;
  font: inherit;
}
.xfpd-input:focus {
  outline: none;
  border-color: rgba(61,183,199,.7);
  box-shadow: 0 0 0 3px rgba(61,183,199,.15);
}
.xfpd-toggles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.xfpd-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid rgba(127,127,127,.14);
  background: rgba(127,127,127,.07);
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 650;
}
.xfpd-toggle:hover { background: rgba(127,127,127,.12); }
.xfpd-toggle.is-on {
  border-color: rgba(61,183,199,.45);
  background: rgba(61,183,199,.12);
}
.xfpd-toggle input { margin: 0; accent-color: #3db7c7; }
.xfpd-toggle.is-disabled { opacity: .45; pointer-events: none; }
.xfpd-directory-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.xfpd-directory-btn {
  appearance: none;
  padding: 8px 12px;
  border: 1px solid rgba(61,183,199,.5);
  border-radius: 9px;
  background: rgba(61,183,199,.13);
  color: #54c9d8;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
}
.xfpd-directory-btn:hover { background: rgba(61,183,199,.21); }
.xfpd-directory-btn:disabled { cursor: wait; opacity: .58; }
.xfpd-directory-status {
  min-width: 0;
  color: inherit;
  font-size: 11px;
  line-height: 1.35;
  opacity: .62;
  overflow-wrap: anywhere;
}
.xfpd-directory-status.is-ready { color: #54c9d8; opacity: 1; }
.xfpd-directory-status.is-error { color: #ff8f84; opacity: 1; }
.xfpd-hosts-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.xfpd-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.xfpd-chip {
  display: inline-flex;
  flex-direction: column;
  gap: 1px;
  min-width: 92px;
  margin: 0;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(127,127,127,.2);
  background: rgba(127,127,127,.06);
  cursor: pointer;
  user-select: none;
}
.xfpd-chip input { position: absolute; opacity: 0; pointer-events: none; }
.xfpd-chip:hover { background: rgba(127,127,127,.12); }
.xfpd-chip.is-on {
  border-color: rgba(61,183,199,.55);
  background: rgba(61,183,199,.14);
}
.xfpd-chip-name { font-size: 12px; font-weight: 750; }
.xfpd-chip-meta { font-size: 10px; opacity: .62; font-weight: 600; }
.xfpd-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px 14px;
}
.xfpd-link {
  color: #3db7c7 !important;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none !important;
}
.xfpd-link:hover { text-decoration: underline !important; }
.xfpd-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: #3db7c7;
  color: #102226 !important;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.xfpd-cta:hover { filter: brightness(1.06); }
.xfpd-progress {
  display: none;
  margin: 0 0 12px;
  padding: 10px 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(127,127,127,.14);
  background: rgba(127,127,127,.07);
}
.xfpd-progress-status {
  display: block;
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  word-break: break-all;
}
.xfpd-bar-track {
  height: 7px;
  overflow: hidden;
  border-radius: 99px;
  background: rgba(127,127,127,.16);
}
.xfpd-bar-track + .xfpd-bar-track { margin-top: 6px; }
.xfpd-bar-track > div {
  height: 100%;
  width: 0%;
  border-radius: 99px;
  transition: width .16s linear;
}
.xfpd-bar-file { background: #46658b; }
.xfpd-bar-total { background: #3db7c7; }
.xfpd-page-btn {
  display: inline-flex !important;
  align-items: center;
  gap: 8px;
}
.xfpd-page-btn .xfpd-page-count {
  display: inline-flex;
  min-width: 18px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(61,183,199,.18);
  color: #3db7c7;
  font-size: 11px;
  font-weight: 800;
}
.xfpd-fab {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483000;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  border: 0;
  border-radius: 999px;
  background: #171a1c;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 10px 30px rgba(0,0,0,.35);
  cursor: pointer;
}
html[data-color-scheme="light"] .xfpd-fab {
  background: #fff;
  color: #173036;
  box-shadow: 0 10px 28px rgba(16,24,32,.16);
}
.xfpd-fab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3db7c7;
}
.xfpd-global-progress {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2147483003;
  overflow: hidden;
  min-height: 58px;
  border-top: 1px solid rgba(61,183,199,.38);
  background: rgba(15,18,21,.97);
  color: #f4f8f9;
  box-shadow: 0 -12px 34px rgba(0,0,0,.32);
  opacity: 0;
  transform: translateY(110%);
  transition: opacity .2s ease, transform .25s ease;
  pointer-events: none;
}
.xfpd-global-progress.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.xfpd-global-track {
  width: 100%;
  height: 5px;
  background: rgba(255,255,255,.12);
}
.xfpd-global-fill {
  width: 0;
  height: 100%;
  background: linear-gradient(90deg, #3db7c7, #62dfb4);
  box-shadow: 0 0 18px rgba(61,183,199,.55);
  transition: width .18s linear;
}
.xfpd-global-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 12px 20px 14px;
  font-size: 13px;
}
.xfpd-global-title { font-weight: 850; }
.xfpd-global-meta { color: #72d9e5; font-weight: 800; white-space: nowrap; }
body.xfpd-global-active .xfpd-fab { bottom: 78px; }
html[data-color-scheme="light"] .xfpd-global-progress {
  background: rgba(249,251,252,.98);
  color: #152126;
  box-shadow: 0 -10px 28px rgba(16,24,32,.16);
}
@media (max-width: 620px) {
  .xfpd-global-content { padding-inline: 12px; font-size: 12px; }
  .xfpd-global-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.xfpd-drawer-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483001;
  display: none;
  background: rgba(8,10,12,.46);
}
.xfpd-drawer-backdrop.is-open { display: block; }
.xfpd-drawer {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 2147483002;
  display: flex;
  flex-direction: column;
  width: min(420px, 100vw);
  height: 100vh;
  transform: translateX(104%);
  transition: transform .22s ease;
  background: #16181b;
  color: #e8ecef;
  box-shadow: -18px 0 50px rgba(0,0,0,.35);
}
html[data-color-scheme="light"] .xfpd-drawer {
  background: #f6f8fa;
  color: #1b2428;
}
.xfpd-drawer.is-open { transform: translateX(0); }
.xfpd-drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(127,127,127,.16);
}
.xfpd-drawer-title { font-size: 16px; font-weight: 850; }
.xfpd-drawer-sub { margin-top: 4px; font-size: 12px; opacity: .6; }
.xfpd-icon-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: rgba(127,127,127,.12);
  color: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.xfpd-drawer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 18px;
}
.xfpd-drawer-list {
  flex: 1;
  overflow: auto;
  padding: 0 12px 16px;
}
.xfpd-post-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(127,127,127,.14);
  background: rgba(127,127,127,.06);
}
.xfpd-post-row.is-on {
  border-color: rgba(61,183,199,.4);
  background: rgba(61,183,199,.1);
}
.xfpd-post-row input { accent-color: #3db7c7; }
.xfpd-post-num { font-size: 12px; font-weight: 800; }
.xfpd-post-preview {
  display: block;
  max-width: 220px;
  overflow: hidden;
  color: #3db7c7;
  font-size: 12px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: none;
}
.xfpd-post-count {
  font-size: 11px;
  font-weight: 800;
  opacity: .7;
}
.xfpd-drawer-foot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(127,127,127,.16);
}
.xfpd-drawer-foot .xfpd-cta { width: 100%; padding: 11px 14px; font-size: 13px; }
.xfpd-drawer-foot #xfpd-drawer-go { grid-column: 1 / -1; }
.xfpd-cta.xfpd-cta-secondary {
  border: 1px solid rgba(61,183,199,.38);
  background: rgba(61,183,199,.11);
  color: #3db7c7 !important;
}
.xfpd-empty {
  padding: 28px 12px;
  text-align: center;
  opacity: .6;
  font-size: 13px;
}
`
};

const ui = {
    /**
   * @returns {string}
   */
    getTooltipBackgroundColor: () => {
        const scheme = document.documentElement.dataset.colorScheme;
        return scheme === 'dark' ? '#1c1e21' : '#ffffff';
    },

    /**
   * @param target
   * @param content
   * @param options
   * @returns {*}
   */
    tooltip: (target, content, options = {}) => {
        // noinspection JSUnusedGlobalSymbols
        return tippy(target, {
            arrow: true,
            theme: 'transparent',
            allowHTML: true,
            content: content,
            appendTo: () => document.body,
            placement: 'left',
            interactive: true,
            ...options,
        });
    },
    pBars: {
        /**
     * @param color
     * @param height
     * @param width
     * @returns {HTMLDivElement}
     */
        base: (color, height = '7px', width = '0%') => {
            const pb = document.createElement('div');
            pb.style.height = height;
            pb.style.background = color;
            pb.style.width = width;
            return pb;
        },
        /**
     * @param color
     * @returns {HTMLDivElement}
     */
        createFileProgressBar: (color = '#46658b') => {
            const pb = ui.pBars.base(color);
            pb.className = 'xfpd-bar-file';
            return pb;
        },
        /**
     * @param color
     * @returns {HTMLDivElement}
     */
        createTotalProgressBar: (color = '#3db7c7') => {
            const pb = ui.pBars.base(color);
            pb.className = 'xfpd-bar-total';
            return pb;
        },
        wrapBars: (filePB, totalPB) => {
            const fileTrack = document.createElement('div');
            fileTrack.className = 'xfpd-bar-track';
            fileTrack.appendChild(filePB);
            const totalTrack = document.createElement('div');
            totalTrack.className = 'xfpd-bar-track';
            totalTrack.appendChild(totalPB);
            return { fileTrack, totalTrack };
        },
    },
    labels: {
        /**
     * @param initialText
     * @param color
     * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
     */
        createBlockLabel: (initialText = null, color = '#959595') => {
            const container = document.createElement('div');
            container.style.color = color;
            container.style.fontSize = '12px';

            const span = document.createElement('span');
            span.className = 'xfpd-progress-status';
            container.appendChild(span);

            if (initialText) {
                span.textContent = initialText;
            }

            return {
                el: span,
                container,
            };
        },
        status: {
            /**
       * @param initialText
       * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
       */
            createStatusLabel: (initialText = '') => {
                const label = ui.labels.createBlockLabel(initialText);
                return label;
            },
        },
    },
    buttons: {
        /**
     * @returns {HTMLAnchorElement}
     */
        createPostDownloadButton: () => {
            const downloadPostBtn = document.createElement('a');
            downloadPostBtn.setAttribute('href', '#');
            downloadPostBtn.className = 'xfpd-dl';
            downloadPostBtn.innerHTML = '<span class="xfpd-dl-icon">↓</span><span class="xfpd-dl-text">Download</span>';
            return downloadPostBtn;
        },
        createPostOptionsButton: () => {
            const optsBtn = document.createElement('a');
            optsBtn.setAttribute('href', '#');
            optsBtn.className = 'xfpd-gear';
            optsBtn.setAttribute('title', 'Download options');
            optsBtn.setAttribute('aria-label', 'Download options');
            optsBtn.innerHTML = '⚙';
            return optsBtn;
        },
        /**
     * @returns {HTMLLIElement}
     */
        createPostDownloadButtonContainer: () => {
            const li = document.createElement('li');
            li.className = 'xfpd-post-actions';
            return li;
        },
        /**
     * @param post
     * @returns {{container: HTMLLIElement, btn: HTMLAnchorElement, optsBtn: HTMLAnchorElement, split: HTMLDivElement}}
     */
        addDownloadPostButton: post => {
            const btnDownloadPostContainer = ui.buttons.createPostDownloadButtonContainer();
            const split = document.createElement('div');
            split.className = 'xfpd-split';
            const btnDownloadPost = ui.buttons.createPostDownloadButton();
            const optsBtn = ui.buttons.createPostOptionsButton();
            split.appendChild(btnDownloadPost);
            split.appendChild(optsBtn);
            btnDownloadPostContainer.appendChild(split);
            post.prepend(btnDownloadPostContainer);

            return {
                container: btnDownloadPostContainer,
                btn: btnDownloadPost,
                optsBtn,
                split,
            };
        },
    },
    forms: {
        /**
     * @param id
     * @param label
     * @param checked
     * @returns {string}
     */
        createCheckbox: (id, label, checked) => {
            return `
          <label class="xfpd-toggle${checked ? ' is-on' : ''}" for="${id}">
            <input type="checkbox" ${checked ? 'checked="checked"' : ''} id="${id}" />
            <span>${label}</span>
          </label>
          `;
        },
        /**
     * @param content
     * @returns {string}
     */
        createRow: content => {
            return `<div class="xfpd-section">${content}</div>`;
        },
        /**
     * @param label
     * @returns {string}
     */
        createLabel: label => {
            return `<div class="xfpd-label">${label}</div>`;
        },
        config: {
            page: {
                /**
         * @param backgroundColor
         * @param innerHTML
         * @returns {string}
         */
                createForm: (backgroundColor, innerHTML) => {
                    return `
          <form
            id="downloader-page-config-form"
            class="menu-content xfpd-card"
            style="background: ${backgroundColor};"
          >
            ${innerHTML}
          </form>
          `;
                },
            },
            post: {
                /**
         * @param postId
         * @param backgroundColor
         * @param innerHTML
         * @returns {string}
         */
                createForm: (postId, backgroundColor, innerHTML) => {
                    return `
          <form
            id="download-config-form-${postId}"
            class="menu-content xfpd-card"
            style="user-select: none; background: ${backgroundColor};"
          >
            ${innerHTML}
          </form>
          `;
                },
                /**
         * @param currentValue
         * @param postId
         * @param backgroundColor
         * @param placeholder
         * @returns {string}
         */
                createFilenameInput: (currentValue, postId, backgroundColor, placeholder) => {
                    return `
          <div class="xfpd-section">
            <div class="xfpd-label">File / archive name</div>
            <input
              id="filename-input-${postId}"
              type="text"
              class="archive-name input xfpd-input"
              autocomplete="off"
              name="keywords"
              placeholder="${placeholder}"
              aria-label="Archive name"
              value="${currentValue}"
            />
            <div class="xfpd-hint">Tokens: :title: &nbsp; :#: &nbsp; :id:</div>
          </div>
          `;
                },
                createZippedCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-zipped`, 'Zipped', checked),
                createFlattenCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-flatten`, 'Flatten', checked),
                createPerformerFolderCheckbox: (postId, checked) =>
                    ui.forms.createCheckbox(`settings-${postId}-performer-folder`, 'Performer folder', checked),
                createSkipDownloadCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-skip-download`, 'Skip download', checked),
                createVerifyBunkrLinksCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-verify-bunkr-links`, 'Verify Bunkr', checked),
                createGenerateLinksCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-generate-links`, 'Generate links', checked),
                createGenerateLogCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-generate-log`, 'Generate log', checked),
                createSkipDuplicatesCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-skip-duplicates`, 'Skip duplicates', checked),
                /**
         * @param hosts
         * @param getTotalDownloadableResourcesCB
         * @param postId
         * @returns {string}
         */
                createFilterLabel: (hosts, getTotalDownloadableResourcesCB, postId) => {
                    return `
          <div class="xfpd-label">Sources <span id="filtered-count-${postId}">(${getTotalDownloadableResourcesCB(hosts)})</span></div>
          `;
                },
                /**
         * @param postId
         * @returns {string}
         */
                createToggleAllCheckbox: postId => {
                    return `
          <label class="xfpd-chip is-on" for="settings-toggle-all-hosts-${postId}">
            <input type="checkbox" checked="checked" id="settings-toggle-all-hosts-${postId}" />
            <span class="xfpd-chip-name">All sources</span>
            <span class="xfpd-chip-meta">Toggle</span>
          </label>
          `;
                },
                /**
         * @param postId
         * @param host
         * @returns {string}
         */
                createHostCheckbox: (postId, host) => {
                    return `
          <label class="xfpd-chip is-on" for="downloader-host-${host.id}-${postId}">
            <input type="checkbox" checked="checked" id="downloader-host-${host.id}-${postId}" />
            <span class="xfpd-chip-name">${host.name}</span>
            <span class="xfpd-chip-meta">${host.category} · ${host.resources.length}</span>
          </label>
          `;
                },
                /**
         * @param postId
         * @param filterLabel
         * @param hostsHtml
         * @param createToggleAllCheckbox
         * @returns {string}
         */
                createHostCheckboxes: (postId, filterLabel, hostsHtml, createToggleAllCheckbox) => {
                    return `
          <div class="xfpd-section">
            <div class="xfpd-hosts-head">
              ${filterLabel}
            </div>
            <div class="xfpd-chips">
              ${createToggleAllCheckbox ? ui.forms.config.post.createToggleAllCheckbox(postId) : ''}
              ${hostsHtml}
            </div>
          </div>
          `;
                },
                /**
         * @param parsedPost
         * @param parsedHosts
         * @param defaultFilename
         * @param settings
         * @param onSubmitFormCB
         * @param totalDownloadableResourcesForPostCB
         * @param btnDownloadPost
         * @param optsBtn
         */
                createPostConfigForm: (
                    parsedPost,
                    parsedHosts,
                    defaultFilename,
                    settings,
                    onSubmitFormCB,
                    totalDownloadableResourcesForPostCB,
                    btnDownloadPost,
                    optsBtn,
                ) => {
                    const { postId, postNumber } = parsedPost;
                    const color = ui.getTooltipBackgroundColor();

                    const customFilename = settings.output.find(o => o.postId === postId)?.value || '';

                    let hostsHtml = '';
                    parsedHosts.forEach(host => (hostsHtml += ui.forms.config.post.createHostCheckbox(postId, host)));

                    const filterLabel = ui.forms.config.post.createFilterLabel(parsedHosts, totalDownloadableResourcesForPostCB, postId);
                    const totalResources = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);
                    const checkedLength = totalDownloadableResourcesForPostCB(parsedHosts);

                    const settingsGrid = `
          <div class="xfpd-section">
            <div class="xfpd-label">Settings</div>
            <div class="xfpd-toggles">
              ${ui.forms.config.post.createZippedCheckbox(postId, settings.zipped)}
              ${ui.forms.config.post.createFlattenCheckbox(postId, settings.flatten)}
              ${ui.forms.config.post.createPerformerFolderCheckbox(postId, settings.createPerformerFolder)}
              ${ui.forms.config.post.createSkipDuplicatesCheckbox(postId, settings.skipDuplicates)}
              ${ui.forms.config.post.createGenerateLinksCheckbox(postId, settings.generateLinks)}
              ${ui.forms.config.post.createGenerateLogCheckbox(postId, settings.generateLog)}
              ${ui.forms.config.post.createSkipDownloadCheckbox(postId, settings.skipDownload)}
              ${ui.forms.config.post.createVerifyBunkrLinksCheckbox(postId, settings.verifyBunkrLinks)}
            </div>
            <div class="xfpd-directory-row">
              <button type="button" id="xfpd-create-directory-${postId}" class="xfpd-directory-btn">Create directory</button>
              <span id="xfpd-directory-status-${postId}" class="xfpd-directory-status">Choose where the performer folder should live.</span>
            </div>
          </div>
          `;

                    let formHtml = [
                        `<div class="xfpd-card-head">
                            <div>
                              <div class="xfpd-card-title">Download options</div>
                              <div class="xfpd-card-sub">Post #${postNumber} · ${checkedLength}/${totalResources} files</div>
                            </div>
                         </div>`,
                        window.isFF ? ui.forms.config.post.createFilenameInput(customFilename, postId, color, defaultFilename) : null,
                        settingsGrid,
                        ui.forms.config.post.createHostCheckboxes(postId, filterLabel, hostsHtml, parsedHosts.length > 1),
                        `<div class="xfpd-card-foot">
                            <a href="#download-page" class="xfpd-link xfpd-open-page">Page download</a>
                            <button type="submit" class="xfpd-cta">Download ${checkedLength} file${checkedLength === 1 ? '' : 's'}</button>
                         </div>`,
                    ].filter(c => c !== null);

                    const configForm = ui.forms.config.post.createForm(postId, color, formHtml.join(''));
                    const tippyTarget = optsBtn || btnDownloadPost;

                    ui.tooltip(tippyTarget, configForm, {
                        trigger: 'click',
                        placement: 'bottom-end',
                        offset: [0, 10],
                        onShown: instance => {
                            const syncToggleClass = (el) => {
                                if (!el) return;
                                const wrap = el.closest('.xfpd-toggle, .xfpd-chip');
                                if (wrap) wrap.classList.toggle('is-on', !!el.checked);
                            };

                            const inputEl = h.element(`#filename-input-${postId}`);
                            if (inputEl) {
                                inputEl.addEventListener('input', e => {
                                    const value = e.target.value;
                                    const o = settings.output.find(o => o.postId === postId);
                                    if (o) {
                                        o.value = value;
                                    } else {
                                        settings.output.push({
                                            postId,
                                            value,
                                        });
                                    }
                                });
                            }

                            let prevSettings = JSON.parse(JSON.stringify(settings));

                            const setPrevSettings = settings => {
                                prevSettings = JSON.parse(JSON.stringify(settings));
                            };

                            let updateSettings = true;

                            const persist = () => xfpdPersistUiSettings(settings);

                            const performerFolderEl = h.element(`#settings-${postId}-performer-folder`);
                            const directoryButton = h.element(`#xfpd-create-directory-${postId}`);
                            const directoryStatus = h.element(`#xfpd-directory-status-${postId}`);
                            const performerName = xfpdSanitizeDirectoryName(parsers.thread.parsePerformerName());
                            const performerKey = xfpdDirectoryKey(performerName);
                            const setDirectoryUi = (state, message) => {
                                if (directoryStatus) {
                                    directoryStatus.textContent = message;
                                    directoryStatus.classList.toggle('is-ready', state === 'ready');
                                    directoryStatus.classList.toggle('is-error', state === 'error');
                                }
                                if (directoryButton) {
                                    directoryButton.textContent = state === 'ready' ? 'Change directory' : 'Create directory';
                                }
                            };

                            const cachedPerformerHandle = xfpdPerformerHandles.get(performerKey);
                            if (cachedPerformerHandle && !settings._xfpdPerformerDirectoryHandle) {
                                settings._xfpdFolderMode = 'native';
                                settings._xfpdPerformerDirectoryHandle = cachedPerformerHandle;
                            }
                            if (settings._xfpdFolderMode === 'native' && settings._xfpdPerformerDirectoryHandle) {
                                setDirectoryUi('ready', `Ready: ${performerName}`);
                            }

                            directoryButton?.addEventListener('click', async e => {
                                e.preventDefault();
                                e.stopPropagation();

                                settings.createPerformerFolder = true;
                                if (performerFolderEl) {
                                    performerFolderEl.checked = true;
                                    syncToggleClass(performerFolderEl);
                                }
                                persist();

                                directoryButton.disabled = true;
                                setDirectoryUi('working', `Creating “${performerName}”…`);
                                const mode = await xfpdPreparePerformerFolder(settings, null, { forcePicker: true });
                                directoryButton.disabled = false;

                                if (mode === 'native') {
                                    setDirectoryUi('ready', `Ready: ${performerName}`);
                                } else {
                                    setDirectoryUi('error', settings._xfpdFolderError || 'Could not create the directory. Click to try again.');
                                }
                            });

                            if (settings.skipDownload) {
                                const flattenEl0 = h.element(`#settings-${postId}-flatten`);
                                const dupEl0 = h.element(`#settings-${postId}-skip-duplicates`);
                                const linksEl0 = h.element(`#settings-${postId}-generate-links`);
                                if (flattenEl0) {
                                    flattenEl0.disabled = true;
                                    flattenEl0.closest('.xfpd-toggle')?.classList.add('is-disabled');
                                }
                                if (dupEl0) {
                                    dupEl0.disabled = true;
                                    dupEl0.closest('.xfpd-toggle')?.classList.add('is-disabled');
                                }
                                if (linksEl0) {
                                    linksEl0.disabled = true;
                                    linksEl0.closest('.xfpd-toggle')?.classList.add('is-disabled');
                                }
                            }

                            const cta = h.element(`#download-config-form-${postId} .xfpd-cta`);
                            const refreshCta = () => {
                                const n = totalDownloadableResourcesForPostCB(parsedHosts);
                                if (cta) cta.textContent = `Download ${n} file${n === 1 ? '' : 's'}`;
                            };

                            h.element(`#settings-${postId}-skip-download`).addEventListener('change', e => {
                                const checked = e.target.checked;

                                settings.skipDownload = checked;

                                settings.flatten = checked ? false : prevSettings.flatten;
                                settings.skipDuplicates = checked ? false : prevSettings.skipDuplicates;
                                settings.generateLinks = checked ? true : prevSettings.generateLinks;

                                updateSettings = false;

                                const flattenEl = h.element(`#settings-${postId}-flatten`);
                                const dupEl = h.element(`#settings-${postId}-skip-duplicates`);
                                const linksEl = h.element(`#settings-${postId}-generate-links`);

                                flattenEl.checked = checked ? false : prevSettings.flatten;
                                flattenEl.disabled = checked;
                                flattenEl.closest('.xfpd-toggle')?.classList.toggle('is-disabled', checked);
                                syncToggleClass(flattenEl);

                                dupEl.checked = checked ? false : prevSettings.skipDuplicates;
                                dupEl.disabled = checked;
                                dupEl.closest('.xfpd-toggle')?.classList.toggle('is-disabled', checked);
                                syncToggleClass(dupEl);

                                linksEl.checked = checked ? true : prevSettings.generateLinks;
                                linksEl.disabled = checked;
                                linksEl.closest('.xfpd-toggle')?.classList.toggle('is-disabled', checked);
                                syncToggleClass(linksEl);
                                syncToggleClass(e.target);

                                persist();
                                setTimeout(() => (updateSettings = true), 100);
                            });

                            h.element(`#settings-${postId}-verify-bunkr-links`).addEventListener('change', e => {
                                settings.verifyBunkrLinks = e.target.checked;
                                syncToggleClass(e.target);
                                persist();
                            });
                            h.element(`#settings-${postId}-zipped`).addEventListener('change', e => {
                                settings.zipped = e.target.checked;
                                syncToggleClass(e.target);
                                persist();
                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });
                            h.element(`#settings-${postId}-generate-links`).addEventListener('change', e => {
                                settings.generateLinks = e.target.checked;
                                syncToggleClass(e.target);
                                persist();
                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            h.element(`#settings-${postId}-generate-log`).addEventListener('change', e => {
                                settings.generateLog = e.target.checked;
                                syncToggleClass(e.target);
                                persist();
                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            h.element(`#settings-${postId}-flatten`).addEventListener('change', e => {
                                settings.flatten = e.target.checked;
                                syncToggleClass(e.target);
                                persist();
                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            performerFolderEl.addEventListener('change', e => {
                                settings.createPerformerFolder = e.target.checked;
                                syncToggleClass(e.target);
                                if (!e.target.checked) {
                                    delete settings._xfpdFolderMode;
                                    delete settings._xfpdPerformerDirectoryHandle;
                                    setDirectoryUi('idle', 'Choose where the performer folder should live.');
                                }
                                persist();
                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            h.element(`#settings-${postId}-skip-duplicates`).addEventListener('change', e => {
                                settings.skipDuplicates = e.target.checked;
                                syncToggleClass(e.target);
                                persist();
                                if (updateSettings) {
                                    setPrevSettings(settings);
                                }
                            });

                            h.element(`#download-config-form-${postId}`).addEventListener('submit', async e => {
                                e.preventDefault();
                                onSubmitFormCB({ tippyInstance: instance });
                            });

                            const openPage = h.element(`#download-config-form-${postId} .xfpd-open-page`);
                            if (openPage) {
                                openPage.addEventListener('click', e => {
                                    e.preventDefault();
                                    instance.hide();
                                    document.getElementById('download-page')?.click();
                                });
                            }

                            if (parsedHosts.length > 1) {
                                h.element(`#settings-toggle-all-hosts-${postId}`).addEventListener('change', async e => {
                                    e.preventDefault();

                                    const checked = e.target.checked;
                                    syncToggleClass(e.target);

                                    const hostCheckboxes = parsedHosts.flatMap(host => h.element(`#downloader-host-${host.id}-${postId}`));
                                    const checkedHostCheckboxes = hostCheckboxes.filter(el => el.checked);
                                    const unCheckedHostCheckboxes = hostCheckboxes.filter(el => !el.checked);

                                    if (checked) {
                                        unCheckedHostCheckboxes.forEach(c => c.click());
                                    } else {
                                        checkedHostCheckboxes.forEach(c => c.click());
                                    }
                                });
                            }

                            parsedHosts.forEach(host => {
                                h.element(`#downloader-host-${host.id}-${postId}`).addEventListener('change', e => {
                                    host.enabled = e.target.checked;
                                    syncToggleClass(e.target);
                                    const filteredCount = totalDownloadableResourcesForPostCB(parsedHosts);
                                    const countEl = h.element(`#filtered-count-${postId}`);
                                    if (countEl) countEl.textContent = `(${filteredCount})`;
                                    refreshCta();

                                    if (parsedHosts.length > 0) {
                                        const checkedLen = parsedHosts
                                        .flatMap(host => h.element(`#downloader-host-${host.id}-${postId}`))
                                        .filter(hEl => hEl.checked).length;

                                        const totalRes = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);

                                        const totalDownloadableResources = parsedHosts
                                        .filter(host => host.enabled && host.resources.length)
                                        .reduce((acc, host) => acc + host.resources.length, 0);

                                        const textEl = btnDownloadPost.querySelector('.xfpd-dl-text') || btnDownloadPost;
                                        textEl.textContent = `Download (${totalDownloadableResources}/${totalRes})`;

                                        if (parsedHosts.length > 1) {
                                            const toggleAllHostsCheckbox = h.element(`#settings-toggle-all-hosts-${postId}`);

                                            if (checkedLen !== parsedHosts.length) {
                                                toggleAllHostsCheckbox.removeAttribute('checked');
                                                toggleAllHostsCheckbox.checked = false;
                                            } else {
                                                toggleAllHostsCheckbox.setAttribute('checked', 'checked');
                                                toggleAllHostsCheckbox.checked = true;
                                            }
                                            syncToggleClass(toggleAllHostsCheckbox);
                                        }
                                    }
                                });
                            });
                        },
                    });
                },
            },
        },
    },
};

const init = {
    injectCustomStyles: () => {
        const styleEl = document.createElement('style');
        styleEl.textContent = styles.tippy.theme + '\n' + styles.app;
        document.head.append(styleEl);
    },
};
// Holds the posts that are processing downloads.
let processing = [];

/**
 * An array of arrays defining how to match hosts inside the posts.
 *
 * The first item in the array is the signature.
 * The second item is an array of matchers.
 *
 * A matcher is a regular expression matching a substring inside the post.
 *
 * The first matcher matches a single resource (e.g. an image or a video).
 * The second matcher matches a folder or an album (e.g. a set of related images)
 *
 * [0: signature(name+category), 1: [single_regex, album_regex]]
 *
 * When applied, every matcher is prefixed with https?:\/\/(www.)?
 *
 * Every matcher is matched against the following attributes:
 *
 * href, src, data-url
 *
 * You must not include the pattern to match attributes.
 * They are automatically handled when a matcher is run.
 *
 * For a completely custom pattern, put !! (two excl. characters) anywhere in it:
 *
 * [/!!https:\/\/cyberfile.su\/\w+(?=")/, /cyberfile.su\/folder\//]
 *
 * @signature string The name and categories of the host, separated by a colon.
 * @matchers array The name and categories of the host, separated by a colon.
 *
 * Matchers can include the following options anywhere
 * (preferably where it doesn't break the pattern) within a pattern.
 *
 * @option <no_qs> Removes query string
 * @option <keep_ts> Keeps the trailing slash
 *
 * The following placeholders can be used inside any matcher pattern:
 *
 * @placeholder ~an@ -> a-zA-Z0-9
 *
 */
const hosts = [
    ['Simpcity:Attachments', [/(\/attachments\/|\/data\/video\/)/]],
    ['Coomer:Profiles', [/coomer.st\/[~an@._-]+\/user/]],
    ['Coomer:image', [/(\w+\.)?coomer.st\/(data|thumbnail)/]],
    ['JPGX:image', [/(simp\d+\.)?(cuckcapital\.cr|jpg\d?\.(church|fish|fishing|pet|su|cr))\/(?!(img\/|a\/|album\/))/, /jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)[~an@-_.]+<no_qs>/]],
    ['Goonbox:image', [/goonbox\.cr\/img\//, /goonbox\.cr\/a\//]],
    ['kemono:direct link', [/.{2,6}\.kemono.cr\/data\//]],
    ['Postimg:image', [/!!https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})/]],
    ['Ibb:image',
     [
         /!!(?<=href=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/,
         /ibb.co\/album\/[~an@_.-]+/,
     ],
    ],
    ['Ibb:direct link', [/!!(?<=data-src=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/]],
    ['Imagevenue:image', [/!!https?:\/\/(www.)?imagevenue\.com\/(.{8})/]],
    ['Imgvb:image', [/imgvb.com\/images\//, /imgvb.com\/album/]],
    ['Imgbox:image', [/(thumbs|images)(\d+)?.imgbox.com\//, /imgbox.com\/g\//]],
    ['Onlyfans:image', [/public.onlyfans.com\/files/]],
    ['Reddit:image', [/(\w+)?.redd.it/]],
    ['Pomf2:File', [/pomf2.lain.la/]],
    ['Nitter:image', [/nitter\.(.{1,20})\/pic/]],
    ['Twitter:image', [/([~an@.]+)?twimg.com\//]],
    ['Pixhost:image', [/(t|img)(\d+)?\.pixhost.to\//, /pixhost.to\/gallery\//]],
    ['Imagebam:image', [/imagebam.com\/(view|gallery)/]],
    ['Imagebam:full embed', [/images\d.imagebam.com/]],
    ['turbo:video', [/([\w-]+\.)?turbo\.cr\/(embed|v|d)\//]],
    ['turbo:albums', [/([\w-]+\.)?turbo\.cr\/a\//]],
    ['Redgifs:video', [/!!redgifs.com(\/|\\\/)ifr.*?(?=["']|&quot;)/]],
    ['Redgifs:user', [/redgifs\.com\/users\//]],
    ['Bunkr:',
     [
         /!!(?<=href=")https:\/\/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/)).*?(?=")|(?<=(href=")|(src="))https:\/\/((i|cdn|i-pizza|big-taco-1img)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/))\/(v\/)?.*?(?=")/,
     ]
    ],
    ['Bunkr:Albums', [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//]],
    ['Give.xxx:Profiles', [/give.xxx\/[~an@_-]+/]],
    ['Pixeldrain:', [/(focus\.)?(?:pixeldrain\.com|pixeldrain\.net|pixeldra\.in)\/[lu]\//]],
    ['Gofile:', [/gofile.io\/d/]],
    ['Filester:links', [/filester\.(me|sh|si|gg)\/d\//]],
    ['Filester:albums', [/filester\.(me|sh|si|gg)\/f\/[~an@-_.]+<no_qs>/]],
    ['Box.com:', [/m\.box\.com\//]],
    ['Yandex:', [/(disk\.)?yandex\.[a-z]+/]],
    ['Cyberfile:', [/!!https:\/\/cyberfile.(su|me)\/\w+(\/)?(?=")/, /cyberfile.(su|me)\/folder\//]],
    ['Cyberdrop:', [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/(f|e)\//, /cyberdrop\.[a-z]{2,}\/a\//]],
    ['Pornhub:video', [/([~an@]+\.)?pornhub.com\/view_video/]],
    ['Noodlemagazine:video', [/(adult.)?noodlemagazine.com\/watch\//]],
    ['Spankbang:video', [/spankbang.com\/.*?\/video/]],
];

/**
 * An array of url resolvers.
 *
 * @type {((RegExp[]|(function(*): *))[]|(RegExp[]|(function(*, *): Promise<{dom: *, source: *, folderName: *, resolved}>))[]|(RegExp[]|(function(*, *): Promise<string>))[]|(RegExp[]|(function(*, *): Promise<{dom: *, source: *, folderName: *, resolved}>))[]|(RegExp[]|(function(*): *))[])[]}
 */
/* -------------------------------------------------------------------------
 * Turbo sign hardening:
 * - timeout 5000ms
 * - retry 2x with jitter delay 700–1400ms
 * This avoids rare ~50s "waiting" stalls on https://turbo.cr/api/sign
 * ------------------------------------------------------------------------- */
const XFPD_TURBO_SIGN_TIMEOUT_MS = 5000;
const XFPD_TURBO_SIGN_RETRIES = 2;
const XFPD_TURBO_SIGN_JITTER_MIN_MS = 700;
const XFPD_TURBO_SIGN_JITTER_MAX_MS = 1400;

const xfpdSleepMs = ms => new Promise(r => setTimeout(r, ms));
const xfpdJitterMs = (minMs, maxMs) => {
    const lo = Math.min(minMs, maxMs);
    const hi = Math.max(minMs, maxMs);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
};

const xfpdGmGetText = (getUrl, headers, timeoutMs) => new Promise(resolve => {
    try {
        GM_xmlhttpRequest({
            method: 'GET',
            url: String(getUrl),
            headers: headers || {},
            responseType: 'text',
            anonymous: false,
            timeout: Number(timeoutMs) || 0,
            onload: r => resolve({ ok: true, status: r.status || 0, text: String(r.responseText || r.response || '') }),
            onerror: () => resolve({ ok: false, status: 0, text: '' }),
            ontimeout: () => resolve({ ok: false, status: 0, text: '' }),
        });
    } catch (e) {
        resolve({ ok: false, status: 0, text: '' });
    }
});

const xfpdTurboFetchSignJsonWithTimeout = async (turboId, refererUrl) => {
    const id = String(turboId || '').trim();
    if (!id) return null;

    const embedUrl = String(refererUrl || `https://turbo.cr/embed/${id}`);
    const headers = {
        Accept: 'application/json, text/plain, */*',
        Referer: embedUrl,
    };

    const signUrls = [
        `https://turbo.cr/api/sign?v=${encodeURIComponent(id)}`,
        `https://turbo.cr/sign?v=${encodeURIComponent(id)}`,
    ];

    for (let attempt = 0; attempt <= XFPD_TURBO_SIGN_RETRIES; attempt++) {
        for (const signUrl of signUrls) {
            const r = await xfpdGmGetText(signUrl, headers, XFPD_TURBO_SIGN_TIMEOUT_MS);
            if (!r || !r.ok || r.status !== 200 || !r.text) continue;

            let j = null;
            try { j = JSON.parse(r.text); } catch (e) { j = null; }
            if (!j || !j.url) continue;

            const ok = (j.success === undefined) ? true : !!j.success;
            if (ok) return j;
        }
        if (attempt < XFPD_TURBO_SIGN_RETRIES) {
            await xfpdSleepMs(xfpdJitterMs(XFPD_TURBO_SIGN_JITTER_MIN_MS, XFPD_TURBO_SIGN_JITTER_MAX_MS));
        }
    }
    return null;
};

const xfpdTurboSignUrlWithTimeout = async (turboId, refererUrl, nameHint) => {
    const j = await xfpdTurboFetchSignJsonWithTimeout(turboId, refererUrl);
    if (!j || !j.url) return null;

    let signed = j.url;
    const originalName = j.original_filename || nameHint;

    if (signed && originalName && !/[?&]fn=/.test(String(signed))) {
        const enc = encodeURIComponent(String(originalName)).replace(/%20/g, '+');
        signed += (signed.includes('?') ? '&' : '?') + 'fn=' + enc;
    }
    return signed;
};

const resolvers = [
    [
        [/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i],
        url => url.replace(/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i, 'https://pbs.twimg.com/media/$3'),
    ],
    [
        [/imagevenue.com/],
        async (url, http) => {
            const { dom } = await http.get(url);
            return dom.querySelector('.col-md-12 > a > img').getAttribute('src');
        },
    ],
    [[/pomf2.lain.la/], url => url.replace(/pomf2.lain.la\/f\/(.*)\.(\w{3,4})(\?.*)?/, 'pomf2.lain.la/f/$1.$2')],
    [[/coomer.st\/(data|thumbnail)/], url => url],
    [
        [/coomer.st/, /:!coomer.st\/(data|thumbnail)/],
        async (url, http) => {
            const host = `https://coomer.st`;
            const profileId = url.replace(/\?.*/, '').split('/').reverse()[0];
            let finalURL = url.replace(/\?.*/, '');
            let nextPage = null;
            const posts = [];
            console.log(`[coomer.st] Resolving profile: ${profileId}`);
            let page = 1;
            do {
                const { dom } = await http.get(finalURL);
                const links = [...dom.querySelectorAll('.card-list__items > article')]
                .map(a => a.querySelector('.post-card__heading > a'))
                .map(a => {
                    return {
                        link: `${host}${a.getAttribute('href')}`,
                        id: a.getAttribute('href').split('/').reverse()[0],
                    };
                });
                posts.push(...links);
                nextPage = dom.querySelector('a[title="Next page"]');
                if (nextPage) {
                    finalURL = `${host}${nextPage.getAttribute('href')}`;
                }
                console.log(`[coomer.st] Resolved page: ${page}`);
                page++;
            } while (nextPage);
            const resolved = [];
            let index = 1;
            for (const post of posts) {
                const { dom } = await http.get(post.link);
                const filesContainer = dom.querySelector('.post__files');
                if (filesContainer) {
                    const images = filesContainer.querySelectorAll('.post__thumbnail > .fileThumb');
                    if (images.length) {
                        resolved.push(
                            ...[...images].map(a => {
                                return {
                                    url: `${host}${a.getAttribute('href')}`,
                                    folderName: post.id,
                                };
                            }),
                        );
                    }
                }
                const attachments = dom.querySelectorAll('.post__attachments > .post__attachment > .post__attachment-link');
                if (attachments.length) {
                    resolved.push(
                        ...[...attachments].map(a => {
                            const url = `${host}${a.getAttribute('href')}`;
                            let folder = 'Images';
                            const ext = h.ext(url.replace(/\?.*/, ''));
                            if (settings.extensions.video.includes(`.${ext.toLowerCase()}`)) {
                                folder = 'Videos';
                            }
                            {
                                return {
                                    url,
                                    folderName: `${post.id}/${folder}`,
                                };
                            }
                        }),
                    );
                }
                console.log(`[coomer.st] Resolved post ${index} / ${posts.length}`);
                index++;
            }
            return {
                folderName: profileId,
                resolved,
            };
        },
    ],
    [
        [/(postimg|pixxxels).cc/],
        async (url, http) => {
            url = url.replace(/https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})(.*)/, 'https://postimg.cc/$3');
            const { dom } = await http.get(url);
            return dom.querySelector('.controls > nobr > a').getAttribute('href');
        },
    ],
    [[/kemono.cr\/data/], url => url],
    [
        [/goonbox\.cr\/img\//],
        async (url, http) => {
            const id = url.split('/').pop().split('?')[0];
            const fallback = goonboxThumbByUrl.get(url.replace(/\?.*/, '').replace(/\/$/, '')) || null;
            const { source } = await http.get(
                `https://goonbox.cr/api/images/${id}`,
                {},
                { Referer: url, Accept: 'application/json' },
                'text',
            );
            let originalUrl = null;
            if (source) {
                try {
                    originalUrl = JSON.parse(source)?.image?.original_url || null;
                } catch (e) {}
            }
            if (!originalUrl) return fallback;
            try {
                const check = await http.base('HEAD', originalUrl, {}, { Referer: url }, null, 'text');
                if (!check.status || check.status >= 400) {
                    return fallback || originalUrl;
                }
            } catch (e) {
                return fallback || originalUrl;
            }
            return originalUrl;
        },
    ],
    [
        [/goonbox\.cr\/a\//],
        async (url, http) => {
            const albumSlug = url.replace(/\?.*/, '').split('/').filter(Boolean).pop();
            const fetchPage = async page => {
                const { source } = await http.get(
                    `https://goonbox.cr/api/albums/${albumSlug}/images?page=${page}`,
                    {},
                    { Referer: url, Accept: 'application/json' },
                    'text',
                );
                if (!source) return null;
                try {
                    return JSON.parse(source);
                } catch (e) {
                    return null;
                }
            };
            const first = await fetchPage(1);
            if (!first || !h.isArray(first.images)) return null;
            const resolved = first.images.map(img => img.original_url).filter(Boolean);
            const lastPage = first.pagination?.last_page || 1;
            for (let page = 2; page <= lastPage; page++) {
                const data = await fetchPage(page);
                if (data && h.isArray(data.images)) {
                    resolved.push(...data.images.map(img => img.original_url).filter(Boolean));
                }
            }
            return {
                folderName: `goonbox_${albumSlug}`,
                resolved,
            };
        },
    ],
    [
        [/(jpg\d\.(church|fish|fishing|pet|su|cr))|cuckcapital\.cr\//i, /:!jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i],
        url =>
        url
        .replace('.th.', '.')
        .replace('.md.', '.')
    ],
    [
        [/jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i],
        async (url, http, spoilers, postId) => {
            url = url.replace(/\?.*/, '');
            let reFetch = false;
            let { source, dom } = await http.get(url, {
                onStateChange: response => {
                    if (response.readyState === 2 && response.finalUrl !== url) {
                        url = response.finalUrl;
                        reFetch = true;
                    }
                },
            });
            if (reFetch) {
                const { source: src, dom: d } = await http.get(url);
                source = src;
                dom = d;
            }
            if (h.contains('Please enter your password to continue', source)) {
                const authTokenNode = dom.querySelector('input[name="auth_token"]');
                const authToken = !authTokenNode ? null : authTokenNode.getAttribute('value');
                if (!authToken || !spoilers || !spoilers.length) {
                    return null;
                }
                const attemptWithPassword = async password => {
                    const { source, dom } = await http.post(
                        url,
                        `auth_token=${authToken}&content-password=${password}`,
                        {},
                        {
                            Referer: url,
                            Origin: 'https://jpg6.su',
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    );
                    return { source, dom };
                };
                let authenticated = false;
                spoilers = ['ramona'];
                for (const spoiler of spoilers) {
                    const { source: src, dom: d } = await attemptWithPassword(spoiler.trim());
                    if (!h.contains('Please enter your password to continue', src)) {
                        authenticated = true;
                        source = src;
                        dom = d;
                        break;
                    }
                }
                if (!authenticated) {
                    log.host.error(postId, `::Could not resolve password protected album::: ${url}`, 'jpg6.su');
                    return null;
                }
            }
            const resolvePageImages = async dom => {
                const images = [...dom.querySelectorAll('.list-item-image > a > img')]
                .map(img => img.getAttribute('src'))
                .map(url =>
                     url
                     .replace('.md.', '.')
                     .replace('.th.', '.')
                    );
                const nextPage = dom.querySelector('a[data-pagination="next"]');
                if (nextPage && nextPage.hasAttribute('href')) {
                    const { dom } = await http.get(nextPage.getAttribute('href'));
                    images.push(...(await resolvePageImages(dom)));
                }
                return images;
            };
            const resolved = await resolvePageImages(dom);
            return {
                dom,
                source,
                folderName: dom.querySelector('meta[property="og:title"]').content.trim(),
                resolved,
            };
        },
    ],
    [
        [/\/\/ibb.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
        async (url, http) => {
            try{
                const { dom } = await http.get(url);
                return dom.querySelector('.header-content-right > a').getAttribute('href');
            } catch (err){
                url => url;
            }
        },
    ],
    [[/i\.ibb\.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/], url => url],
    [
        [/([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
        async (url, http) => {
            const albumId = url.replace(/\?.*/, '').split('/').reverse()[0];
            const { source, dom } = await http.get(url);
            const imageCount = Number(dom.querySelector('span[data-text="image-count"]').innerText);
            const pageCount = Math.ceil(imageCount / 32);
            const authToken = h.re.match(/(?<=auth_token=").*?(?=")/i, source);
            const fetchPageData = async (albumId, page, seekEnd, authToken) => {
                const seek = seekEnd || '';
                const data = `action=list&list=images&sort=date_desc&page=${page}&from=album&albumid=${albumId}&params_hidden%5Blist%5D=images&params_hidden%5Bfrom%5D=album&params_hidden%5Balbumid%5D=${albumId}&auth_token=${authToken}&seek=${seek}&items_per_page=32`;
                const { source: response } = await http.post(
                    'https://ibb.co/json',
                    data,
                    {},
                    {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                );
                try {
                    const parsed = JSON.parse(response);
                    if (parsed && parsed.status_code && parsed.status_code === 200) {
                        const html = parsed.html.replace('"', '"');
                        return {
                            urls: h.re.matchAll(/(?<=data-object=').*?(?=')/gi, html).map(o => JSON.parse(decodeURIComponent(o)).url),
                            parsed,
                        };
                    }
                    return { urls: [], parsed };
                } catch (e) {
                    return { urls: [], parsed };
                }
            };
            const resolved = [];
            let seekEnd = '';
            for (let i = 1; i <= pageCount; i++) {
                const data = await fetchPageData(albumId, i, seekEnd, authToken);
                seekEnd = data.parsed.seekEnd;
                resolved.push(...data.urls);
            }
            return {
                dom,
                source,
                folderName: dom.querySelector('meta[property="og:title"]').content.trim(),
                resolved,
            };
        },
    ],
    [[/(t|img)(\d+)?\.pixhost.to\//, /:!pixhost.to\/gallery\//], url => url.replace(/\/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/')],
    [
        [/pixhost.to\/gallery\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            let imageLinksInput = dom?.querySelector('.share > div:nth-child(2) > input');
            if (h.isNullOrUndef(imageLinksInput)) {
                imageLinksInput = dom?.querySelector('.share > input:nth-child(2)');
            }
            const resolved = h.re
            .matchAll(/(?<=\[img])https:\/\/t\d+.*?(?=\[\/img])/gis, imageLinksInput.getAttribute('value'))
            .map(url => url.replace(/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/'));
            return {
                dom,
                source,
                folderName: dom?.querySelector('.link > h2').innerText.trim(),
                resolved,
            };
        },
    ],
    [
        [/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org).*?\.|((i|cdn)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/(v\/)?/i, /:!bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/a\//],
        async (url, http) => {
            try {
                const cleanUrl = String(url || '').split('#')[0];
                if (
                    /\.(?:mp4|m4v|webm|mov|mkv|jpg|jpeg|png|gif|webp|zip|rar|7z|pdf)(?:$|\?)/i.test(cleanUrl) &&
                    !/\/(?:v|f|d)\//i.test(cleanUrl)
                ) {
                    return cleanUrl;
                }
                const u = new URL(cleanUrl);
                const origin = u.origin;
                const pathname = u.pathname || '';
                const segments = pathname.split('/').filter(Boolean);
                const index = segments.findIndex(s => ['f', 'v', 'd'].includes(s));
                const id = index > -1 ? segments.slice(index + 1).join('/') : segments.pop();
                let bunkrDataId = null;
                try {
                    const strip = (s) => String(s || '').split('#')[0].split('?')[0];
                    const bases = xfpdBunkrFilterBases([origin, 'https://bunkr.pk', 'https://bunkr.cr']);
                    for (const base of bases) {
                        const base0 = String(base || '').replace(/\/$/, '');
                        const candidates = [];
                        if (/\/v\//i.test(pathname) && base0 === origin) candidates.push(cleanUrl);
                        candidates.push(`${base0}/v/${id}`);
                        candidates.push(`${base0}/f/${id}`);
                        const uniq = candidates.filter((v, i, a) => a.indexOf(v) === i);
                        let found = false;
                        for (const viewUrl of uniq) {
                            const viewRes = await xfpdBunkrGetWithCfRetry(http, viewUrl, base0, base0 === 'https://bunkr.cr');
                            const dom = viewRes?.dom;
                            const viewSource = viewRes?.source || '';
                            if (xfpdLooksLikeCfChallenge(viewSource, dom)) continue;
                            if (!bunkrDataId) {
                                bunkrDataId = dom?.querySelector?.('[data-file-id]')?.getAttribute?.('data-file-id') || null;
                            }
                            let title =
                                dom?.querySelector?.('meta[property="og:title"]')?.getAttribute?.('content') ||
                                dom?.querySelector?.('h1')?.textContent ||
                                dom?.querySelector?.('title')?.textContent ||
                                '';
                            title = String(title || '').replace(/\s+/g, ' ').trim();
                            title = title.replace(/\s*\|\s*Bunkr\s*$/i, '').trim();
                            if (title && !xfpdLooksLikeCfFilenameHint(title)) {
                                bunkrNameByUrl.set(cleanUrl, title);
                                bunkrNameByUrl.set(strip(cleanUrl), title);
                                bunkrNameByUrl.set(viewUrl, title);
                                bunkrNameByUrl.set(strip(viewUrl), title);
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                } catch (e) {}
                const decodeFinalUrl = data => {
                    try {
                        if (!data || !data.url) return null;
                        if (!data.encrypted) return data.url;
                        const binaryString = atob(data.url);
                        const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
                        return Array.from(binaryString)
                            .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                            .join('');
                    } catch (e) {
                        return null;
                    }
                };
                const tryNewApi = async () => {
                    if (!bunkrDataId) return null;
                    try {
                        const refererUrl = `https://get.bunkrr.su/file/${bunkrDataId}`;
                        const response = await http.post(
                            'https://apidl.bunkr.ru/api/_001_v2',
                            JSON.stringify({ id: bunkrDataId }),
                            {},
                            {
                                'Content-Type': 'application/json',
                                Referer: refererUrl,
                                Origin: 'https://get.bunkrr.su',
                            }
                        );
                        const text = String(response?.source || '');
                        if (!text) return null;
                        const data = JSON.parse(text);
                        if (!data) return null;
                        let finalUrl = decodeFinalUrl(data);
                        if (!finalUrl || typeof finalUrl !== 'string') return null;
                        finalUrl = finalUrl.trim();
                        if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
                        finalUrl = await xfpdBunkrSignCdnUrl(http, finalUrl);
                        try {
                            const strip = (s) => String(s || '').split('#')[0].split('?')[0];
                            const hint =
                                xfpdBunkrExtractNameFromVsData(data) ||
                                bunkrNameByUrl.get(cleanUrl) ||
                                bunkrNameByUrl.get(strip(cleanUrl)) ||
                                '';
                            if (hint && String(hint).trim()) {
                                const h0 = String(hint).trim();
                                bunkrNameByUrl.set(cleanUrl, h0);
                                bunkrNameByUrl.set(strip(cleanUrl), h0);
                                bunkrNameByUrl.set(finalUrl, h0);
                                bunkrNameByUrl.set(strip(finalUrl), h0);
                            }
                        } catch (e) {}
                        return finalUrl;
                    } catch (e) {
                        return null;
                    }
                };
                const finalURL = await tryNewApi();
                return finalURL || cleanUrl;
            } catch (error) {
                console.error(error?.message || error);
                return url;
            }
        },
    ],
    [
        [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/a\//],
        async (url, http, _, __, ___, progressCB) => {
            const cleanUrl = String(url || '').split('#')[0];
            const baseUrl = cleanUrl.split('?')[0].replace(/\/+$/, '');
            const resolved = [];
            const seen = new Set();
            const nameHintBySlug = new Map();
            let firstDom = null;
            let firstSource = null;
            const sanitizeName = s => String(s || '')
                .replace(/[\\/:*?"<>|]/g, '-')
                .replace(/\s+/g, ' ')
                .trim();
            const decodeFinalUrl = data => {
                try {
                    if (!data || !data.url) return null;
                    if (!data.encrypted) return data.url;
                    const binaryString = atob(data.url);
                    const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
                    return Array.from(binaryString)
                        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                        .join('');
                } catch (e) {
                    return null;
                }
            };
            const extractSlugsFromDom = dom => {
                const containers = dom?.querySelectorAll?.('.grid-images > div') || [];
                const slugs = [];
                for (const c of containers) {
                    const a =
                        c.querySelector('a[class="after:absolute after:z-10 after:inset-0"]') ||
                        c.querySelector('a[href*="/f/"]') ||
                        c.querySelector('a[href*="/v/"]') ||
                        c.querySelector('a[href*="/d/"]');
                    const href = a?.getAttribute?.('href') || '';
                    const m = href.match(/\/(f|v|d)\/([^\/?#]+)/i);
                    if (m && m[2]) {
                        const slug = m[2];
                        slugs.push(slug);
                        try {
                            let hint = c?.getAttribute?.('title') || '';
                            if (!hint) hint = c?.querySelector?.('.theName')?.textContent || '';
                            if (!hint) hint = c?.querySelector?.('p.truncate')?.textContent || '';
                            if (!hint) hint = c?.querySelector?.('.grid-images_box-txt p')?.textContent || '';
                            hint = String(hint || '').replace(/\s+/g, ' ').trim();
                            if (hint) nameHintBySlug.set(slug, hint);
                        } catch (e) {}
                    }
                }
                return slugs;
            };
            const asyncPool = async (limit, items, worker) => {
                const results = new Array(items.length);
                let i = 0;
                const runners = Array.from({ length: Math.max(1, limit) }, async () => {
                    while (true) {
                        const idx = i++;
                        if (idx >= items.length) break;
                        try {
                            results[idx] = await worker(items[idx], idx);
                        } catch (e) {
                            results[idx] = null;
                        }
                    }
                });
                await Promise.all(runners);
                return results;
            };
            const origin = (() => {
                try { return new URL(baseUrl).origin; } catch (e) { return 'https://bunkr.cr'; }
            })();
            let folderName = null;
            const MAX_PAGES = 500;
            const CONCURRENCY = 8;
            const albumUrlObj = (() => {
                try { return new URL(baseUrl); } catch (e) { return null; }
            })();
            const albumPath = (albumUrlObj && albumUrlObj.pathname) ? albumUrlObj.pathname : (() => {
                try { return new URL(cleanUrl).pathname; } catch (e) { return '/'; }
            })();
            const albumBasesAll = [origin, 'https://bunkr.pk', 'https://bunkr.cr'].filter((v, i, a) => a.indexOf(v) === i);
            let albumBaseChosen = null;
            for (let page = 1; page <= MAX_PAGES; page++) {
                const requestedPageUrl = `${baseUrl}?page=${page}`;
                if (typeof progressCB === 'function') {
                    progressCB(`Resolving: ${requestedPageUrl}`);
                }
                const pageBases = albumBaseChosen
                    ? [albumBaseChosen, ...xfpdBunkrFilterBases(albumBasesAll).filter(b => b !== albumBaseChosen)]
                    : xfpdBunkrFilterBases(albumBasesAll);
                let dom = null, source = '';
                let slugs = [];
                for (const base of pageBases) {
                    const base0 = String(base || '').replace(/\/$/, '');
                    const candidate = `${base0}${albumPath}?page=${page}`;
                    try {
                        ({ dom, source } = await xfpdBunkrGetWithCfRetry(http, candidate, base0, base0 === 'https://bunkr.cr'));
                    } catch (e) {
                        dom = null;
                        source = '';
                    }
                    if (xfpdLooksLikeCfChallenge(source, dom)) continue;
                    slugs = extractSlugsFromDom(dom);
                    if (page === 1 && !slugs.length) {
                        continue;
                    }
                    if (!albumBaseChosen) albumBaseChosen = base0;
                    break;
                }
                if (!dom) break;
                if (!slugs.length) break;
                if (page === 1) {
                    firstDom = dom;
                    firstSource = source;
                    const h1 = dom?.querySelector?.('h1');
                    const title = (h1?.innerText || h1?.textContent || '').split('\n')[0]?.trim();
                    if (title) folderName = sanitizeName(title);
                }
                const fresh = [];
                for (const s of slugs) {
                    if (!s || seen.has(s)) continue;
                    seen.add(s);
                    fresh.push(s);
                }
                if (!fresh.length) break;
                const urls = await asyncPool(CONCURRENCY, fresh, async (slug) => {
                    const fileBase = String(albumBaseChosen || origin || 'https://bunkr.cr').replace(/\/$/, '');
                    const filePageUrl = `${fileBase}/f/${slug}`;
                    let dataId = null;
                    try {
                        const fileRes = await xfpdBunkrGetWithCfRetry(http, filePageUrl, fileBase, fileBase === 'https://bunkr.cr');
                        const fileDom = fileRes?.dom;
                        if (fileDom && !xfpdLooksLikeCfChallenge(fileRes?.source || '', fileDom)) {
                            dataId = fileDom?.querySelector?.('[data-file-id]')?.getAttribute?.('data-file-id') || null;
                        }
                    } catch (e) {}
                    if (!dataId) return null;
                    let data = null;
                    try {
                        const refererUrl = `https://get.bunkrr.su/file/${dataId}`;
                        const response = await http.post(
                            'https://apidl.bunkr.ru/api/_001_v2',
                            JSON.stringify({ id: dataId }),
                            {},
                            {
                                'Content-Type': 'application/json',
                                Referer: refererUrl,
                                Origin: 'https://get.bunkrr.su',
                            }
                        );
                        const text = String(response?.source || '');
                        data = text ? JSON.parse(text) : null;
                    } catch (e) {}
                    if (!data) return null;
                    let finalUrl = decodeFinalUrl(data);
                    if (!finalUrl || typeof finalUrl !== 'string') return null;
                    finalUrl = finalUrl.trim();
                    if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
                    finalUrl = await xfpdBunkrSignCdnUrl(http, finalUrl);
                    try {
                        const strip = (s) => String(s || '').split('#')[0].split('?')[0];
                        const hint = nameHintBySlug.get(slug) || xfpdBunkrExtractNameFromVsData(data) || '';
                        if (hint && String(hint).trim()) {
                            const h0 = String(hint).trim();
                            bunkrNameByUrl.set(finalUrl, h0);
                            bunkrNameByUrl.set(strip(finalUrl), h0);
                        }
                    } catch (e) {}
                    return finalUrl;
                });
                for (const u of urls) if (u) resolved.push(u);
            }
            if (!folderName) folderName = h.basename(baseUrl);
            return {
                dom: firstDom,
                source: firstSource,
                folderName,
                resolved,
            };
        }
    ],
    [
        [/give.xxx\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            const profileId = h.re.match(/(?<=profile-id=")\d+/, source);
            const resolved = [];
            let username = null;
            let firstMediaId = null;
            let mediaId = 1;
            let iteration = 1;
            while (true) {
                let endpoint = `https://give.xxx/api/web/v1/accounts/${profileId}/statuses?only_media=true`;
                endpoint += iteration === 1 ? '&min_id=1' : `&max_id=${mediaId}`;
                const { source } = await http.get(endpoint);
                if (h.contains('_v', source)) {
                    const parsed = JSON.parse(source);
                    if (username === null) {
                        username = parsed[0].account.username;
                    }
                    if (firstMediaId === null) {
                        firstMediaId = parsed[0].id;
                    } else {
                        if (firstMediaId === parsed[0].id) {
                            break;
                        }
                    }
                    resolved.push(
                        ...parsed.flatMap(i => {
                            return i.media_attachments
                                .map(a => {
                                return a.sizes;
                            })
                                .map(s => s.large || s.normal || s.small);
                        }),
                    );
                    mediaId = parsed[parsed.length - 1].id;
                } else {
                    break;
                }
                iteration++;
            }
            return {
                dom,
                source,
                folderName: username,
                resolved,
            };
        },
    ],
    [
        [/(?:focus\.)?(?:pixeldrain\.com|pixeldrain\.net|pixeldra\.in)\/[ul]/],
        url => {
            let resolved = url.replace('/u/', '/api/file/').replace('/l/', '/api/list/');
            resolved = h.contains('/api/list', resolved) ? `${resolved}/zip` : resolved;
            resolved = h.contains('/api/file', resolved) ? `${resolved}?download` : resolved;
            return resolved;
        },
    ],
    [
        [/([~an@]+\.)?pornhub.com\/view_video/],
        async (url, http) => {
            url = url.replace(/([a-zA-Z0-9]+\.)?pornhub/, 'pornhub');
            const resolvePH = async url => {
                const { dom } = await http.get(
                    url,
                    {},
                    {
                        referer: url,
                        cookie: 'age-verified: 1; platform=tv; cookiesBannerSeen=1; hasVisited=1',
                    },
                );
                const script = [...dom.querySelectorAll('script')]
                .map(s => s.innerText)
                .filter(s => /var\smedia_\d+/gis.test(s))
                .map(s => {
                    return {
                        mediaVars: h.re.matchAll(/var\smedia_\d+=.*?;/gis, s),
                        flashVars: s,
                    };
                })[0];
                const { mediaVars, flashVars } = script;
                return mediaVars
                    .map(m => {
                    const cleaned = m
                    .replace(/\/\*.*?\*\//gis, '')
                    .replace(/var\smedia_\d+=/i, '')
                    .replace(';', '');
                    return cleaned
                        .split('+')
                        .map(s => s.trim())
                        .map(s => {
                        let value = new RegExp(`var ${s}=".*?"`, 'isg').exec(flashVars)[0];
                        value = value.replace(/.*?"/i, '').replace(/"/i, '');
                        return value;
                    })
                        .join('');
                })
                    .find(url => url.indexOf('pornhub.com/video/get_media?s=') > -1);
            };
            let parsed = null;
            let tries = 0;
            do {
                const infoURL = await resolvePH(url);
                if (!infoURL) {
                    continue;
                }
                try {
                    const { source } = await h.http.get(infoURL);
                    const json = JSON.parse(source);
                    const fetchedFormats = json.reverse();
                    const qualities = ['1080', '720', '480', '320', '240'];
                    for (const q of qualities) {
                        const f = fetchedFormats.find(f => f.quality === q);
                        if (f && f.videoUrl) {
                            parsed = f.videoUrl;
                            break;
                        }
                    }
                } catch (e) {}
                await h.delayedResolve(1000);
                tries++;
            } while (!parsed && tries < 20);
            return parsed;
        },
    ],
    [
        [/gofile.io\/d/],
        async (url, http, spoilers, postId) => {
        const WT_KEY = 'xfpd_gofile_wt';
        const AT_KEY = 'xfpd_gofile_at';
        const WT_MAX_AGE_MS = 24 * 3600 * 1000;
        const AT_MAX_AGE_MS = 24 * 3600 * 1000;
        const gmGet = (key, fallback) => {
            try {
                return typeof GM_getValue === 'function' ? GM_getValue(key, fallback) : fallback;
            } catch (e) {
                return fallback;
            }
        };
        const gmSet = (key, val) => {
            try {
                if (typeof GM_setValue === 'function') GM_setValue(key, val);
            } catch (e) {}
        };
        const gmReq = async (method, url, data = null, headers = {}, responseType = 'text') => {
            return await http.base(method, url, {}, headers, data, responseType);
        };
        let cachedGenerateWT = null;
        const getGenerateWT = async (force = false) => {
            if (!force && cachedGenerateWT) return cachedGenerateWT;
            const now = Date.now();
            const cached = gmGet(WT_KEY, null);
            let src =
                !force && cached && cached.src && cached.ts && now - cached.ts < WT_MAX_AGE_MS
                    ? cached.src
                    : null;
            if (!src) {
                const { source } = await gmReq('GET', 'https://gofile.io/dist/js/wt.obf.js', null, {}, 'text');
                src = source || '';
                if (!src || !/generateWT/.test(src)) {
                    throw new Error('Could not fetch GoFile wt.obf.js (generateWT).');
                }
                gmSet(WT_KEY, { src, ts: now });
            }
            try {
                const factory = new Function(
                    'navigator',
                    `${src}\nreturn (typeof generateWT === 'function') ? generateWT : null;`,
                );
                const fn = factory(navigator);
                if (typeof fn !== 'function') throw new Error('no generateWT');
                cachedGenerateWT = fn;
                return fn;
            } catch (e) {
                throw new Error('Could not evaluate GoFile generateWT().');
            }
        };
        const computeWebsiteToken = async (token, force = false) => {
            const gen = await getGenerateWT(force);
            return gen(token);
        };
        const createAccountToken = async () => {
            const { source } = await gmReq(
                'POST',
                'https://api.gofile.io/accounts',
                JSON.stringify({}),
                {
                    accept: 'application/json',
                    'content-type': 'application/json',
                },
                'text',
            );
            const json = JSON.parse(source || '{}');
            if (!json || json.status !== 'ok' || !json.data || !json.data.token) {
                throw new Error(`createAccount failed: ${json?.message || json?.status || 'unknown'}`);
            }
            const token = json.data.token;
            try {
                await gmReq(
                    'GET',
                    'https://api.gofile.io/accounts/website',
                    null,
                    { accept: 'application/json', authorization: `Bearer ${token}` },
                    'text',
                );
            } catch (e) {}
            try {
                settings.hosts.goFile.token = token;
            } catch (e) {}
            gmSet(AT_KEY, { token, ts: Date.now() });
            await gofileSyncCookie(token);
            return token;
        };
        const getAccountToken = async (force = false) => {
            let token = null;
            try {
                const override = settings?.hosts?.goFile?.bearerOverride;
                if (override && String(override).trim() !== '') {
                    token = String(override).trim();
                }
            } catch (e) {}
            if (!token) {
                const now = Date.now();
                const cached = gmGet(AT_KEY, null);
                if (!force && cached && cached.token && cached.ts && now - cached.ts < AT_MAX_AGE_MS) {
                    token = cached.token;
                    try {
                        settings.hosts.goFile.token = token;
                    } catch (e) {}
                }
            }
            if (!token) {
                try {
                    if (!force && settings && settings.hosts && settings.hosts.goFile && settings.hosts.goFile.token) {
                        token = settings.hosts.goFile.token;
                    }
                } catch (e) {}
            }
            if (!token) {
                return await createAccountToken();
            }
            await gofileSyncCookie(token);
            return token;
        };
        const apiContentsRaw = async (contentId, passwordHash, token) => {
            const wt = await computeWebsiteToken(token);
            const params = [
                'contentFilter=',
                'page=1',
                'pageSize=1000',
                'sortField=createTime',
                'sortDirection=-1',
            ];
            if (passwordHash) params.push(`password=${encodeURIComponent(passwordHash)}`);
            const apiUrl = `https://api.gofile.io/contents/${encodeURIComponent(contentId)}?${params.join('&')}`;
            const { source } = await gmReq(
                'GET',
                apiUrl,
                null,
                {
                    accept: 'application/json',
                    authorization: `Bearer ${token}`,
                    'x-website-token': wt,
                    'x-bl': (typeof navigator !== 'undefined' && navigator.language) || '',
                },
                'text',
            );
            return JSON.parse(source || '{}');
        };
        const apiContents = async (contentId, passwordHash) => {
            let token = await getAccountToken(false);
            let json = await apiContentsRaw(contentId, passwordHash, token);
            if (json && json.status === 'ok') return json;
            const s = String(json?.status || json?.message || '').toLowerCase();
            if (s.includes('unauthorized') || s.includes('token') || s.includes('invalid')) {
                await getGenerateWT(true);
                token = await getAccountToken(true);
                json = await apiContentsRaw(contentId, passwordHash, token);
                return json;
            }
            return json;
        };
        const resolveAlbum = async (urlOrId, spoilers) => {
            const id = String(urlOrId).includes('gofile.io/d/') ? String(urlOrId).split('/').reverse()[0] : String(urlOrId);
            let props = await apiContents(id, null);
            if (props && props.status === 'error-notFound') {
                log.host.error(postId, `::Album not found::: ${urlOrId}`, 'gofile.io');
                    return null;
                }
            if (props && props.status === 'error-notPublic') {
                log.host.error(postId, `::Album not public::: ${urlOrId}`, 'gofile.io');
                    return null;
                }
            if (props && props.status === 'error-passwordRequired') {
                log.host.info(postId, `::Album requires password::: ${urlOrId}`, 'gofile.io');
                if (!spoilers || !spoilers.length) {
                    return props;
                }
                        log.host.info(postId, `::Trying with ${spoilers.length} available password(s)::`, 'gofile.io');
                    for (const spoiler of spoilers) {
                        const hash = await xfpdSha256(spoiler);
                    const attempt = await apiContents(id, hash);
                    if (attempt && attempt.status === 'ok') {
                            log.host.info(postId, `::Successfully authenticated with:: ${spoiler}`, 'gofile.io');
                        props = attempt;
                        break;
                        }
                    }
                }
                return props;
            };
            const props = await resolveAlbum(url, spoilers);
            let folderName = h.basename(url);
        if (!props || props.status !== 'ok' || !props.data) {
            if (props && props.status === 'error-passwordRequired') {
                log.host.error(postId, `::Password required (no valid password found)::: ${url}`, 'gofile.io');
            } else {
                log.host.error(postId, `::Unable to resolve album::: ${url}`, 'gofile.io');
            }
                return {
                    dom: null,
                    source: null,
                    folderName,
                    resolved: [],
                };
            }
            const resolved = [];
            const getChildAlbums = async (props, spoilers) => {
                if (!props || props.status !== 'ok' || !props.data || !props.data.children) {
                    return [];
                }
                const resolved = [];
            folderName = props.data.name || folderName;
                const files = props.data.children;
                for (const file in files) {
                    const obj = files[file];
                if (!obj) continue;
                    if (obj.type === 'file') {
                    const fileId = obj.id || obj.code;
                    const fileName = encodeURIComponent(obj.name || fileId || 'file');
                    const candidates = [obj.directLink, obj.link, obj.downloadLink].filter(Boolean);
                    let link =
                        candidates.find(u => /\/download\/direct\//i.test(String(u))) ||
                        candidates[0] ||
                        (fileId ? `https://gofile.io/download/web/${fileId}/${fileName}` : null);
                    if (link) {
                        try {
                            if (obj.name) {
                                if (fileId) gofileNameById.set(String(fileId), String(obj.name));
                                if (link) gofileNameByUrl.set(String(link), String(obj.name));
                            }
                        } catch (e) {}
                        resolved.push(link);
                    }
                } else if (obj.type === 'folder') {
                    const folderId = obj.id || obj.code;
                    if (!folderId) continue;
                    const folderProps = await resolveAlbum(folderId, spoilers);
                        resolved.push(...(await getChildAlbums(folderProps, spoilers)));
                    }
                }
                return resolved;
            };
            resolved.push(...(await getChildAlbums(props, spoilers)));
            if (!resolved.length) {
                log.host.error(postId, `::Empty album::: ${url}`, 'gofile.io');
            }
            return {
                dom: null,
                source: null,
                folderName,
                resolved,
            };
        },
    ],
    [
        [/cyberfile.(su|me)\//, /:!cyberfile.(su|me)\/folder\//],
        async (url, http, spoilers) => {
            const { source } = await http.get(url);
            const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];
            const getFileInfo = async () => {
                const { source } = await http.post(
                    'https://cyberfile.me/account/ajax/file_details',
                    `u=${u}`,
                    {},
                    { 'Content-Type': 'application/x-www-form-urlencoded' },
                );
                return source;
            };
            let response = await getFileInfo();
            let requiredPassword = false;
            let unlocked = false;
            if ((h.contains('albumPasswordModel', response) || h.contains('This folder requires a password', response)) && spoilers.length) {
                const html = JSON.parse(response).html;
                const matches = /value="(\d+)"\sid="folderId"|value="(\d+)"\sname="folderId"/is.exec(html);
                const folderId = matches.length ? matches[1] : null;
                if (!folderId) {
                    return null;
                }
                requiredPassword = true;
                for (const password of spoilers) {
                    const { source } = await http.post(
                        'https://cyberfile.me/ajax/folder_password_process',
                        `submitme=1&folderId=${folderId}&folderPassword=${password}`,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );
                    if (h.contains('success', source) && JSON.parse(source).success === true) {
                        unlocked = true;
                        break;
                    }
                }
            }
            if (requiredPassword && unlocked) {
                response = await getFileInfo();
            }
            return h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)[0]?.replace(/\\\//gi, '/');
        },
    ],
    [
        [/cyberfile.(su|me)\/folder\//],
        async (url, http, spoilers) => {
            const { source, dom } = await http.get(url);
            const script = [...dom.querySelectorAll('script')].map(s => s.innerText).filter(s => h.contains('data-toggle="tab"', s))[0];
            const nodeId = h.re.matchAll(/(?<='folder',\s').*?(?=')/gis, script);
            const loadFiles = async () => {
                const { source } = await http.post(
                    'https://cyberfile.me/account/ajax/load_files',
                    `pageType=folder&nodeId=${nodeId}`,
                    {},
                    { 'Content-Type': 'application/x-www-form-urlencoded' },
                );
                return source;
            };
            let response = await loadFiles();
            let requiredPassword = false;
            let unlocked = false;
            if ((h.contains('albumPasswordModel', response) || h.contains('This folder requires a password', response)) && spoilers.length) {
                requiredPassword = true;
                for (const password of spoilers) {
                    const { source } = await http.post(
                        'https://cyberfile.me/ajax/folder_password_process',
                        `submitme=1&folderId=${nodeId}&folderPassword=${password}`,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );
                    if (h.contains('success', source) && JSON.parse(source).success === true) {
                        unlocked = true;
                        break;
                    }
                }
            }
            if (!unlocked) {
                return null;
            }
            if (requiredPassword && unlocked) {
                response = await loadFiles();
            }
            const resolved = [];
            let folderName = h.basename(url);
            const props = JSON.parse(response);
            if (props && props.html) {
                folderName = props.page_title || folderName;
                const urls = h.re.matchAll(/(?<=dtfullurl=").*?(?=")/gis, props.html);
                for (const fileUrl of urls) {
                    const { source } = await http.get(fileUrl);
                    const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];
                    const { source: response } = await http.post(
                        'https://cyberfile.me/account/ajax/file_details',
                        `u=${u}`,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );
                    resolved.push(h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)[0]?.replace(/\\\//gi, '/'));
                }
            }
            return { dom, source, folderName, resolved };
        },
    ],
    [
        [/([\w-]+\.)?turbo\.cr\/a\//],
        async (url, http) => {
            const { dom, source } = await http.get(url);
            const mAlbum = url.match(/\/a\/([^\/?#]+)/i);
            const albumId = mAlbum ? mAlbum[1] : null;
            const base = albumId ? `turbo_${albumId}` : 'turbo_album';
            const rawTitle = dom?.querySelector('h1')?.textContent?.trim() || '';
            const invalidSub = settings.naming.invalidCharSubstitute || '_';
            let safeTitle = rawTitle.replace(/[\\/:*?"<>|]/g, invalidSub).replace(/\s+/g, ' ').trim();
            if (safeTitle.length > 120) safeTitle = safeTitle.slice(0, 120).trim();
            let folderName = base;
            if (safeTitle && safeTitle.toLowerCase() !== base.toLowerCase()) {
                folderName = `${safeTitle} - ${base}`;
            }
            folderName = folderName.replace(/[\\/:*?"<>|]/g, invalidSub).replace(/\s+/g, ' ').trim();
            if (folderName.length > 180) folderName = folderName.slice(0, 180).trim();
            const idToName = new Map();
            let ids = Array.from(dom?.querySelectorAll('tr.file-row') || [])
            .map(row => {
                const a = row.querySelector('a[href^="/v/"]');
                const id = (a?.getAttribute('href') || '').match(/\/v\/([^\/?#]+)/i)?.[1];
                if (id) {
                    const nm = row.getAttribute('data-name') || row.dataset?.name;
                    if (nm) idToName.set(id, nm);
                }
                return id;
            })
            .filter(Boolean)
            .unique();
            if (!ids.length && source) {
                ids = (source.match(/href="\/v\/([^"?#]+)"/gi) || [])
                    .map(s => (s.match(/\/v\/([^"?#]+)/i) || [null, null])[1])
                    .filter(Boolean)
                    .unique();
            }
            const resolved = [];
            for (const id of ids) {
                const embedUrl = `https://turbo.cr/embed/${id}`;
                let signed = null;
                try {
                    signed = await xfpdTurboSignUrlWithTimeout(id, embedUrl, idToName.get(id));
                } catch (e) {}
                if (!signed) {
                    try {
                        const { dom: edom } = await http.get(embedUrl, {}, { Referer: embedUrl });
                        const src =
                              edom?.querySelector('source[src]')?.getAttribute('src') ||
                              edom?.querySelector('video[src]')?.getAttribute('src');
                        if (src) {
                            signed = new URL(src, embedUrl).toString();
                        }
                    } catch (e) {}
                }
                if (signed && /turbocdn\.st/i.test(signed)) {
                    const originalName = idToName.get(id);
                    if (originalName && !/[?&]fn=/.test(signed)) {
                        const enc = encodeURIComponent(String(originalName)).replace(/%20/g, '+');
                        signed += (signed.includes('?') ? '&' : '?') + 'fn=' + enc;
                    }
                }
                if (signed && id) {
                    try { turboIdBySignedUrl.set(String(signed), String(id)); } catch (e) {}
                }
                resolved.push(signed || `https://turbo.cr/d/${id}`);
            }
            return { dom, source, folderName, resolved };
        },
    ],
    [
        [/([\w-]+\.)?turbo\.cr\/(v|d)\//],
        async (url, http) => {
            const mm = url.match(/\/(v|d)\/([^\/?#]+)/i);
            let id = mm ? mm[2] : null;
            if (!id) return url;
            const embedUrl = `https://turbo.cr/embed/${id}`;
            try {
                const signed = await xfpdTurboSignUrlWithTimeout(id, embedUrl, null);
                if (signed) return signed;
            } catch (e) {}
            try {
                const { dom } = await http.get(embedUrl, {}, { Referer: embedUrl });
                const src =
                      dom?.querySelector('source[src]')?.getAttribute('src') ||
                      dom?.querySelector('video[src]')?.getAttribute('src');
                if (src) return new URL(src, embedUrl).toString();
            } catch (e) {}
            return `https://turbo.cr/d/${id}`;
        },
    ],
    [[/public.onlyfans.com\/files/], async url => url],
    [
        [/([\w-]+\.)?turbo\.cr\/embed/],
        async (url, http) => {
            const m = url.match(/\/embed\/([^\/?#]+)/i);
            const id = m ? m[1] : null;
            if (!id) return null;
            const embedUrl = `https://turbo.cr/embed/${id}`;
            try {
                const signed = await xfpdTurboSignUrlWithTimeout(id, embedUrl, null);
                if (signed) return signed;
            } catch (e) {}
            try {
                const { dom } = await http.get(embedUrl, {}, { Referer: embedUrl });
                const src =
                      dom?.querySelector('source[src]')?.getAttribute('src') ||
                      dom?.querySelector('video[src]')?.getAttribute('src');
                if (src) return new URL(src, embedUrl).toString();
            } catch (e) {}
            return null;
        },
    ],
    [
        [/redgifs\.com\/users\//i],
        async (url, http, passwords, postId, postSettings, progressCB) => {
            const raw = String(url || '');
            const m = raw.match(/redgifs\.com\/users\/([^\/?#]+)/i);
            const username = m && m[1] ? decodeURIComponent(m[1]) : '';
            if (!username) return null;
            const baseUrl = `https://www.redgifs.com/users/${username}`;
            const fetchTempToken = async () => {
                try {
                    const { source, status } = await http.get('https://api.redgifs.com/v2/auth/temporary', {}, {}, 'text');
                    if (status === 200 && source && h.contains('token', source)) {
                        const token = JSON.parse(source).token;
                        if (token) GM_setValue('redgifs_token', token);
                        return token || null;
                    }
                } catch (e) {}
                return null;
            };
            let token = GM_getValue('redgifs_token', null);
            if (!token) token = await fetchTempToken();
            if (!token) return null;
            const preferredKeys = ['hd', 'hd1080', 'hd720', 'sd', 'mp4'];
            const resolved = [];
            const MAX_PAGES = 5000;
            const COUNT = 80;
            const ORDER = 'new';
            const fetchPage = async (page, t) => {
                const apiUrl = `https://api.redgifs.com/v2/users/${encodeURIComponent(username)}/search?order=${ORDER}&page=${page}&count=${COUNT}`;
                try {
                    return await http.get(apiUrl, {}, { Authorization: `Bearer ${t}` }, 'text');
                } catch (e) {
                    return { source: null, status: 0 };
                }
            };
            const tryFetchPage = async (page) => {
                let attempt = 0;
                let last = { source: null, status: 0 };
                while (attempt < 3) {
                    attempt++;
                    last = await fetchPage(page, token);
                    if (last.status === 429) {
                        await new Promise(r => setTimeout(r, 800 * attempt));
                        continue;
                    }
                    if (last.status === 401 || last.status === 403 || (last.source && /unauthorized|forbidden/i.test(last.source))) {
                        token = await fetchTempToken();
                        if (!token) return last;
                        last = await fetchPage(page, token);
                    }
                    return last;
                }
                return last;
            };
            let pages = 1;
            for (let page = 1; page <= pages && page <= MAX_PAGES; page++) {
                if (typeof progressCB === 'function') {
                    progressCB(`Resolving: ${baseUrl} (page ${page}/${pages})`);
                }
                const { source, status } = await tryFetchPage(page);
                if (status !== 200 || !source) break;
                let j;
                try { j = JSON.parse(source); } catch (e) { break; }
                const gifs = Array.isArray(j?.gifs) ? j.gifs : (Array.isArray(j?.results) ? j.results : []);
                pages = Number(j?.pages) || pages;
                for (const g of gifs) {
                    const urls = g?.urls || g?.gif?.urls;
                    if (!urls) continue;
                    let best = null;
                    for (const k of preferredKeys) {
                        const v = urls[k];
                        if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
                            best = v;
                            break;
                        }
                    }
                    if (!best) {
                        for (const v of Object.values(urls)) {
                            if (typeof v === 'string' && /^https?:\/\//i.test(v) && /\.mp4(\?|$)/i.test(v)) {
                                best = v;
                                break;
                            }
                        }
                    }
                    if (best) resolved.push(best);
                }
                if (!gifs.length) break;
                await new Promise(r => setTimeout(r, 75));
            }
            if (!resolved.length) return null;
            return { folderName: username, resolved };
        },
    ],
    [
        [/redgifs\.com(\/|\\\/)(ifr|watch|gifs\/detail|gifs\/watch)/i],
        async (url, http) => {
            const raw = String(url || '');
            const idMatch =
                  raw.match(/redgifs\.com(?:\/|\\\/)(?:ifr(?:\/|\\\/)|watch(?:\/|\\\/)|gifs(?:\/|\\\/)detail(?:\/|\\\/))?([a-z0-9_-]+)/i) ||
                  raw.match(/\/([a-z0-9_-]+)(?:\?.*)?$/i);
            const id = (idMatch && idMatch[1] ? String(idMatch[1]) : '').match(/[a-z0-9_-]+/i)?.[0];
            if (!id) return null;
            const fetchTempToken = async () => {
                try {
                    const { source, status } = await http.get('https://api.redgifs.com/v2/auth/temporary', {}, {}, 'text');
                    if (status === 200 && source && h.contains('token', source)) {
                        const token = JSON.parse(source).token;
                        if (token) GM_setValue('redgifs_token', token);
                        return token || null;
                    }
                } catch (e) {}
                return null;
            };
            let token = GM_getValue('redgifs_token', null);
            if (!token) token = await fetchTempToken();
            if (!token) return null;
            const apiUrl = `https://api.redgifs.com/v2/gifs/${id}`;
            const fetchGif = async t => {
                try {
                    return await http.get(apiUrl, {}, { Authorization: `Bearer ${t}` }, 'text');
                } catch (e) {
                    return { source: null, status: 0 };
                }
            };
            let { source, status } = await fetchGif(token);
            if (status === 401 || status === 403 || (source && /unauthorized|forbidden/i.test(source))) {
                token = await fetchTempToken();
                if (!token) return null;
                ({ source, status } = await fetchGif(token));
            }
            if (status !== 200 || !source) return null;
            let j;
            try { j = JSON.parse(source); } catch (e) { return null; }
            const urls = j?.gif?.urls || j?.urls;
            if (!urls) return null;
            const preferredKeys = ['hd', 'hd1080', 'hd720', 'sd', 'mp4'];
            for (const k of preferredKeys) {
                const v = urls[k];
                if (typeof v === 'string' && /^https?:\/\//i.test(v)) return v;
            }
            for (const v of Object.values(urls)) {
                if (typeof v === 'string' && /\.mp4(\?|$)/i.test(v)) return v;
            }
            return null;
        },
    ],
    [
        [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/a\//],
        async (url, http, passwords, postId, postSettings, progressCB) => {
            try {
                url = String(url || '').trim();
                if (url.startsWith('//')) url = 'https:' + url;
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
                const albumIdMatch = url.match(/\/a\/([^\/?#]+)/i);
                const albumId = albumIdMatch ? albumIdMatch[1] : '';
                const pageUrl = url;
                let pageOrigin = 'https://cyberdrop.cr';
                try { pageOrigin = new URL(pageUrl).origin; } catch (e) {}
                const decodeHtml = (s) => {
                    try {
                        const t = document.createElement('textarea');
                        t.innerHTML = String(s || '');
                        return t.value;
                    } catch (e) {
                        return String(s || '');
                    }
                };
                const getAlbumHtml = async () => {
                    progressCB?.('Cyberdrop: loading album page');
                    const r = await http.get(pageUrl, {}, {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Referer': pageOrigin + '/',
                        'Origin': pageOrigin,
                    }, 'text');
                    return r && r.source ? r.source : '';
                };
                let html = await getAlbumHtml();
                const extractSlugs = (src) => {
                    const slugs = [];
                    const seen = new Set();
                    const re = /href\s*=\s*["'](?:https?:\/\/(?:[\w-]+\.)*cyberdrop\.[a-z.]+)?\/f\/([A-Za-z0-9_-]+)(?:[\/?#"'])/ig;
                    let m;
                    while ((m = re.exec(src || '')) !== null) {
                        const s = m[1];
                        if (s && !seen.has(s)) {
                            seen.add(s);
                            slugs.push(s);
                        }
                    }
                    return slugs;
                };
                let slugs = extractSlugs(html);
                if (!slugs.length && typeof cyberdropWarmupOnce === 'function') {
                    await cyberdropWarmupOnce(pageUrl);
                    html = await getAlbumHtml();
                    slugs = extractSlugs(html);
                }
                if (!slugs.length) return url;
                const pickTitle = (src) => {
                    const m1 = src.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                               src.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
                    const m2 = src.match(/<h1[^>]*>([^<]+)<\/h1>/i);
                    const m3 = src.match(/<title[^>]*>([^<]+)<\/title>/i);
                    let t = (m1 && (m1[1] || m1[2])) || (m2 && m2[1]) || (m3 && m3[1]) || '';
                    t = decodeHtml(t).trim();
                    t = t.replace(/\s*\|\s*CyberDrop.*$/i, '').replace(/\s*-\s*CyberDrop.*$/i, '').trim();
                    if (!t) t = albumId ? `cyberdrop_${albumId}` : 'cyberdrop_album';
                    return t;
                };
                const folderName = pickTitle(html);
                try {
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const nodes = doc.querySelectorAll('a#file[href^="/f/"], a[id="file"][href^="/f/"], a[href^="/f/"][title]');
                    nodes.forEach((a) => {
                        const href = a.getAttribute('href') || '';
                        const m = href.match(/\/f\/([A-Za-z0-9]+)/);
                        if (!m) return;
                        const slug = m[1];
                        const nm = (a.getAttribute('title') || a.textContent || '').trim();
                        if (nm) cyberdropNameBySlug.set(slug, nm);
                    });
                } catch (e) {}
                const host = (() => { try { return new URL(pageUrl).hostname; } catch (e) { return ''; } })();
                const root = (String(host || '').match(/cyberdrop\.[a-z]+$/i) || [null])[0];
                const apiBases = [];
                if (root) apiBases.push(`https://api.${root}`);
                apiBases.push('https://api.cyberdrop.cr');
                const apiBaseList = [...new Set(apiBases)];
                const resolved = [];
                for (let i = 0; i < slugs.length; i++) {
                    const slug = slugs[i];
                    progressCB?.(`Cyberdrop: resolving ${i + 1}/${slugs.length}`);
                    let j = null;
                    for (const base of apiBaseList) {
                        const apiUrl = `${base}/api/file/auth/${slug}`;
                        const r = await http.get(apiUrl, {}, {
                            'Accept': 'application/json, text/plain, */*',
                            'Origin': pageOrigin,
                            'Referer': pageOrigin + '/',
                        }, 'text');
                        if (!r || !r.source) continue;
                        try { j = JSON.parse(r.source); } catch (e) { j = null; }
                        if (j) break;
                    }
                    if (!j) continue;
                    let direct = null;
                    if (typeof j.url === 'string') direct = j.url;
                    else if (j.data && typeof j.data.url === 'string') direct = j.data.url;
                    else if (typeof j.file === 'string') direct = j.file;
                    else if (j.data && typeof j.data.file === 'string') direct = j.data.file;
                    if (typeof direct !== 'string' || !direct.trim()) continue;
                    direct = direct.trim();
                    if (direct.startsWith('//')) direct = 'https:' + direct;
                    if (!/^https?:\/\//i.test(direct)) continue;
                    resolved.push(direct);
                }
                if (!resolved.length) return url;
                return { folderName, resolved };
            } catch (e) {
                return url;
            }
        },
    ],
    [
        [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/(f|e)\//, /:!cyberdrop\.[a-z]{2,}\/a\//],
        async (url, http) => {
            try {
                url = String(url || '').trim();
                if (url.startsWith('//')) url = 'https:' + url;
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
                if (url.includes('fs-') || url.includes('img-')) {
                    url = url.replace(/(fs|img)-\d+/i, '').replace(/(to|cc|nl)-\d+/i, 'me');
                }
                const u = new URL(url);
                const origin = `${u.protocol}//${u.hostname}`;
                const slugMatch = String(url).match(/\/([ef])\/([^\/?#]+)/i);
                if (!slugMatch || !slugMatch[2]) return url;
                const slug = slugMatch[2];
                const pageUrl = `${origin}/f/${slug}`;
                const apiCandidates = [];
                const root = (u.hostname.match(/cyberdrop\.[a-z]+$/i) || [null])[0];
                const apiBaseDefault = root ? `https://api.${root}` : 'https://api.cyberdrop.cr';
                if (root) {
                    apiCandidates.push(`https://api.${root}/api/file/info/${slug}`);
                    apiCandidates.push(`https://api.${root}/api/file/auth/${slug}`);
                }
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/info/${slug}`);
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/auth/${slug}`);
                apiCandidates.push(`${origin}/api/f/${slug}`);
                const headers = {
                    Accept: 'application/json, text/plain, */*',
                    Referer: `${origin}/`,
                    Origin: origin,
                };
                const cyberdropGmGetText = (reqUrl, hdrs) => new Promise(resolve => {
                    try {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: String(reqUrl),
                            headers: hdrs || {},
                            responseType: 'text',
                            anonymous: false,
                            timeout: 6000,
                            onload: r => resolve({ status: r.status || 0, source: String(r.responseText || r.response || '') }),
                            onerror: () => resolve({ status: 0, source: '' }),
                            ontimeout: () => resolve({ status: 0, source: '' }),
                        });
                    } catch (e) {
                        resolve({ status: 0, source: '' });
                    }
                });
                const fetchInfo = async () => {
                    for (const apiUrl of apiCandidates) {
                        try {
                            let r = await cyberdropGmGetText(apiUrl, headers);
                            if ((r.status === 0) && (headers.Origin || headers.Referer)) {
                                r = await cyberdropGmGetText(apiUrl, { Accept: headers.Accept });
                            }
                            if (r.status !== 200 || !r.source) continue;
                            const j = JSON.parse(r.source);
                            let name = j?.name || j?.filename || j?.fileName || j?.data?.name || j?.file?.name || '';
                            let direct = j?.url || j?.downloadUrl || j?.data?.url || j?.file?.url || null;
                            let auth = j?.auth_url || j?.authUrl || j?.data?.auth_url || null;
                            if (!direct && auth) {
                                const ar = await cyberdropGmGetText(auth, headers);
                                if (ar.status === 200 && ar.source) {
                                    try {
                                        const aj = JSON.parse(ar.source);
                                        direct = aj?.url || aj?.data?.url || direct;
                                        name = name || aj?.name || aj?.filename || '';
                                    } catch (e) {}
                                }
                            }
                            if (name) cyberdropNameBySlug.set(String(slug), String(name));
                            if (direct && typeof direct === 'string') {
                                if (direct.startsWith('/')) direct = `${apiBaseDefault}${direct}`;
                                if (name) cyberdropNameByUrl.set(String(direct), String(name));
                                return direct;
                            }
                        } catch (e) {}
                    }
                    return null;
                };
                let directUrl = await fetchInfo();
                if (!directUrl) directUrl = await fetchInfo();
                if (directUrl) return directUrl;
                let warmKey = 'cyberdrop';
                try { warmKey = `cyberdrop:${new URL(pageUrl).origin}`; } catch (e) {}
                await cyberdropWarmupOnce(warmKey, pageUrl, CYBERDROP_WARMUP_DEFAULT_MS);
                directUrl = await fetchInfo();
                if (!directUrl) directUrl = await fetchInfo();
                return directUrl || url;
            } catch (e) {
                return url;
            }
        },
    ],
    [
        [/noodlemagazine.com\/watch\//],
        async (url, http) => {
            const { dom } = await http.get(url);
            let playerIFrameUrl = dom.querySelector('#iplayer')?.getAttribute('src');
            if (!playerIFrameUrl) return null;
            playerIFrameUrl = playerIFrameUrl.replace('/player/', 'https://noodlemagazine.com/playlist/');
            const { source } = await http.get(playerIFrameUrl);
            const props = JSON.parse(source || JSON.stringify([]));
            if (props.sources && props.sources.length) {
                return props.sources[0].file;
            }
            return null;
        },
    ],
    [
        [/spankbang.com\/.*?\/video/],
        async (url, http) => {
            const { source } = await http.get(url);
            let streamData = h.re.matchAll(/(?<=stream_data\s=\s){.*?}.*?(?=;)/gis, source)[0].replace(/'/g, '"');
            streamData = JSON.parse(streamData);
            const qualities = ['240p', '320p', '480p', '720p', '1080p', '4k'].reverse();
            for (const quality of qualities) {
                if (streamData[quality].length) {
                    return streamData[quality][0];
                }
            }
            return null;
        },
    ],
    [
        [/imagebam.com\/(view|gallery)/],
        async (url, http) => {
            const date = new Date();
            date.setTime(date.getTime() + 6 * 60 * 60 * 1000);
            const expires = '; expires=' + date.toUTCString();
            const { source, dom } = await http.get(url, {}, { cookie: 'nsfw_inter=1' + expires + '; path=/' });
            if (h.contains('gallery-name', source)) {
                const resolved = [];
                const imageLinksInput = dom.querySelector('.links.gallery > div:nth-child(2) > div > input');
                const rawImageLinks = h.re.matchAll(/(?<=\[URL=).*?(?=])/gis, imageLinksInput.getAttribute('value'));
                for (const link of rawImageLinks) {
                    const { dom } = await http.get(link);
                    resolved.push(dom?.querySelector('.main-image')?.getAttribute('src'));
                }
                return {
                    dom,
                    source,
                    folderName: dom?.querySelector('#gallery-name').innerText.trim(),
                    resolved,
                };
            }
            return dom?.querySelector('.main-image')?.getAttribute('src');
        },
    ],
    [[/images\d.imagebam.com/], url => url],
    [[/imgvb.com\/images\//, /:!imgvb.com\/album\//], url => url.replace('.th.', '.').replace('.md.', '.')],
    [
        [/imgvb.com\/album\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            const resolved = [...dom.querySelectorAll('.image-container > img')]
            .map(i => i.getAttribute('src'))
            .map(url => url.replace('.th.', '.').replace('.md.', '.'));
            return {
                dom,
                source,
                folderName: dom?.querySelector('meta[property="og:title"]').content.trim(),
                resolved,
            };
        },
    ],
    [
        [/(\/attachments\/|\/data\/video\/)/],
        async (url) => {
            url = String(url || '').trim();
            url = url.replace(/^https?:\/\/https?:\/\//i, 'https://');
            url = url.replace(/^https?:\/\/\//i, '/');
            if (/^https?:\/\//i.test(url)) return url;
            if (!url.startsWith('/')) url = '/' + url;
            return `https://simpcity.su${url}`;
        },
    ],
    [[/(thumbs|images)(\d+)?.imgbox.com\//, /:!imgbox.com\/g\//], url => url.replace(/_t\./gi, '_o.').replace(/thumbs/i, 'images')],
    [
        [/imgbox.com\/g\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            const resolved = [...dom?.querySelectorAll('#gallery-view-content > a > img')]
            .map(img => img.getAttribute('src'))
            .map(url => url.replace(/(thumbs|t)(\d+)\./gis, 'images$2.').replace('_b.', '_o.'));
            return {
                dom,
                source,
                folderName: dom?.querySelector('#gallery-view > h1').innerText.trim(),
                resolved,
            };
        },
    ],
    [
        [/filester\.(me|sh|si|gg)\/f\//],
        async (url, http, spoilers, postId, postSettings, progressCB) => {
            try {
                url = String(url || '').trim();
                if (!url) return null;
                if (url.startsWith('//')) url = 'https:' + url;
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
                const u0 = new URL(url);
                const origin = `${u0.protocol}//${u0.hostname}`;
                const mId = (u0.pathname || '').match(/\/f\/([^\/?#]+)/i);
                if (!mId || !mId[1]) return url;
                const albumId = mId[1];
                const baseUrl = `${origin}/f/${albumId}`;
                const resolved = [];
                const seen = new Set();
                let firstDom = null;
                let firstSource = '';
                let folderName = '';
                const MAX_PAGES = 500;
                const getFolderName = (dom, html) => {
                    try {
                        const pickClean = (s) => {
                            s = String(s || '').trim();
                            if (!s) return '';
                            s = s.replace(/\s*\|\s*filester\.(me|sh|si|gg)\s*$/i, '').trim();
                            s = s.replace(/\s*-\s*filester\.(me|sh|si|gg)\s*$/i, '').trim();
                            if (s.includes('|')) s = s.replace(/\s*\|\s*/g, ' - ').trim();
                            return s.replace(/\s+/g, ' ').trim();
                        };
                        const isBad = (t) => {
                            const x = String(t || '').trim();
                            if (!x) return true;
                            if (/^filester\.(me|sh|si|gg)\b/i.test(x)) return true;
                            if (/BETA\s*\d/i.test(x)) return true;
                            return false;
                        };
                        let t = '';
                        try { t = pickClean(dom?.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''); } catch (e) {}
                        try { if (!t) t = pickClean(dom?.querySelector('title')?.textContent || ''); } catch (e) {}
                        if (isBad(t)) return albumId;
                        return t;
                    } catch (e) {}
                    return albumId;
                };
                const addHint = (slug, name, sizeBytes) => {
                    try {
                        const dUrl = `${origin}/d/${slug}`;
                        if (name) {
                            filesterNameBySlug.set(String(slug), String(name));
                            filesterNameByUrl.set(String(dUrl), String(name));
                        }
                        if (sizeBytes) {
                            filesterSizeBySlug.set(String(slug), Number(sizeBytes));
                            filesterSizeByUrl.set(String(dUrl), Number(sizeBytes));
                        }
                        filesterSlugByUrl.set(String(dUrl), String(slug));
                    } catch (e) {}
                };
                const parsePage = (dom, html) => {
                    const out = [];
                    try {
                        const items = dom ? [...dom.querySelectorAll('div.file-item')] : [];
                        for (const el of items) {
                            let slug = '';
                            try {
                                const oc = String(el.getAttribute('onclick') || '');
                                const m = /\/d\/([^'"?\s]+)/i.exec(oc);
                                if (m && m[1]) slug = m[1];
                            } catch (e) {}
                            if (!slug) {
                                try {
                                    const btn = el.querySelector('button.download-btn');
                                    const oc2 = String(btn?.getAttribute?.('onclick') || '');
                                    const m2 = /downloadFile\(\s*'([^']+)'/i.exec(oc2);
                                    if (m2 && m2[1]) slug = m2[1];
                                } catch (e) {}
                            }
                            if (!slug) {
                                try {
                                    const a = el.querySelector('a[href*="/d/"]');
                                    const href = String(a?.getAttribute?.('href') || '');
                                    const m3 = /\/d\/([^\/?#]+)/i.exec(href);
                                    if (m3 && m3[1]) slug = m3[1];
                                } catch (e) {}
                            }
                            if (!slug) continue;
                            let name = '';
                            let size = 0;
                            try { name = String(el.getAttribute('data-name') || '').trim(); } catch (e) {}
                            if (!name) {
                                try { name = String(el.querySelector('.file-name')?.textContent || '').trim(); } catch (e) {}
                            }
                            try { size = Number(el.getAttribute('data-size') || 0) || 0; } catch (e) {}
                            out.push({ slug, name, size });
                        }
                    } catch (e) {}
                    return out;
                };
                for (let page = 1; page <= MAX_PAGES; page++) {
                    const u = new URL(baseUrl);
                    u.searchParams.set('page', String(page));
                    const pageUrl = u.toString();
                    if (typeof progressCB === 'function') progressCB(`[Filester] Resolving album page ${page}`);
                    let dom = null;
                    let source = '';
                    try {
                        const r = await http.get(pageUrl, {}, {
                            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            Referer: baseUrl,
                            __xfpd_withCredentials: true,
                        });
                        dom = r?.dom;
                        source = r?.source || '';
                    } catch (e) {
                        break;
                    }
                    if (page === 1) {
                        firstDom = dom;
                        firstSource = source;
                        folderName = getFolderName(dom, source);
                    }
                    const before = seen.size;
                    const entries = parsePage(dom, source);
                    for (const it of entries) {
                        const slug = String(it.slug || '').trim();
                        if (!slug || seen.has(slug)) continue;
                        seen.add(slug);
                        addHint(slug, String(it.name || '').trim(), Number(it.size || 0) || 0);
                        resolved.push(`${origin}/d/${slug}`);
                    }
                    if (seen.size - before <= 0) break;
                }
                if (!folderName) folderName = albumId;
                if (!resolved.length) return url;
                return { dom: firstDom, source: firstSource, folderName, resolved };
            } catch (e) {
                return url;
            }
        },
    ],
    [
        [/filester\.(me|sh|si|gg)\/d\//],
        async (url, http, spoilers, postId, postSettings, progressCB) => {
            const slug = (() => {
                try {
                    const u = new URL(url);
                    const parts = String(u.pathname || '').split('/').filter(Boolean);
                    return parts.length ? parts[parts.length - 1] : '';
                } catch (e) {
                    const m = /filester\.(me|sh|si|gg)\/d\/([^\/?#]+)/i.exec(String(url || ''));
                    return m && m[2] ? m[2] : '';
                }
            })();
            if (!slug) return null;
            const apiBase = 'https://filester.me';
            const mkHeaders = () => ({
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json;charset=UTF-8',
                Origin: apiBase,
                Referer: url,
                __xfpd_withCredentials: true,
            });
            const safeJson = (txt) => {
                try { return JSON.parse(String(txt || '')); } catch (e) { return null; }
            };
            const walk = (obj, cb, maxNodes = 5000) => {
                const seen = new Set();
                const q = [obj];
                let nodes = 0;
                while (q.length && nodes++ < maxNodes) {
                    const cur = q.shift();
                    if (!cur || typeof cur !== 'object') continue;
                    if (seen.has(cur)) continue;
                    seen.add(cur);
                    try { if (cb(cur) === true) return true; } catch (e) {}
                    if (Array.isArray(cur)) {
                        for (const it of cur) q.push(it);
                    } else {
                        for (const k of Object.keys(cur)) q.push(cur[k]);
                    }
                }
                return false;
            };
            const deepFindValueByKeys = (obj, keys) => {
                const keySet = new Set((keys || []).map(k => String(k).toLowerCase()));
                let out = null;
                walk(obj, (o) => {
                    if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
                    for (const k of Object.keys(o)) {
                        if (keySet.has(String(k).toLowerCase())) {
                            const v = o[k];
                            if (v !== null && v !== undefined) {
                                out = v;
                                return true;
                            }
                        }
                    }
                    return false;
                });
                return out;
            };
            const normalizeUrl = (s) => {
                if (!s || typeof s !== 'string') return null;
                const t = s.trim();
                if (/^https?:\/\//i.test(t)) return t;
                if (t.startsWith('/')) {
                    try { return new URL(t, apiBase).href; } catch (e) { return null; }
                }
                return null;
            };
            const pickBestUrl = (obj) => {
                const candidates = [];
                const push = (v) => { const u = normalizeUrl(v); if (u) candidates.push(u); };
                const prefer = deepFindValueByKeys(obj, ['download_url', 'downloadUrl', 'url', 'link', 'href', 'direct', 'download', 'view_url', 'viewUrl']);
                if (prefer) push(prefer);
                walk(obj, (o) => {
                    for (const k of Object.keys(o || {})) {
                        const v = o[k];
                        if (typeof v === 'string') push(v);
                    }
                    return false;
                });
                const clean = candidates.filter(s => !/filester\.(me|sh|si|gg)\/api\//i.test(s));
                if (!clean.length) return null;
                const score = (s) => {
                    let sc = 0;
                    if (/https?:\/\/cache\d+\.filester\.(me|sh|si|gg)\/v\//i.test(s)) sc += 200;
                    if (/\/v\//i.test(s)) sc += 80;
                    if (/\/d\//i.test(s)) sc -= 25;
                    return sc;
                };
                clean.sort((a, b) => score(b) - score(a));
                return clean[0];
            };
            const pickName = (obj) => {
                const v = deepFindValueByKeys(obj, ['filename', 'file_name', 'name', 'original_name', 'originalName', 'title']);
                return (typeof v === 'string' && v.trim()) ? v.trim() : null;
            };
            const pickSize = (obj) => {
                const n = Number(deepFindValueByKeys(obj, ['size', 'bytes', 'file_size', 'fileSize', 'length']));
                return Number.isFinite(n) ? n : 0;
            };
            let nameHint = null;
            let sizeHint = 0;
            let relViewPath = null;
            let streamUrlImmediate = null;
            try {
                if (progressCB) progressCB('[Filester] Fetching metadata...');
                const viewRes = await http.base('POST', `${apiBase}/api/public/view`, {}, mkHeaders(), JSON.stringify({ file_slug: slug }), 'text');
                const viewJson = safeJson(viewRes && viewRes.source);
                if (viewJson) {
                    nameHint = pickName(viewJson) || nameHint;
                    sizeHint = pickSize(viewJson) || sizeHint;
                    const relView = deepFindValueByKeys(viewJson, ['view_url', 'viewUrl', 'view']);
                    if (typeof relView === 'string' && relView.trim()) {
                        const s = String(relView).trim();
                        if (s.startsWith('/v/')) relViewPath = s;
                        else if (/^https?:\/\//i.test(s)) {
                            try {
                                const u0 = new URL(s);
                                if (/^\/v\//i.test(String(u0.pathname || ''))) relViewPath = String(u0.pathname || '') + String(u0.search || '');
                                if (/cache6\.filester\./i.test(s)) streamUrlImmediate = s;
                            } catch (e) {}
                        }
                    }
                }
            } catch (e) {}
            try {
                if (!nameHint || (!relViewPath && !streamUrlImmediate)) {
                    const htmlRes0 = await http.base('GET', `${apiBase}/d/${slug}`, {}, { Accept: 'text/html,application/xhtml+xml', __xfpd_withCredentials: true }, {}, 'text');
                    const html0 = String((htmlRes0 && htmlRes0.source) || '');
                    const mName = /window\.fileName\s*=\s*("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/m.exec(html0);
                    if (mName) {
                        try { nameHint = JSON.parse(mName[1].startsWith('"') ? mName[1] : `"${mName[1].slice(1,-1)}"`); } catch (e) {}
                    }
                    const fu0 = String((htmlRes0 && htmlRes0.finalUrl) || '');
                    if (fu0 && /\/v\//i.test(fu0)) {
                        if (/cache6\.filester\./i.test(fu0)) streamUrlImmediate = fu0;
                        try {
                            const u1 = new URL(fu0);
                            if (/^\/v\//i.test(String(u1.pathname || ''))) relViewPath = String(u1.pathname || '') + String(u1.search || '');
                        } catch (e) {}
                    }
                    const mFull = /(https?:\/\/cache\d+\.filester\.(me|sh|si|gg)\/v\/[^\s"'<>]+)/i.exec(html0);
                    if (mFull && mFull[1] && !streamUrlImmediate) streamUrlImmediate = mFull[1];
                    const mRel = /["'](\/v\/[^"'<>\s]+)["']/i.exec(html0);
                    if (mRel && mRel[1] && !relViewPath) relViewPath = mRel[1];
                }
            } catch (e) {}
            try {
                if (!streamUrlImmediate && !relViewPath) {
                    if (progressCB) progressCB('[Filester] Resolving download token...');
                    const dlRes0 = await http.base('POST', `${apiBase}/api/public/download`, {}, mkHeaders(), JSON.stringify({ file_slug: slug }), 'text');
                    const dlJson0 = safeJson(dlRes0 && dlRes0.source);
                    let tokenUrl = null;
                    const rel = dlJson0 ? deepFindValueByKeys(dlJson0, ['download_url', 'downloadUrl', 'url']) : null;
                    if (typeof rel === 'string' && rel.trim()) tokenUrl = normalizeUrl(rel);
                    if (tokenUrl) {
                        let tokenStr = '';
                        const tk = dlJson0 ? deepFindValueByKeys(dlJson0, ['token']) : null;
                        if (typeof tk === 'string') tokenStr = String(tk).trim();
                        if (!tokenStr) {
                            const mTok = /\/d\/([^\/\?#]+)/i.exec(String(tokenUrl || ''));
                            if (mTok && mTok[1]) tokenStr = String(mTok[1]).trim();
                        }
                        if (tokenStr && !relViewPath) relViewPath = `/v/${tokenStr.replace(/^\/?[dv]\//i, '')}`;
                    }
                }
            } catch (e) {}
            if (streamUrlImmediate) {
                try {
                    filesterSlugByUrl.set(String(streamUrlImmediate), String(slug));
                    filesterRefByUrl.set(String(streamUrlImmediate), `${apiBase}/d/${slug}`);
                    if (nameHint) {
                        filesterNameBySlug.set(String(slug), String(nameHint));
                        filesterNameByUrl.set(String(streamUrlImmediate), String(nameHint));
                    }
                } catch (e) {}
                return streamUrlImmediate;
            }
            if (relViewPath && /^\/v\//i.test(String(relViewPath))) {
                const streamUrl = `https://cache6.filester.me${relViewPath}`;
                try {
                    filesterSlugByUrl.set(String(streamUrl), String(slug));
                    filesterRefByUrl.set(String(streamUrl), `${apiBase}${relViewPath}`);
                    if (nameHint) {
                        filesterNameBySlug.set(String(slug), String(nameHint));
                        filesterNameByUrl.set(String(streamUrl), String(nameHint));
                    }
                    if (sizeHint) {
                        filesterSizeBySlug.set(String(slug), Number(sizeHint));
                        filesterSizeByUrl.set(String(streamUrl), Number(sizeHint));
                    }
                } catch (e) {}
                return streamUrl;
            }
            try {
                if (progressCB) progressCB('[Filester] Resolving download URL...');
                const dlRes = await http.base('POST', `${apiBase}/api/public/download`, {}, mkHeaders(), JSON.stringify({ file_slug: slug }), 'text');
                const dlJson = safeJson(dlRes && dlRes.source);
                let dlUrl = dlJson ? pickBestUrl(dlJson) : null;
                if (dlUrl) {
                    filesterSlugByUrl.set(String(dlUrl), String(slug));
                    if (nameHint) {
                        filesterNameBySlug.set(String(slug), String(nameHint));
                        filesterNameByUrl.set(String(dlUrl), String(nameHint));
                    }
                    return dlUrl;
                }
            } catch (e) {}
            return null;
        },
    ],
    [
        [/m\.box\.com\//],
        async (url, http) => {
            const { source, dom } = await http.get(url);
            const files = [...dom.querySelectorAll('.files-item-anchor')].map(el => `https://m.box.com${el.getAttribute('href')}`);
            const resolved = [];
            for (const fileUrl of files) {
                const { source, dom } = await http.get(fileUrl);
                if (h.contains('image-preview', source)) {
                    resolved.push(dom.querySelector('.image-preview').getAttribute('src'));
                } else {
                    resolved.push(dom.querySelector('.mtl > a').getAttribute('href'));
                }
            }
            return {
                source,
                dom,
                folderName: dom.querySelector('.folder-nav-title')?.innerText.trim(),
                resolved: resolved.map(u => `https://m.box.com${u}`),
            };
        },
    ],
    [
        [/twimg.com\//],
        url => url.replace(/https?:\/\/pbs.twimg\.com\/media\/(.{1,15})(\?format=)?(.*)&amp;name=(.*)/, 'https://pbs.twimg.com/media/$1.$3'),
    ],
    [
        [/(disk\.)?yandex\.[a-z]+/],
        async (url, http) => {
            const { dom } = await http.get(url);
            const script = dom.querySelector('script[id="store-prefetch"]');
            if (!script) return null;
            const json = JSON.parse(script.innerText);
            let sk, hash = null;
            if (json && json.environment && json.resources) {
                sk = json.environment.sk;
                const resourcesKeys = Object.keys(json.resources);
                hash = json.resources[resourcesKeys[0]]?.hash;
            }
            const data = JSON.stringify({ hash, sk });
            const { source } = await http.post('https://disk.yandex.ru/public/api/download-url', data, {}, { 'Content-Type': 'text/plain' });
            const response = JSON.parse(source);
            if (response && response.error !== 'true' && response.data) {
                return response.data.url;
            }
            return null;
        },
    ],
    [[/(\w+)?.redd.it/], url => url.replace(/&amp;/g, '&')],
];

const setProcessing = (isProcessing, postId) => {
    const p = processing.find(p => p.postId === postId);
    if (p) {
        p.processing = isProcessing;
    } else {
        processing.push({ postId, processing: isProcessing });
    }
};

const downloadPost = async (parsedPost, parsedHosts, enabledHostsCB, resolvers, getSettingsCB, statusUI, callbacks = {}) => {
    const { postId, postNumber } = parsedPost;
    const postSettings = getSettingsCB();
    const enabledHosts = enabledHostsCB(parsedHosts);
    const globalProgressTaskId = `${postId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const estimatedDownloadTotal = enabledHosts.reduce((total, host) => total + host.resources.length, 0);
    const globalProgressStarted = !postSettings.skipDownload && estimatedDownloadTotal > 0;
    if (globalProgressStarted) xfpdGlobalProgress.begin(globalProgressTaskId, estimatedDownloadTotal);

    window.logs = window.logs.filter(l => l.postId !== postId);

    log.separator(postId);
    log.post.info(postId, `::Using ${enabledHosts.length} host(s)::: ${enabledHosts.map(h => h.name).join(', ')}`, postNumber);
    log.separator(postId);
    log.post.info(postId, `::Preparing download::`, postNumber);

    let completed = 0;
    const zip = new JSZip();
    let zipFileCount = 0;
    let resolved = [];

    const statusLabel = statusUI.status;
    const filePB = statusUI.filePB;
    const totalPB = statusUI.totalPB;
    const wrap = statusUI.wrap;
    const split = statusUI.split;

    h.ui.setElProps(statusLabel, { color: '#469cf3', marginBottom: '3px', fontSize: '12px' });
    h.ui.setElProps(filePB, { width: '0%' });
    h.ui.setElProps(totalPB, { width: '0%' });
    if (wrap) h.show(wrap);
    if (split) split.classList.add('is-busy');
    h.show(statusLabel);
    h.show(filePB);
    h.show(totalPB);
    h.ui.setText(statusLabel, 'Resolving...');

    try {
        const cc = parsedPost && parsedPost.contentContainer;
        if (cc && cc.querySelectorAll) {
            const strip = (s) => String(s || '').split('#')[0].split('?')[0];
            const normUrl = (u) => {
                u = String(u || '').replace(/&amp;/g, '&').trim();
                u = u.split(/[\s"'<>]/)[0].trim();
                if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
                if (u.endsWith('/')) u = u.slice(0, -1);
                return u;
            };
            const extractName = (t) => {
                let s = String(t || '').replace(/\s+/g, ' ').trim();
                if (!s) return '';
                if (/^https?:\/\//i.test(s)) return '';
                if (/\.[A-Za-z0-9]{1,8}$/.test(s) && s.length <= 200) return s;
                const m = s.match(/[^\\/:*?"<>|\s]+\.[A-Za-z0-9]{1,8}/g);
                if (m && m.length) {
                    const cand = m[m.length - 1];
                    if (cand && cand.length <= 200) return cand;
                }
                return '';
            };
            cc.querySelectorAll('a[href]').forEach(a => {
                const href0 = normUrl(a.getAttribute('href'));
                if (!href0) return;
                if (!/bunkrr?r?\./i.test(href0)) return;
                if (/scdn\.st\//i.test(href0)) return;
                const nm = extractName(a.textContent || '');
                if (!nm || xfpdLooksLikeCfFilenameHint(nm)) return;
                bunkrNameByUrl.set(href0, nm);
                bunkrNameByUrl.set(strip(href0), nm);
            });
            cc.querySelectorAll('a[href*="goonbox.cr/img/"]').forEach(a => {
                const href0 = strip(normUrl(a.getAttribute('href')));
                if (!href0) return;
                const img = a.querySelector('img');
                const thumbUrl = img && (img.getAttribute('data-url') || img.getAttribute('src'));
                if (!thumbUrl) return;
                goonboxThumbByUrl.set(href0, thumbUrl);
            });
        }
    } catch (e) {}

    log.post.info(postId, '::Url resolution started::', postNumber);

    const totalResourcesToResolve = enabledHosts.reduce((acc, host) => acc + host.resources.length, 0);
    let resolvingIndex = 0;

    for (const host of enabledHosts.filter(host => host.resources.length)) {
        const resources = host.resources;
        for (const resource of resources) {
            resolvingIndex++;
            h.ui.setElProps(statusLabel, { color: '#469cf3', fontWeight: 'bold' });
            h.ui.setText(statusLabel, `Resolving: ${resolvingIndex} / ${totalResourcesToResolve}  •  ${h.limit(resource, 80)}`);

            for (const resolver of resolvers) {
                const patterns = resolver[0];
                const resolverCB = resolver[1];
                let matched = true;
                for (const pattern of patterns) {
                    let strPattern = pattern.toString();
                    let shouldMatch = !h.contains(':!', strPattern);
                    strPattern = strPattern.replace(':!', '');
                    strPattern = h.re.toRegExp(h.re.toString(strPattern), 'is');
                    if (shouldMatch && !strPattern.test(resource)) {
                        matched = false;
                        break;
                    } else if (!shouldMatch && strPattern.test(resource)) {
                        matched = false;
                        break;
                    }
                }
                if (!matched) continue;

                const passwords = parsedPost.spoilers.concat(parsedPost.spoilers.map(s => s.toLowerCase()));
                let r = null;
                try {
                    const progressCB = (t) => {
                        try {
                            h.ui.setElProps(statusLabel, { color: '#469cf3', fontWeight: 'bold' });
                            h.ui.setText(statusLabel, t);
                        } catch (e) {}
                    };
                    r = await h.promise(resolve => resolve(resolverCB(resource, h.http, passwords, postId, postSettings, progressCB)));
                } catch (e) {
                    if (host.name === 'Cyberdrop' && /cyberdrop\.[a-z]{2,}\/a\//i.test(String(resource))) {
                        continue;
                    }
                    log.post.error(postId, `::Error resolving::: ${resource}`, postNumber);
                    continue;
                }
                if (h.isNullOrUndef(r)) {
                    log.post.error(postId, `::Could not resolve::: ${resource}`, postNumber);
                    continue;
                }
                h.ui.setElProps(statusLabel, { color: '#47ba24', fontWeight: 'bold' });
                h.ui.setText(statusLabel, `Resolved: ${resolved.length}`);
                const addResolved = (url, folderName) => {
                    if (!resolved.length) log.separator(postId);
                    if (h.isObject(url)) {
                        resolved.push({ url: url.url, host, original: resource, folderName: url.folderName, forceUnzipped: false, forceDirect: false });
                        log.post.info(postId, `::Resolved::: ${url.url}`, postNumber);
                    } else {
                        resolved.push({ url, host, original: resource, folderName, forceUnzipped: false, forceDirect: false });
                        log.post.info(postId, `::Resolved::: ${url}`, postNumber);
                    }
                };
                if (h.isArray(r.resolved)) {
                    r.resolved.forEach(url => {
                        try { addResolved(url, r.folderName); } catch (e) {}
                    });
                } else {
                    addResolved(r, null);
                }
            }
        }
    }

    if (resolved.length) log.separator(postId);
    log.post.info(postId, '::Url resolution completed::', postNumber);

    const mediaFilter = postSettings._xfpdMediaFilter;
    if (mediaFilter === 'image' || mediaFilter === 'video') {
        const beforeMediaFilter = resolved.length;
        resolved = resolved.filter(resource => xfpdMediaKindForResolved(resource) === mediaFilter);
        log.post.info(
            postId,
            `::Page ${mediaFilter} filter kept ${resolved.length} of ${beforeMediaFilter} resolved file(s)::`,
            postNumber,
        );
    }

    let totalDownloadable = resolved.filter(r => r.url).length;
    const totalResources = enabledHosts.reduce((acc, hst) => hst.resources.length + acc, 0);
    h.ui.setElProps(statusLabel, { color: '#47ba24', fontWeight: 'bold' });
    h.ui.setText(statusLabel, `Resolved: ${resolved.length} / ${totalDownloadable}  •  ${totalResources} total links`);

    const filenames = [];
    const mimeTypes = [];

    const sanitizeWinSegment = (seg, fallback = 'file') => {
        let s = String(seg ?? '').trim();
        if (settings?.naming?.allowEmojis === false) {
            try { s = s.replace(/\p{Extended_Pictographic}/gu, ''); } catch (e) {
                s = s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
            }
            s = s.replace(/[\uFE0E\uFE0F\u200D]/g, '');
        }
        const sub = (settings?.naming?.invalidCharSubstitute ?? '-');
        s = s.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[<>:"/\\|?*]/g, sub).replace(/\s+/g, ' ').trim().replace(/[. ]+$/g, '');
        if (!s) s = String(fallback || 'file');
        if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(s)) s = `_${s}`;
        if (s.length > 180) s = s.slice(0, 180).trim();
        return s;
    };
    const sanitizeWinPath = (p) => String(p ?? '').split('/').map(x => sanitizeWinSegment(x, '')).filter(Boolean).join('/');
    const usedPaths = new Set();
    const ensureUniquePath = path => {
        let p = String(path || '').trim() || 'file';
        if (!usedPaths.has(p)) { usedPaths.add(p); return p; }
        const parts = p.split('/');
        const base = parts.pop();
        const dir = parts.length ? parts.join('/') : '';
        const ext = h.ext(base);
        const stem = ext ? h.fnNoExt(base) : base;
        let i = 2;
        while (true) {
            const candidateBase = ext ? `${stem} (${i}).${ext}` : `${stem} (${i})`;
            const candidate = dir ? `${dir}/${candidateBase}` : candidateBase;
            if (!usedPaths.has(candidate)) { usedPaths.add(candidate); return candidate; }
            i++;
        }
    };
    const usedFlatNames = new Set();
    const ensureUniqueFlatName = name => {
        let n = String(name || '').trim() || 'file';
        if (!usedFlatNames.has(n)) { usedFlatNames.add(n); return n; }
        const ext = h.ext(n);
        const stem = ext ? h.fnNoExt(n) : n;
        let i = 2;
        while (true) {
            const candidate = ext ? `${stem} (${i}).${ext}` : `${stem} (${i})`;
            if (!usedFlatNames.has(candidate)) { usedFlatNames.add(candidate); return candidate; }
            i++;
        }
    };

    setProcessing(true, postId);
    log.separator(postId);
    log.post.info(postId, `::Found ${totalDownloadable} resource(s)::`, postNumber);
    log.separator(postId);

    const threadTitle = parsers.thread.parseTitle();
    const performerFolderName = postSettings.createPerformerFolder
        ? sanitizeWinSegment(parsers.thread.parsePerformerName(), 'Performer')
        : '';
    const downloadRootFolder = performerFolderName || sanitizeWinSegment(threadTitle);
    let performerDirectoryHandle = null;
    if (
        performerFolderName &&
        postSettings._xfpdFolderMode === 'native' &&
        postSettings._xfpdPerformerDirectoryHandle
    ) {
        performerDirectoryHandle = postSettings._xfpdPerformerDirectoryHandle;
    }
    const portablePerformerArchive = !!(performerFolderName && !performerDirectoryHandle);
    const effectiveZipped = !!(postSettings.zipped || portablePerformerArchive);
    const archivePath = path => {
        const cleanPath = sanitizeWinPath(path);
        return portablePerformerArchive ? sanitizeWinPath(`${performerFolderName}/${cleanPath}`) : cleanPath;
    };

    let customFilename = postSettings.output.find(o => o.postId === postId)?.value;
    if (customFilename) {
        customFilename = customFilename.replace(/:title:/g, threadTitle).replace(/:#:/g, postNumber).replace(/:id:/g, postId);
    }

    if (postSettings.skipDuplicates) {
        const unique = [];
        for (const r of resolved.filter(r => r.url).sort((a, b) => (a.host.type !== 'folder' || b.host.type !== 'folder' ? -1 : 1))) {
            const filename = h.basename(r.url);
            if (unique.find(u => u.filename.toLowerCase() === filename.toLowerCase())) {
                log.post.info(postId, `::Skipped duplicate::: ${filename} ::from:: ${r.url}`, postNumber);
                continue;
            }
            unique.push({ ...r, filename });
        }
        if (unique.length !== resolved.length) {
            h.ui.setText(statusLabel, `Removed ${resolved.length - unique.length} duplicates...`);
            unique.forEach(u => delete u.filename);
            resolved = unique;
            totalDownloadable = resolved.length;
        }
    }

    const isFF = window.isFF;
    if (globalProgressStarted) xfpdGlobalProgress.setTotal(globalProgressTaskId, totalDownloadable);

    if (!postSettings.skipDownload) {
        const resources = resolved.filter(r => r.url);
        totalDownloadable = resources.length;
        let batchLength = resolved.some(file => /(turbocdn\.st|turbo\.cr|turbovid\.cr)/i.test(file.url)) ? 1 : (resolved.some(file => /(bunkrr?\.\w+)|(bunkr-cache)/.test(file.url)) ? 1 : 2);
        let currentBatch = 0;
        const batches = [];
        const isGoFileUrlBatch = u => /gofile\.io/i.test(String(u || ''));
        let tmp = [];
        let tmpHasGoFile = false;
        for (const item of resources) {
            const isGF = isGoFileUrlBatch(item.url);
            if (tmp.length >= batchLength || (tmpHasGoFile && isGF)) {
                batches.push(tmp);
                tmp = [];
                tmpHasGoFile = false;
            }
            tmp.push(item);
            if (isGF) tmpHasGoFile = true;
        }
        if (tmp.length) batches.push(tmp);
        const getNextBatch = () => {
            const batch = currentBatch < batches.length ? batches[currentBatch] : [];
            currentBatch++;
            return batch;
        };
        const requestProgress = [];
        const requests = [];
        let completedBatchedDownloads = 0;
        let cyberdropDirectWarmupDone = false;
        let batch = getNextBatch();

        const headerValue = (headers, name) => {
            try {
                const re = new RegExp(`^${name}:\\s*([^\\r\\n]+)`, 'im');
                const m = re.exec(headers || '');
                return m && m[1] ? String(m[1]).trim() : '';
            } catch (e) { return ''; }
        };
        const parseDispositionFilename = headers => {
            const hRaw = headers || '';
            let m = /filename\*\s*=\s*UTF-8''([^;\r\n]+)/i.exec(hRaw);
            if (m && m[1]) {
                const raw = String(m[1]).trim().replace(/^"|"$/g, '');
                try { return decodeURIComponent(raw); } catch (e) { return raw; }
            }
            m = /filename\s*=\s*"([^"\r\n]+)"/i.exec(hRaw) || /filename\s*=\s*([^;\r\n]+)/i.exec(hRaw);
            if (m && m[1]) return String(m[1]).trim().replace(/^"|"$/g, '');
            return '';
        };

        while (batch.length) {
            const GOFILE_WARMUP_MS = 3000;
            const TURBO_STALL_MS = 5000;
            const TURBO_RESIGN_RETRIES = 3;
            const TURBO_DIRECT_FALLBACKS = 1;
            const TURBO_RETRY_DELAY_MS = 600;
            const TURBO_DIRECT_DELAY_MS = 800;
            const turboRetryState = new Map();
            const isTurboUrl = u => /turbocdn\.st|turbo\.cr|turbovid\.cr/i.test(String(u || ''));
            const turboExtractId = u => {
                const s = String(u || '');
                const m = s.match(/\/\/(?:[\w-]+\.)?turbo\.cr\/(?:v|d|embed)\/([^\/?#]+)/i) || s.match(/\/\/(?:[\w-]+\.)?turbovid\.cr\/(?:v|d|embed)\/([^\/?#]+)/i);
                return (m && m[1]) ? m[1] : '';
            };
            const turboExtractFn = u => {
                const s = String(u || '');
                const m = s.match(/[?&]fn=([^&]+)/i);
                if (m && m[1]) {
                    try { return decodeURIComponent(m[1].replace(/\+/g, '%20')); } catch (e) { return m[1]; }
                }
                return '';
            };
            const turboResignSignedUrl = async (turboId, currentUrl) => {
                if (!turboId) return null;
                const embedUrl = `https://turbo.cr/embed/${turboId}`;
                const keepFn = turboExtractFn(currentUrl) || '';
                try {
                    const j = await xfpdTurboFetchSignJsonWithTimeout(turboId, embedUrl);
                    if (j && j.url) {
                        let signed = j.url;
                        const name = (j.original_filename || keepFn || '').toString();
                        if (signed && name && !/[?&]fn=/i.test(String(signed))) {
                            const enc = encodeURIComponent(String(name)).replace(/%20/g, '+');
                            signed += (signed.includes('?') ? '&' : '?') + 'fn=' + enc;
                        }
                        try { turboIdBySignedUrl.set(String(signed), String(turboId)); } catch (e) {}
                        return signed;
                    }
                } catch (e) {}
                return null;
            };
            const isGoFileUrl = u => /gofile\.io/i.test(String(u || ''));
            const isPixeldrainUrl = u => /(?:pixeldrain\.com|pixeldrain\.net|pixeldra\.in)/i.test(String(u || ''));
            const isImagebamCdnUrl = u => /https?:\/\/(?:images|thumbs)\d+\.imagebam\.com\//i.test(String(u || ''));
            const imagebamRefererForCdn = u => {
                try {
                    const uu = new URL(String(u || ''), location.origin);
                    const base = (uu.pathname || '').split('/').pop() || '';
                    const id = base.replace(/\.[a-z0-9]+$/i, '');
                    return id ? `https://www.imagebam.com/view/${id}` : 'https://www.imagebam.com/';
                } catch (e) {
                    return 'https://www.imagebam.com/';
                }
            };
            const gofileWarmupAttempted = new Set();
            const gofileActivePass = new Map();
            const CYBERDROP_WARMUP_MS = 1500;
            const BLOB_MAX_BYTES = Math.floor(1.6 * 1024 * 1024 * 1024);
            const BUNKR_DIRECT_MIN_BYTES = 500 * 1024 * 1024;
            const gofileWarmupOpenTab = warmUrl => {
                try {
                    const tab = GM_openInTab(warmUrl, { active: false, insert: true, setParent: true });
                    setTimeout(() => { try { xfpdCloseTabHandle(tab); } catch (e) {} }, GOFILE_WARMUP_MS);
                } catch (e) {}
            };

            const startDownload = async (resource, pass = 1) => {
                let { url, host, original, folderName } = resource;
                const zippedForThis = !!(effectiveZipped && !(resource && (resource.forceDirect || resource.forceUnzipped)));
                const isGoFile = isGoFileUrl(url);
                const isPixeldrain = isPixeldrainUrl(url);
                const isTurbo = isTurboUrl(url);
                const isCyberdrop = String(host || '').toLowerCase() === 'cyberdrop';
                const isBunkr = String((host && host.name) || '').toLowerCase() === 'bunkr' || /bunkr/i.test(String(url || '')) || /bunkr/i.test(String(original || ''));
                const isFilester = String((host && host.name) || '').toLowerCase() === 'filester' || /(?:^|\.)filester\.(me|sh|si|gg)/i.test(String(url || ''));

                if (isGoFile) {
                    try {
                        const gfToken = settings?.hosts?.goFile?.token;
                        if (gfToken) await gofileSyncCookie(gfToken);
                    } catch (e) {}
                }

                const turboId = isTurbo ? (turboIdBySignedUrl.get(String(url)) || turboExtractId(original) || turboExtractId(url) || '') : '';
                const turboKey = isTurbo ? (turboId ? `turbo:${turboId}` : `turbo-url:${url}`) : '';
                let cyberOrigin = '';
                let cyberSlug = '';
                let cyberFilePage = '';
                const progressKey = isGoFile ? `${url}@@gofilepass${pass}` : url;
                h.ui.setElProps(statusLabel, { fontWeight: 'normal' });

                var reflink = original;
                if (url.includes('bunkr')) reflink = 'https://bunkr.si';
                if (url.includes('pomf2')) reflink = 'https://pomf2.lain.la';
                if (url.includes('turbocdn.st')) reflink = 'https://turbo.cr/';
                if (/(?:\bfilester\.(me|sh|si|gg)\b|cache\d+\.filester\.(me|sh|si|gg))/i.test(String(url || ''))) reflink = 'https://filester.me/';
                if (isCyberdrop) {
                    try {
                        const o = new URL(/^https?:\/\//i.test(String(original || '')) ? String(original) : `https://${String(original)}`);
                        cyberOrigin = o.origin;
                        const m1 = /\/[ef]\/([^\/?#]+)/i.exec(String(original || ''));
                        const m2 = /\/api\/file\/(?:d|info|auth)\/([^\/?#]+)/i.exec(String(original || ''));
                        const m3 = /\/api\/file\/d\/([^\/?#]+)/i.exec(String(url || ''));
                        cyberSlug = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]) || '';
                        if (cyberSlug) cyberFilePage = `${cyberOrigin}/f/${cyberSlug}`;
                        reflink = `${cyberOrigin}/`;
                    } catch (e) {}
                }

                const ellipsedUrl = h.limit(url, 80);
                log.post.info(postId, `::Downloading${isGoFile && pass > 1 ? ' (retry)' : ''}::: ${url}`, postNumber);

                if (isCyberdrop && pass === 1 && cyberOrigin && cyberFilePage && /gigachad-cdn\.ru|cuckcapital\.cr/i.test(String(url || '')) && !cyberdropDirectWarmupDone) {
                    cyberdropDirectWarmupDone = true;
                    log.post.info(postId, `::Cyberdrop warm-up -> open tab (${CYBERDROP_WARMUP_MS}ms) then continue::: ${cyberFilePage}`, postNumber);
                    await cyberdropWarmupOnce(cyberOrigin, cyberFilePage, CYBERDROP_WARMUP_MS);
                }

                let switchedToDirect = false;
                const markDone = (ok) => {
                    completed++;
                    completedBatchedDownloads++;
                    if (globalProgressStarted) xfpdGlobalProgress.complete(globalProgressTaskId, progressKey, ok);
                    h.ui.setText(statusLabel, `${completed} / ${totalDownloadable}  •  ${ellipsedUrl}`);
                    h.ui.setElProps(statusLabel, { color: ok ? '#2d9053' : '#b23b3b' });
                    h.ui.setElProps(totalPB, { width: `${(completed / Math.max(1, totalDownloadable)) * 100}%` });
                };

                const guessBasename = () => {
                    let basename = '';
                    try {
                        if (isBunkr) {
                            const strip = (u) => String(u || '').split('#')[0].split('?')[0];
                            basename = bunkrNameByUrl.get(String(url)) || bunkrNameByUrl.get(strip(url)) || bunkrNameByUrl.get(String(original || '')) || '';
                        }
                        if (!basename && isFilester) {
                            const slug0 = String(filesterSlugByUrl.get(String(url)) || '');
                            basename = filesterNameByUrl.get(String(url)) || (slug0 ? filesterNameBySlug.get(slug0) : '') || '';
                        }
                        if (!basename && isGoFile) {
                            const mGf = String(url).match(/\/download\/(?:web|direct)\/([^\/?#]+)\//i);
                            const gid = mGf && mGf[1] ? mGf[1] : null;
                            if (gid) basename = gofileNameById.get(String(gid)) || gofileNameByUrl.get(String(url)) || '';
                        }
                        if (!basename && isTurbo) basename = turboExtractFn(url) || '';
                        if (!basename) basename = h.basename(url).replace(/\?.*/, '').replace(/#.*/, '');
                    } catch (e) {
                        basename = h.basename(url);
                    }
                    basename = sanitizeWinSegment(String(basename || 'file'));
                    return basename;
                };

                const startDirectDownload = async (metaHint = null) => {
                    switchedToDirect = true;
                    try {
                        if (isGoFile && pass === 1 && !gofileWarmupAttempted.has(url)) {
                            gofileWarmupAttempted.add(url);
                            log.post.info(postId, `::GoFile warm-up -> open tab (${GOFILE_WARMUP_MS}ms) then retry [1/2]::: ${url}`, postNumber);
                            gofileWarmupOpenTab(url);
                            setTimeout(() => startDownload(resource, 2), GOFILE_WARMUP_MS);
                            return;
                        }
                        let basename = guessBasename();
                        let fn = basename;
                        if (!postSettings.flatten && folderName && folderName.trim() !== '') fn = `${folderName}/${basename}`;
                        fn = sanitizeWinPath(fn);
                        fn = ensureUniquePath(fn);
                        basename = h.basename(fn);
                        const title = sanitizeWinSegment(threadTitle);
                        const saveAsFF = `${title} #${postNumber} - ${ensureUniqueFlatName(fn.replace(/\//g, ' - '))}`;
                        const saveAsPath = `${downloadRootFolder}/${fn}`;
                        const saveAsName = (isFF && !postSettings.createPerformerFolder) ? saveAsFF : saveAsPath;
                        const imagebamHeaders = isImagebamCdnUrl(url) ? { Referer: imagebamRefererForCdn(url) } : null;
                        const dlOpts = {
                            url,
                            name: saveAsName,
                            onprogress: e => {
                                const loadedMB = Number((e.loaded || 0) / 1024 / 1024).toFixed(2);
                                const totalBytes = (e.total && e.total > 0) ? e.total : (Number(metaHint?.size || 0) || 0);
                                if (globalProgressStarted) {
                                    xfpdGlobalProgress.update(globalProgressTaskId, progressKey, e.loaded || 0, totalBytes);
                                }
                                const totalMB = totalBytes ? Number(totalBytes / 1024 / 1024).toFixed(2) : '??';
                                if (!totalBytes) {
                                    h.ui.setElProps(filePB, { width: '0%' });
                                    h.ui.setText(statusLabel, `${completed} / ${totalDownloadable}  •  ${host.name}  •  DIRECT  •  ${loadedMB} MB  •  ${ellipsedUrl}`);
                                } else {
                                    h.ui.setText(statusLabel, `${completed} / ${totalDownloadable}  •  ${host.name}  •  DIRECT  •  ${loadedMB} / ${totalMB} MB  •  ${ellipsedUrl}`);
                                    h.ui.setElProps(filePB, { width: `${(e.loaded / totalBytes) * 100}%` });
                                }
                            },
                            onload: () => markDone(true),
                            onerror: err => { log.post.error(postId, `::DIRECT download failed::: ${url}`, postNumber); console.log(err); markDone(false); },
                            ontimeout: err => { log.post.error(postId, `::DIRECT download timed out::: ${url}`, postNumber); console.log(err); markDone(false); },
                        };
                        if (imagebamHeaders) dlOpts.headers = imagebamHeaders;
                        GM_download(dlOpts);
                    } catch (e) {
                        log.post.error(postId, `::DIRECT download error::: ${url}`, postNumber);
                        markDone(false);
                    }
                };

                if (resource && resource.forceDirect) {
                    setTimeout(() => startDirectDownload(), TURBO_DIRECT_DELAY_MS);
                    return;
                }

                const isTurboCdn = /turbocdn\.st/i.test(String(url || ''));
                const filesterRef = isFilester ? String(filesterRefByUrl.get(String(url)) || original || 'https://filester.me/') : '';
                const reqHeaders = isTurboCdn ? { Referer: 'https://turbo.cr/' } : (isFilester ? { Referer: filesterRef } : { Referer: reflink });

                const request = GM_xmlhttpRequest({
                    url,
                    headers: reqHeaders,
                    responseType: 'blob',
                    anonymous: false,
                    ...(isFilester ? { withCredentials: true } : {}),
                    onreadystatechange: response => {
                        if (response.readyState === 2) {
                            let matches = h.re.matchAll(/(?<=attachment;filename=").*?(?=")/gis, response.responseHeaders);
                            if (matches.length && !filenames.find(f => f.url === url)) filenames.push({ url, name: matches[0] });
                            matches = h.re.matchAll(/(?<=content-type:\s).*$/gi, response.responseHeaders);
                            if (matches.length && !mimeTypes.find(m => m.url === url)) mimeTypes.push({ url, type: matches[0] });
                        }
                    },
                    onprogress: response => {
                        h.ui.setElProps(statusLabel, { color: '#469cf3' });
                        if (globalProgressStarted) {
                            xfpdGlobalProgress.update(
                                globalProgressTaskId,
                                progressKey,
                                response?.loaded || 0,
                                response?.total > 0 ? response.total : 0,
                            );
                        }
                        if (!switchedToDirect && (isGoFile || isPixeldrain || isFilester) && response && response.total && response.total > BLOB_MAX_BYTES) {
                            switchedToDirect = true;
                            try { request.abort(); } catch (e) {}
                            startDirectDownload({ size: response.total });
                            return;
                        }
                        if (!switchedToDirect && isBunkr && response && response.total && response.total > BUNKR_DIRECT_MIN_BYTES) {
                            switchedToDirect = true;
                            try { request.abort(); } catch (e) {}
                            startDirectDownload({ size: response.total });
                            return;
                        }
                        const downloadedSizeInMB = Number(response.loaded / 1024 / 1024).toFixed(2);
                        const totalSizeInMB = Number(response.total / 1024 / 1024).toFixed(2);
                        if (response.total === -1 || response.totalSize === -1) {
                            h.ui.setElProps(filePB, { width: '0%' });
                            h.ui.setText(statusLabel, `${completed} / ${totalDownloadable}  •  ${host.name}  •  ${downloadedSizeInMB} MB  •  ${ellipsedUrl}`);
                        } else {
                            h.show(filePB);
                            h.ui.setText(statusLabel, `${completed} / ${totalDownloadable}  •  ${host.name}  •  ${downloadedSizeInMB} / ${totalSizeInMB} MB  •  ${ellipsedUrl}`);
                            h.ui.setElProps(filePB, { width: `${(response.loaded / response.total) * 100}%` });
                        }
                        const p = requestProgress.find(r => r.url === progressKey);
                        if (p) p.new = response.loaded;
                    },
                    onload: async response => {
                        const p = requestProgress.find(r => r.url === progressKey);
                        if (p) clearInterval(p.intervalId);
                        if (isGoFile && (gofileActivePass.get(url) || pass) > pass) return;

                        const mCt = /content-type:\s*([^\r\n]+)/i.exec(response.responseHeaders || '');
                        const ct = mCt && mCt[1] ? mCt[1] : '';
                        const isHtml = /text\/html|application\/xhtml\+xml/i.test(ct);
                        const isGate = /text\/html|application\/xhtml\+xml|application\/json/i.test(ct);
                        const badStatus = !response.status || response.status >= 400;
                        const blob = response.response;
                        const size = blob && typeof blob.size === 'number' ? blob.size : 0;

                        if (isGoFile && (badStatus || isHtml)) {
                            if (pass === 1 && !gofileWarmupAttempted.has(url)) {
                                gofileWarmupAttempted.add(url);
                                gofileWarmupOpenTab(url);
                                setTimeout(() => startDownload(resource, 2), GOFILE_WARMUP_MS);
                                return;
                            }
                            log.post.error(postId, `::GoFile failed (after retry)::: ${url}`, postNumber);
                            markDone(false);
                            return;
                        }
                        if (isCyberdrop && (badStatus || isGate || (size > 0 && size <= 16384))) {
                            if (pass === 1 && cyberOrigin && cyberFilePage) {
                                cyberdropWarmupOnce(cyberOrigin, cyberFilePage, CYBERDROP_WARMUP_MS)
                                    .then(() => startDownload(resource, 2))
                                    .catch(() => startDownload(resource, 2));
                                return;
                            }
                            log.post.error(postId, `::Cyberdrop failed (gate/tiny response)::: ${url}`, postNumber);
                            markDone(false);
                            return;
                        }
                        if (isFilester && (badStatus || isGate)) {
                            if (pass === 1 && !/\/d\//i.test(String(url || ''))) {
                                startDirectDownload({ size: 0 });
                                return;
                            }
                            log.post.error(postId, `::Filester failed::: ${url}`, postNumber);
                            markDone(false);
                            return;
                        }
                        if (isBunkr && (badStatus || isHtml || /\/maint\.mp4(\?|$)/i.test(String(response.finalUrl || '')))) {
                            log.post.error(postId, `::Bunkr skipped::: ${url}`, postNumber);
                            markDone(false);
                            return;
                        }

                        let basename = guessBasename();
                        const cdName = parseDispositionFilename(response.responseHeaders || '');
                        if (cdName) basename = sanitizeWinSegment(cdName);
                        const filenameHint = filenames.find(f => f.url === url);
                        if (filenameHint && filenameHint.name) basename = sanitizeWinSegment(filenameHint.name);

                        let ext = h.ext(basename);
                        const mimeType = mimeTypes.find(m => m.url === url);
                        if (!ext && mimeType) {
                            if (/image\/jpe?g/i.test(mimeType.type)) ext = 'jpg';
                            else if (/image\/png/i.test(mimeType.type)) ext = 'png';
                        }
                        const originalName = basename;
                        if (filenames.find(f => f.original === basename)) {
                            const count = filenames.filter(f => f.original === basename).length;
                            const baseNoExt = (ext && h.fnNoExt(basename)) ? h.fnNoExt(basename) : basename;
                            basename = ext ? `${baseNoExt} (${count + 1}).${ext}` : `${baseNoExt} (${count + 1})`;
                        }
                        if (!filenameHint) filenames.push({ url, name: basename, original: originalName });

                        let fn = basename;
                        if (!postSettings.flatten && folderName && folderName.trim() !== '') fn = `${folderName}/${basename}`;
                        fn = sanitizeWinPath(fn);
                        fn = ensureUniquePath(fn);
                        basename = h.basename(fn);
                        const title = sanitizeWinSegment(threadTitle);
                        const saveAsFF = `${title} #${postNumber} - ${ensureUniqueFlatName(fn.replace(/\//g, ' - '))}`;
                        const saveAsPath = `${downloadRootFolder}/${fn}`;
                        const saveAsName = (isFF && !zippedForThis && !postSettings.createPerformerFolder) ? saveAsFF : saveAsPath;
                        const fileBlob = response.response;

                        log.post.info(postId, `::Completed::: ${url}`, postNumber);
                        markDone(true);

                        if (!zippedForThis) {
                            let writtenNatively = false;
                            if (performerDirectoryHandle) {
                                try {
                                    await xfpdWriteBlobToDirectory(performerDirectoryHandle, fn, fileBlob);
                                    writtenNatively = true;
                                } catch (e) {
                                    console.warn(`[XFPD] Could not write ${fn} through the directory handle; falling back to GM_download.`, e);
                                }
                            }
                            if (!writtenNatively) {
                                const blobUrl = URL.createObjectURL(fileBlob);
                                GM_download({
                                    url: blobUrl,
                                    name: saveAsName,
                                    onload: () => { try { URL.revokeObjectURL(blobUrl); } catch (e) {} },
                                    onerror: response => {
                                        console.log(`Error writing file ${fn} to disk.`);
                                        console.log(response);
                                        try { URL.revokeObjectURL(blobUrl); } catch (e) {}
                                    },
                                });
                            }
                        }
                        if (zippedForThis) {
                            zip.file(archivePath(fn), fileBlob);
                            zipFileCount++;
                        }
                    },
                    onerror: () => {
                        const p = requestProgress.find(r => r.url === progressKey);
                        if (p) clearInterval(p.intervalId);
                        if (switchedToDirect) return;
                        if (isGoFile && pass === 1 && !gofileWarmupAttempted.has(url)) {
                            gofileWarmupAttempted.add(url);
                            gofileWarmupOpenTab(url);
                            setTimeout(() => startDownload(resource, 2), GOFILE_WARMUP_MS);
                            return;
                        }
                        markDone(false);
                    },
                });

                requests.push({ url: progressKey, request });
                const stallMs = isTurbo ? TURBO_STALL_MS : 30000;
                const intervalId = setInterval(async () => {
                    const p = requestProgress.find(r => r.url === progressKey);
                    if (!p) return;
                    if (p.old === p.new) {
                        const rr = requests.find(r => r.url === progressKey);
                        if (rr && rr.request) rr.request.abort();
                        clearInterval(p.intervalId);
                        if (isTurbo) {
                            const st = turboRetryState.get(turboKey) || { resign: 0, direct: 0 };
                            if (st.resign < TURBO_RESIGN_RETRIES) {
                                st.resign++;
                                turboRetryState.set(turboKey, st);
                                try {
                                    const newUrl = await turboResignSignedUrl(turboId, url);
                                    if (newUrl) resource.url = newUrl;
                                } catch (e) {}
                                setTimeout(() => startDownload(resource, pass + 1), TURBO_RETRY_DELAY_MS);
                                return;
                            }
                            if (st.direct < TURBO_DIRECT_FALLBACKS) {
                                st.direct++;
                                turboRetryState.set(turboKey, st);
                                startDirectDownload();
                                return;
                            }
                        }
                        log.post.error(postId, `::Stalled/Failed::: ${url}`, postNumber);
                        if (isGoFile && pass === 1 && !gofileWarmupAttempted.has(url)) {
                            gofileWarmupAttempted.add(url);
                            gofileActivePass.set(url, 2);
                            gofileWarmupOpenTab(url);
                            setTimeout(() => startDownload(resource, 2), GOFILE_WARMUP_MS);
                            return;
                        }
                        if (completed < totalDownloadable) completed++;
                        completedBatchedDownloads++;
                        if (globalProgressStarted) xfpdGlobalProgress.complete(globalProgressTaskId, progressKey, false);
                    } else {
                        p.old = p.new;
                    }
                }, stallMs);
                requestProgress.push({ url: progressKey, intervalId, old: 0, new: 0 });
            };

            for (const item of batch) startDownload(item, 1);
            while (completedBatchedDownloads < batch.length) {
                await h.delayedResolve(1000);
            }
            if (completedBatchedDownloads >= batch.length) completedBatchedDownloads = 0;
            batch = getNextBatch();
        }
    } else {
        log.post.info(postId, '::Skipping download::', postNumber);
    }

    h.hide(filePB);
    h.hide(totalPB);
    if (completed < totalResources) {
        h.ui.setElProps(statusLabel, { color: '#e8a838', fontWeight: 'bold' });
        h.ui.setText(statusLabel, `${completed} / ${totalResources} downloaded`);
        h.show(statusLabel);
        if (wrap) h.show(wrap);
    } else {
        h.hide(statusLabel);
        if (wrap) h.hide(wrap);
    }
    if (split) split.classList.remove('is-busy');

    if (totalDownloadable > 0) {
        let title = sanitizeWinSegment(threadTitle);
        const mainZipName = customFilename || `${portablePerformerArchive ? performerFolderName : title} #${postNumber}.zip`;
        const generatedZipName = `${title} #${postNumber} generated.zip`;
        const needZipBlob = (postSettings.generateLog || postSettings.generateLinks || (effectiveZipped && zipFileCount > 0));
        if (effectiveZipped && zipFileCount === 0 && !postSettings.generateLog && !postSettings.generateLinks) {
            log.post.info(postId, `::Zipped ON but nothing to zip (all DIRECT downloads) -> skipping ZIP::`, postNumber);
        }
        if (needZipBlob) {
            log.separator(postId);
            log.post.info(postId, effectiveZipped ? `::Preparing zip::` : `::Preparing generated.zip::`, postNumber);
            if (postSettings.generateLog) {
                zip.file(archivePath(isFF ? 'generated/log.txt' : 'log.txt'), logs.filter(l => l.postId === postId).map(l => l.message).join('\n'));
            }
            if (postSettings.generateLinks) {
                zip.file(archivePath(isFF ? 'generated/links.txt' : 'links.txt'), resolved.filter(r => r.url).map(r => r.url).join('\n'));
            }
            let blob = null;
            try { blob = await zip.generateAsync({ type: 'blob' }); } catch (e) {
                console.log('JSZip failed to construct the Blob. For very large albums, try unzipped mode.');
                console.log(e);
                blob = null;
            }
            if (blob) {
                if (effectiveZipped) {
                    if (performerDirectoryHandle) {
                        try {
                            await xfpdWriteBlobToDirectory(performerDirectoryHandle, `#${postNumber}.zip`, blob);
                            blob = null;
                        } catch (e) {
                            console.warn('[XFPD] Could not write the ZIP into the performer directory; using a normal download.', e);
                            try { saveAs(blob, mainZipName); } catch (saveError) { console.log(saveError); }
                        }
                    } else if (isFF || portablePerformerArchive) {
                        saveAs(blob, mainZipName);
                    } else {
                        await new Promise(resolve => {
                            const url = URL.createObjectURL(blob);
                            GM_download({
                                url,
                                name: `${downloadRootFolder}/#${postNumber}.zip`,
                                onload: () => { try { URL.revokeObjectURL(url); } catch (e) {} blob = null; resolve(); },
                                onerror: response => {
                                    try { URL.revokeObjectURL(url); } catch (e) {}
                                    console.log(response);
                                    try { saveAs(blob, mainZipName); } catch (e) {}
                                    resolve();
                                },
                            });
                        });
                    }
                } else if (postSettings.generateLog || postSettings.generateLinks) {
                    if (performerDirectoryHandle) {
                        try {
                            await xfpdWriteBlobToDirectory(performerDirectoryHandle, `#${postNumber}/generated.zip`, blob);
                            blob = null;
                        } catch (e) {
                            console.warn('[XFPD] Could not write generated.zip into the performer directory.', e);
                        }
                    } else if (isFF) {
                        saveAs(blob, generatedZipName);
                    } else {
                        await new Promise(resolve => {
                            const url = URL.createObjectURL(blob);
                            GM_download({
                                url,
                                name: `${downloadRootFolder}/#${postNumber}/generated.zip`,
                                onload: () => { try { URL.revokeObjectURL(url); } catch (e) {} blob = null; resolve(); },
                                onerror: response => { try { URL.revokeObjectURL(url); } catch (e) {} console.log(response); blob = null; resolve(); },
                            });
                        });
                    }
                }
            }
        }
    }

    if (globalProgressStarted) xfpdGlobalProgress.finish(globalProgressTaskId);
    setProcessing(false, postId);
    if (!processing.some(p => p.processing)) {
        gofileRestoreCookie();
    }
    if (totalDownloadable > 0) {
        if (!postSettings.skipDownload) log.post.info(postId, `::Download completed::`, postNumber);
        else log.post.info(postId, `::Links generation completed::`, postNumber);
        callbacks && callbacks.onComplete && callbacks.onComplete(totalDownloadable, completed);
    }
    window.logs = window.logs.filter(l => l.postId !== postId);
};

const registerPostReaction = postFooter => {
    if (!postFooter) return;

    const hasReaction = postFooter.querySelector('.has-reaction');
    if (!hasReaction) {
        const reactionAnchor = postFooter.querySelector('.reaction--imageHidden');
        if (reactionAnchor) {
            reactionAnchor.setAttribute('href', reactionAnchor.getAttribute('href').replace('_id=1', '_id=33'));
            reactionAnchor.click();
        }
    }
};

const CYBERDROP_WARMUP_DEFAULT_MS = 2500;
let cyberdropWarmupChain = Promise.resolve();
const cyberdropWarmupAttempted = new Map();

async function cyberdropWarmupOnce(key, warmUrl, ms = CYBERDROP_WARMUP_DEFAULT_MS) {
    if (typeof warmUrl === 'undefined') {
        const maybeUrl = String(key || '').trim();
        if (/^https?:\/\//i.test(maybeUrl)) {
            warmUrl = maybeUrl;
            try { key = `cyberdrop:${new URL(maybeUrl).origin}`; } catch { key = `cyberdrop:${maybeUrl}`; }
        }
    }
    const _k0 = String(key || '').trim();
    if (_k0.indexOf('://') !== -1) {
        const m = _k0.match(/https?:\/\/[^\s]+/i);
        if (m) { try { key = `cyberdrop:${new URL(m[0]).origin}`; } catch {} }
    }
    const k = String(key || '').trim();
    const u = String(warmUrl || '').trim();
    if (!k || !u) return;
    if (cyberdropWarmupAttempted.has(k)) {
        try { await cyberdropWarmupAttempted.get(k); } catch (e) {}
        return;
    }
    cyberdropWarmupChain = cyberdropWarmupChain.then(() => {
        return new Promise(resolve => {
            try {
                const tab = GM_openInTab(u, { active: false, insert: true, setParent: true });
                setTimeout(() => {
                    try { xfpdCloseTabHandle(tab); } catch (e) {}
                    resolve();
                }, Math.max(250, ms));
            } catch (e) {
                resolve();
            }
        });
    });
    cyberdropWarmupAttempted.set(k, cyberdropWarmupChain);
    await cyberdropWarmupChain;
}

const parsedPosts = [];
const selectedPosts = [];

const addDuplicateTabLink = post => {
    const article = post.closest('article.message, article[data-content], .message') || post.parentNode?.parentNode;
    const main = article?.querySelector('.message-attribution-main');
    const permalink =
        post.querySelector('a[href*="/post-"]') ||
        article?.querySelector('.message-attribution a[href*="/post-"]');

    if (!main || main.querySelector('.xfpd-duplicate-tab')) return;

    const anchor = document.createElement('a');
    anchor.className = 'xfpd-attr xfpd-duplicate-tab';
    anchor.setAttribute('href', permalink?.href || location.href);
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener');
    anchor.innerHTML = '<i class="fa fa-copy"></i> Duplicate tab';
    main.append(anchor);
};

const addShowDownloadPageBtnLink = post => {
    const article = post.closest('article.message, article[data-content], .message') || post.parentNode?.parentNode;
    const main = article?.querySelector('.message-attribution-main');
    if (!main || main.querySelector('.xfpd-page-download-link')) return;

    const anchor = document.createElement('a');
    anchor.className = 'xfpd-attr xfpd-page-download-link';
    anchor.setAttribute('href', '#download-page');
    anchor.innerHTML = '<i class="fa fa-arrow-up"></i> Page download';
    anchor.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('download-page')?.click();
    });
    main.append(anchor);
};

const addDownloadPageButton = (postCount) => {
    const existingButton = document.getElementById('download-page');
    if (existingButton) return existingButton;

    const downloadAllButton = document.createElement('a');
    downloadAllButton.setAttribute('id', 'download-page');
    downloadAllButton.setAttribute('href', '#');
    downloadAllButton.setAttribute('class', 'button--link button rippleButton xfpd-page-btn');
    const buttonTextSpan = document.createElement('span');
    buttonTextSpan.setAttribute('class', 'button-text download-page-btn');
    buttonTextSpan.innerHTML = `↓ Download page <span class="xfpd-page-count">${postCount}</span>`;
    downloadAllButton.appendChild(buttonTextSpan);
    const buttonGroup =
        h.element('.buttonGroup') ||
        h.element('.p-title-pageAction') ||
        h.element('.p-title') ||
        document.body;
    if (buttonGroup) buttonGroup.prepend(downloadAllButton);
    return downloadAllButton;
};

const addDownloadMediaButton = (kind, fileCount) => {
    const id = `download-page-${kind}s`;
    const existingButton = document.getElementById(id);
    if (existingButton) return existingButton;

    const button = document.createElement('a');
    button.id = id;
    button.href = '#';
    button.className = 'button--link button rippleButton xfpd-page-btn';
    button.innerHTML = `<span class="button-text">↓ Download all ${kind}s <span class="xfpd-page-count">${fileCount}</span></span>`;
    const buttonGroup =
        h.element('.buttonGroup') ||
        h.element('.p-title-pageAction') ||
        h.element('.p-title') ||
        document.body;
    buttonGroup.prepend(button);
    return button;
};

const xfpdCreateProgressCard = () => {
    const wrap = document.createElement('div');
    wrap.className = 'xfpd-progress';
    const { el: statusText } = ui.labels.status.createStatusLabel();
    const filePBar = ui.pBars.createFileProgressBar();
    const totalPBar = ui.pBars.createTotalProgressBar();
    const { fileTrack, totalTrack } = ui.pBars.wrapBars(filePBar, totalPBar);
    wrap.appendChild(statusText);
    wrap.appendChild(fileTrack);
    wrap.appendChild(totalTrack);
    h.hide(wrap);
    return { wrap, statusText, filePBar, totalPBar };
};

const xfpdCreatePageDrawer = () => {
    const backdrop = document.createElement('div');
    backdrop.className = 'xfpd-drawer-backdrop';
    const drawer = document.createElement('aside');
    drawer.className = 'xfpd-drawer';
    drawer.innerHTML = `
        <div class="xfpd-drawer-head">
            <div>
                <div class="xfpd-drawer-title">Download this page</div>
                <div class="xfpd-drawer-sub" id="xfpd-drawer-sub">Select posts with media</div>
            </div>
            <button type="button" class="xfpd-icon-btn" id="xfpd-drawer-close" aria-label="Close">×</button>
        </div>
        <div class="xfpd-drawer-toolbar">
            <label class="xfpd-toggle" for="config-toggle-all-posts">
                <input type="checkbox" id="config-toggle-all-posts" />
                <span>Select all</span>
            </label>
            <div class="xfpd-post-count" id="xfpd-selected-meta">0 selected</div>
        </div>
        <div class="xfpd-drawer-list" id="xfpd-drawer-list"></div>
        <div class="xfpd-drawer-foot">
            <button type="button" class="xfpd-cta xfpd-cta-secondary" id="xfpd-drawer-images">All images</button>
            <button type="button" class="xfpd-cta xfpd-cta-secondary" id="xfpd-drawer-videos">All videos</button>
            <button type="button" class="xfpd-cta" id="xfpd-drawer-go">Download selected</button>
        </div>
    `;
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'xfpd-fab';
    fab.id = 'xfpd-page-fab';
    fab.innerHTML = '<span class="xfpd-fab-dot"></span> Download page';
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    document.body.appendChild(fab);

    const setOpen = (open) => {
        backdrop.classList.toggle('is-open', open);
        drawer.classList.toggle('is-open', open);
    };
    const close = () => setOpen(false);
    const open = () => setOpen(true);
    backdrop.addEventListener('click', close);
    drawer.querySelector('#xfpd-drawer-close').addEventListener('click', close);
    fab.addEventListener('click', open);
    return { backdrop, drawer, fab, open, close };
};

(function () {
    try { if (window.__XFPD_ABORT_MAIN) return; } catch (e) {}
    try { if (/(^|\.)gofile\.io$/i.test(location.hostname)) return; } catch (e) {}

    window.addEventListener('beforeunload', e => {
        if (processing.find(p => p.processing)) {
            const message = 'Downloads are in progress. Sure you wanna exit this page?';
            e.returnValue = message;
            return message;
        }
    });

    const xfpdInitialize = async () => {
        if (document.documentElement.dataset.xfpdInitialized === 'true') return;
        document.documentElement.dataset.xfpdInitialized = 'true';

        // Warm the previously selected handle before the next user click. If no
        // handle exists, download clicks reach showDirectoryPicker immediately
        // while Chrome's transient user activation is still valid.
        void xfpdPreloadPerformerFolder();

        // RedGifs authentication is optional. Never block the forum controls on a
        // cross-origin request that can stall indefinitely in a userscript manager.
        void h.http
            .get('https://api.redgifs.com/v2/auth/temporary', {}, {}, 'text')
            .then(({ source, status }) => {
                if (status !== 200) throw new Error(`HTTP ${status}`);
                if (h.contains('token', source)) {
                    const token = JSON.parse(source).token;
                    GM_setValue('redgifs_token', token);
                }
            })
            .catch(e => console.warn('[XFPD] RedGifs token refresh failed; continuing without it.', e));

        init.injectCustomStyles();

        const pageDrawer = xfpdCreatePageDrawer();
        const refreshSelectedMeta = () => {
            const enabled = selectedPosts.filter(s => s.enabled);
            const files = enabled.reduce((acc, s) => {
                return acc + s.post.parsedHosts.filter(h => h.enabled).reduce((a, host) => a + host.resources.length, 0);
            }, 0);
            const meta = document.getElementById('xfpd-selected-meta');
            const sub = document.getElementById('xfpd-drawer-sub');
            const cta = document.getElementById('xfpd-drawer-go');
            if (meta) meta.textContent = `${enabled.length} post${enabled.length === 1 ? '' : 's'} · ${files} file${files === 1 ? '' : 's'}`;
            if (sub) sub.textContent = `${parsedPosts.filter(p => p.parsedHosts.length).length} posts with media on this page`;
            if (cta) cta.textContent = files ? `Download ${files} file${files === 1 ? '' : 's'}` : 'Select posts to download';
        };

        h.elements('.message-attribution-opposite').forEach(post => {
            try {
            const settings = xfpdLoadUiSettings();
            const parsedPost = parsers.thread.parsePost(post);
            const { content, contentContainer } = parsedPost;

            addDuplicateTabLink(post);
            addShowDownloadPageBtnLink(post);

            const parsedHosts = parsers.hosts.parseHosts(content);
            const getEnabledHostsCB = parsedHosts => parsedHosts.filter(host => host.enabled);
            if (!parsedHosts.length) return;

            const getTotalDownloadableResourcesForPostCB = parsedHosts => {
                return parsedHosts.filter(host => host.enabled && host.resources.length).reduce((acc, host) => acc + host.resources.length, 0);
            };

            const { btn: btnDownloadPost, optsBtn, split } = ui.buttons.addDownloadPostButton(post);
            const totalResources = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);
            const checkedLength = getTotalDownloadableResourcesForPostCB(parsedHosts);
            const textEl = btnDownloadPost.querySelector('.xfpd-dl-text') || btnDownloadPost;
            textEl.textContent = `Download (${checkedLength}/${totalResources})`;

            const { wrap, statusText, filePBar, totalPBar } = xfpdCreateProgressCard();
            contentContainer.prepend(wrap);

            const runDownload = async () => {
                await xfpdPreparePerformerFolder(settings, statusText);
                return downloadPost(parsedPost, parsedHosts, getEnabledHostsCB, resolvers, () => settings, {
                    status: statusText,
                    filePB: filePBar,
                    totalPB: totalPBar,
                    wrap,
                    split,
                }, postDownloadCallbacks);
            };

            const onFormSubmitCB = async data => {
                const { tippyInstance } = data;
                tippyInstance.hide();
                await runDownload();
            };

            try {
                ui.forms.config.post.createPostConfigForm(
                    parsedPost,
                    parsedHosts,
                    `#${parsedPost.postNumber}.zip`,
                    settings,
                    onFormSubmitCB,
                    getTotalDownloadableResourcesForPostCB,
                    btnDownloadPost,
                    optsBtn,
                );
            } catch (e) {
                // Keep the primary download action alive if the tooltip dependency is blocked.
                console.warn(`[XFPD] Options popover unavailable for post ${parsedPost.postId}.`, e);
            }

            const postDownloadCallbacks = {
                onComplete: (total, completed) => {
                    if (total > 0 && completed > 0) {
                        registerPostReaction(parsedPost.footer);
                    }
                },
            };

            parsedPosts.push({
                parsedPost,
                parsedHosts,
                enabledHostsCB: getEnabledHostsCB,
                resolvers,
                getSettingsCB: () => settings,
                statusUI: { status: statusText, filePB: filePBar, totalPB: totalPBar, wrap, split },
                postDownloadCallbacks,
            });

            btnDownloadPost.addEventListener('click', e => {
                e.preventDefault();
                void runDownload();
            });
            optsBtn.addEventListener('click', e => e.preventDefault());
            } catch (e) {
                // Promoted/system messages can use different markup. One such item must not
                // prevent every real post on the page from receiving controls.
                console.error('[XFPD] Skipped a post whose markup could not be parsed.', e, post);
            }
        });

        const postsWithMedia = parsedPosts.filter(p => p.parsedHosts.length);
        if (postsWithMedia.length > 0) {
            const btnDownloadPage = addDownloadPageButton(postsWithMedia.length);
            const mediaEntries = kind => postsWithMedia.map(post => ({
                post,
                hosts: xfpdHostsForMedia(post.parsedHosts, kind),
            })).filter(entry => entry.hosts.some(host => host.resources.length));
            const imageEntries = mediaEntries('image');
            const videoEntries = mediaEntries('video');
            const imageCount = imageEntries.reduce((total, entry) => total + entry.hosts.reduce((n, host) => n + host.resources.length, 0), 0);
            const videoCount = videoEntries.reduce((total, entry) => total + entry.hosts.reduce((n, host) => n + host.resources.length, 0), 0);
            const btnDownloadImages = addDownloadMediaButton('image', imageCount);
            const btnDownloadVideos = addDownloadMediaButton('video', videoCount);
            const drawerImages = document.getElementById('xfpd-drawer-images');
            const drawerVideos = document.getElementById('xfpd-drawer-videos');
            if (drawerImages) drawerImages.textContent = `All images (${imageCount})`;
            if (drawerVideos) drawerVideos.textContent = `All videos (${videoCount})`;
            const list = document.getElementById('xfpd-drawer-list');
            const fab = document.getElementById('xfpd-page-fab');
            if (fab) fab.innerHTML = `<span class="xfpd-fab-dot"></span> Download page · ${postsWithMedia.length}`;

            postsWithMedia.forEach(post => {
                const { postId, postNumber, textContent, contentContainer } = post.parsedPost;
                selectedPosts.push({ post, enabled: false });
                const threadTitle = parsers.thread.parseTitle();
                let defaultPostContent = textContent.trim().replace('​', '');
                const ellipsedText = h.limit(defaultPostContent === '' ? threadTitle : defaultPostContent, 28);
                const fileCount = post.parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);
                const row = document.createElement('label');
                row.className = 'xfpd-post-row';
                row.setAttribute('for', `config-download-post-${postId}`);
                row.innerHTML = `
                    <input type="checkbox" id="config-download-post-${postId}" />
                    <span>
                        <span class="xfpd-post-num">Post #${postNumber}</span>
                        <a class="xfpd-post-preview" id="post-content-${postId}" href="#post-${postId}">${ellipsedText}</a>
                    </span>
                    <span class="xfpd-post-count">${fileCount}</span>
                `;
                list.appendChild(row);

                try {
                    ui.tooltip(
                        `#post-content-${postId}`,
                        `<div style="overflow-y: auto; background: #242323; padding: 16px; width: 500px; max-height: 500px">${contentContainer.innerHTML}</div>`,
                        { placement: 'left', offset: [10, 15] },
                    );
                } catch (e) {
                    console.warn(`[XFPD] Preview tooltip unavailable for post ${postId}.`, e);
                }

                row.querySelector('input').addEventListener('change', e => {
                    const selectedPost = selectedPosts.find(s => s.post.parsedPost.postId === postId);
                    selectedPost.enabled = e.target.checked;
                    row.classList.toggle('is-on', e.target.checked);
                    const checkAllCB = h.element('#config-toggle-all-posts');
                    checkAllCB.checked = selectedPosts.filter(s => s.enabled).length === parsedPosts.length;
                    checkAllCB.closest('.xfpd-toggle')?.classList.toggle('is-on', checkAllCB.checked);
                    refreshSelectedMeta();
                });
            });

            h.element('#config-toggle-all-posts').addEventListener('change', e => {
                const checked = e.target.checked;
                e.target.closest('.xfpd-toggle')?.classList.toggle('is-on', checked);
                selectedPosts.forEach(s => {
                    const box = h.element(`#config-download-post-${s.post.parsedPost.postId}`);
                    if (box && box.checked !== checked) box.click();
                });
            });

            const prepareEntries = async entries => {
                for (const entry of entries) {
                    const post = entry.post || entry;
                    const uiSettings = post.getSettingsCB();
                    await xfpdPreparePerformerFolder(uiSettings, post.statusUI?.status || null);
                }
            };

            const startSelected = async () => {
                const enabled = selectedPosts.filter(s => s.enabled);
                if (!enabled.length) return;
                pageDrawer.close();
                await prepareEntries(enabled.map(s => s.post));
                enabled.forEach(s => {
                    void downloadPost(
                        s.post.parsedPost,
                        s.post.parsedHosts,
                        s.post.enabledHostsCB,
                        s.post.resolvers,
                        s.post.getSettingsCB,
                        s.post.statusUI,
                        s.post.postDownloadCallbacks,
                    );
                });
            };

            const startMedia = async kind => {
                const entries = kind === 'image' ? imageEntries : videoEntries;
                if (!entries.length) return;
                pageDrawer.close();
                await prepareEntries(entries);
                entries.forEach(({ post, hosts: mediaHosts }) => {
                    void downloadPost(
                        post.parsedPost,
                        mediaHosts,
                        hostsForPost => hostsForPost.filter(host => host.enabled),
                        post.resolvers,
                        () => ({ ...post.getSettingsCB(), _xfpdMediaFilter: kind }),
                        post.statusUI,
                        post.postDownloadCallbacks,
                    );
                });
            };

            document.getElementById('xfpd-drawer-go').addEventListener('click', () => void startSelected());
            document.getElementById('xfpd-drawer-images').addEventListener('click', () => void startMedia('image'));
            document.getElementById('xfpd-drawer-videos').addEventListener('click', () => void startMedia('video'));
            btnDownloadImages.addEventListener('click', e => {
                e.preventDefault();
                void startMedia('image');
            });
            btnDownloadVideos.addEventListener('click', e => {
                e.preventDefault();
                void startMedia('video');
            });
            btnDownloadPage.addEventListener('click', e => {
                e.preventDefault();
                pageDrawer.open();
            });
            refreshSelectedMeta();
        } else {
            pageDrawer.fab.style.display = 'none';
        }
    };

    // @require files can make document-start scripts arrive after DOMContentLoaded.
    // Initialize correctly in either timing and only once.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', xfpdInitialize, { once: true });
    } else {
        void xfpdInitialize();
    }
})();
