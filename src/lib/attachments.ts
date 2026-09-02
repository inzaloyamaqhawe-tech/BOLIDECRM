import type { Attachment } from "../types";

/**
 * File attachments live in IndexedDB, not the same localStorage-backed store
 * as everything else — a scanned quote or contract can easily be a few MB,
 * and localStorage's ~5-10MB total quota (shared across the whole app)
 * would fill up fast if attachments went through it. IndexedDB has no such
 * practical ceiling.
 *
 * This is deliberately its own small async module rather than wired into
 * `store.ts`'s synchronous get/save pattern — components fetch and refresh
 * their own attachment list with a plain useState+useEffect instead of
 * `useSyncExternalStore`.
 */

const DB_NAME = "bolide-crm-attachments";
const STORE_NAME = "attachments";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("dealId", "dealId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function uid() {
  return `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function getAttachments(dealId: string): Promise<Attachment[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const index = tx.objectStore(STORE_NAME).index("dealId");
      const req = index.getAll(dealId);
      req.onsuccess = () => resolve((req.result as Attachment[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function addAttachment(dealId: string, file: File): Promise<Attachment> {
  const dataUrl = await fileToDataUrl(file);
  const attachment: Attachment = {
    id: uid(),
    dealId,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    dataUrl,
    createdAt: new Date().toISOString(),
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(attachment);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return attachment;
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
