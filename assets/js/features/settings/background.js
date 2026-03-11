const BackgroundManager = (() => {
    const ImageCacheStore = {
        dbName: 'JueguitosDB',
        storeName: 'backgrounds',
        dbVersion: 1,

        async open() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        db.createObjectStore(this.storeName);
                    }
                };
                request.onsuccess = (e) => resolve(e.target.result);
                request.onerror = (e) => reject(e.target.error);
            });
        },

        async saveBlob(key, blob) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.put(blob, key);
                tx.oncomplete = () => db.close();
                resolve(true); 
            });
        },

        async getBlob(key) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
                tx.oncomplete = () => db.close();
            });
        },

        async deleteBlob(key) {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                store.delete(key);
                tx.oncomplete = () => db.close();
                resolve(true);
            });
        }
    };

    const apply = async (bgType, bgValue, isLite) => {
        const body = document.body;

        body.style.removeProperty('background-image');
        body.style.removeProperty('background-size');
        body.style.removeProperty('background-attachment');
        body.style.removeProperty('background-position');

        if (isLite) return;
        if (body.classList.contains('prime-mode')) return;

        if (bgType === 'blob') {
            try {
                const key = (bgValue && bgValue !== 'indexeddb') ? bgValue : 'custom_bg';
                const blob = await ImageCacheStore.getBlob(key);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    body.style.setProperty('background-image', `url('${url}')`, 'important');
                    body.style.backgroundSize = 'cover';
                    body.style.backgroundAttachment = 'fixed';
                    body.style.backgroundPosition = 'center';
                }
            } catch (e) {
                console.error('Err bg blob:', e);
            }
        } else if (bgType === 'url' && bgValue) {
            body.style.setProperty('background-image', `url('${bgValue}')`, 'important');
            body.style.backgroundSize = 'cover';
            body.style.backgroundAttachment = 'fixed';
            body.style.backgroundPosition = 'center';
        }
    };

    const updatePreviewLocally = (url, file) => {
        const preview = document.getElementById('settingBgPreview');
        if (file) {
            const tempUrl = URL.createObjectURL(file);
            preview.style.backgroundImage = `url('${tempUrl}')`;
        } else if (url) {
            preview.style.backgroundImage = `url('${url}')`;
        }
    };

    return { ImageCacheStore, apply, updatePreviewLocally };
})();
