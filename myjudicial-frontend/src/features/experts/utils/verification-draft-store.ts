/**
 * IndexedDB storage for draft file attachments in the expert portal.
 *
 * Unlike localStorage (which only stores strings and fails on binary data),
 * IndexedDB natively supports storing raw File and Blob objects.
 * This ensures that when an expert selects documents, they persist
 * across page refreshes, tab closures, and navigation without data loss.
 */

const DB_NAME = "mj_verification_drafts_db";
const DB_VERSION = 1;
const STORE_NAME = "draft_files";

interface StoredDraftRecord {
  id: string; // e.g. "identity", "bar_certificate", "onboarding_photo", "additional_0"
  file: File | Blob;
  name: string;
  size: number;
  type: string;
  label?: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

function reconstructFile(record: StoredDraftRecord): File | null {
  if (!record || !record.file) return null;

  try {
    if (typeof File !== "undefined" && record.file instanceof File) {
      return record.file;
    }

    if (typeof Blob !== "undefined" && record.file instanceof Blob) {
      return new File([record.file], record.name || "document", {
        type: record.type || record.file.type || "application/octet-stream",
        lastModified: record.updatedAt || Date.now(),
      });
    }

    // Fallback if structured clone converted to binary buffer
    return new File([record.file as any], record.name || "document", {
      type: record.type || "application/octet-stream",
      lastModified: record.updatedAt || Date.now(),
    });
  } catch (err) {
    console.warn("[IndexedDB] Could not reconstruct File:", err);
    return null;
  }
}

/**
 * Save a File object into IndexedDB under a designated identifier.
 */
export async function saveDraftFile(id: string, file: File, label?: string): Promise<void> {
  if (typeof window === "undefined" || !file) return;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const record: StoredDraftRecord = {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        label,
        updatedAt: Date.now(),
      };

      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Failed to store draft file"));
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to save draft file:", err);
  }
}

/**
 * Retrieve a stored draft File from IndexedDB.
 * Defensive reconstruction ensures a valid DOM File instance is always returned.
 */
export async function getDraftFile(id: string): Promise<File | null> {
  if (typeof window === "undefined") return null;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const record = req.result as StoredDraftRecord | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        resolve(reconstructFile(record));
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to retrieve draft file:", err);
    return null;
  }
}

/**
 * Retrieve all stored draft files as a dictionary map.
 */
export async function getAllDraftFiles(): Promise<Record<string, { file: File; label?: string }>> {
  if (typeof window === "undefined") return {};

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result || []) as StoredDraftRecord[];
        const map: Record<string, { file: File; label?: string }> = {};
        for (const rec of records) {
          const file = reconstructFile(rec);
          if (file) {
            map[rec.id] = { file, label: rec.label };
          }
        }
        resolve(map);
      };

      req.onerror = () => {
        resolve({});
      };
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to retrieve all draft files:", err);
    return {};
  }
}

/**
 * Remove a specific draft file from IndexedDB.
 */
export async function removeDraftFile(id: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Failed to delete draft file"));
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to remove draft file:", err);
  }
}

/**
 * Clear all draft verification files from IndexedDB.
 */
export async function clearAllDraftFiles(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error("Failed to clear draft store"));
    });
  } catch (err) {
    console.warn("[IndexedDB] Failed to clear draft files:", err);
  }
}
