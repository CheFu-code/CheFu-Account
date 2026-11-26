export type StoredRead = { found: boolean; value?: unknown; version: string };
export interface PersistentCache {
  read(account: string, path: string): Promise<StoredRead>;
  write(
    account: string,
    path: string,
    value: unknown,
    version: string,
  ): Promise<void>;
  invalidate(account?: string, path?: string): Promise<void>;
}

// Data and invalidation versions share transactions so late responses from
// another tab cannot recreate entries invalidated by logout or a mutation.
export class IndexedDbCache implements PersistentCache {
  private database?: Promise<IDBDatabase | null>;

  private open() {
    if (!this.database)
      this.database = new Promise<IDBDatabase | null>((resolve) => {
        if (typeof indexedDB === "undefined") {
          resolve(null);
          return;
        }
        try {
          const request = indexedDB.open("chefu-account-pages-v1", 1);
          request.onupgradeneeded = () => {
            request.result.createObjectStore("entries", {
              keyPath: ["account", "path"],
            });
            request.result.createObjectStore("versions", {
              keyPath: "account",
            });
          };
          request.onerror = () => resolve(null);
          request.onblocked = () => resolve(null);
          request.onsuccess = () => {
            request.result.onversionchange = () => request.result.close();
            resolve(request.result);
          };
        } catch {
          resolve(null);
        }
      });
    return this.database;
  }

  async read(account: string, path: string): Promise<StoredRead> {
    const miss = { found: false, version: "" };
    try {
      const db = await this.open();
      if (!db) return miss;
      return await new Promise<StoredRead>((resolve) => {
        const tx = db.transaction(["entries", "versions"], "readonly");
        const entry = tx.objectStore("entries").get([account, path]);
        const global = tx.objectStore("versions").get("*");
        const local = tx.objectStore("versions").get(account);
        tx.oncomplete = () =>
          resolve({
            found: !!entry.result,
            value: entry.result?.value,
            version: `${global.result?.version || 0}:${local.result?.version || 0}`,
          });
        tx.onerror = tx.onabort = () => resolve(miss);
      });
    } catch {
      return miss;
    }
  }

  async write(account: string, path: string, value: unknown, version: string) {
    if (!version) return;
    try {
      const db = await this.open();
      if (!db) return;
      await new Promise<void>((resolve) => {
        const tx = db.transaction(["entries", "versions"], "readwrite");
        const global = tx.objectStore("versions").get("*");
        const local = tx.objectStore("versions").get(account);
        local.onsuccess = () => {
          if (
            `${global.result?.version || 0}:${local.result?.version || 0}` ===
            version
          )
            tx.objectStore("entries").put({ account, path, value });
        };
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => resolve();
      });
    } catch {
      /* Storage restrictions/quota fall back to the memory cache. */
    }
  }

  async invalidate(account?: string, path?: string) {
    try {
      const db = await this.open();
      if (!db) return;
      await new Promise<void>((resolve) => {
        const tx = db.transaction(["entries", "versions"], "readwrite");
        const versions = tx.objectStore("versions");
        const previous = versions.get(account || "*");
        previous.onsuccess = () =>
          versions.put({
            account: account || "*",
            version: (previous.result?.version || 0) + 1,
          });
        const entries = tx.objectStore("entries");
        if (!account) entries.clear();
        else if (path) entries.delete([account, path]);
        else {
          const cursor = entries.openKeyCursor(
            IDBKeyRange.bound([account, ""], [account, "\uffff"]),
          );
          cursor.onsuccess = () => {
            if (!cursor.result) return;
            entries.delete(cursor.result.primaryKey);
            cursor.result.continue();
          };
        }
        tx.oncomplete = () => resolve();
        tx.onerror = tx.onabort = () => resolve();
      });
    } catch {
      /* Memory invalidation still applies when storage is unavailable. */
    }
  }
}
