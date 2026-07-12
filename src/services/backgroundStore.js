// ============================================================================
// IMAGE CACHE STORE (IndexedDB Service)
// ============================================================================

export const ImageCacheStore = {
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
            tx.oncomplete = () => {
                db.close();
                resolve(true);
            };
            tx.onerror = (e) => {
                db.close();
                reject(e.target.error);
            };
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
            tx.oncomplete = () => {
                db.close();
                resolve(true);
            };
            tx.onerror = (e) => {
                db.close();
                reject(e.target.error);
            };
        });
    }
};
