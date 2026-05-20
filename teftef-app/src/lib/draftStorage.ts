import { openDB } from 'idb';

const DB_NAME = 'teftef-drafts';
const STORE_NAME = 'drafts';

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveDraft<T>(key: string, value: T) {
  const db = await getDb();
  await db.put(STORE_NAME, value, key);
}

export async function loadDraft<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, key);
}

export async function clearDraft(key: string) {
  const db = await getDb();
  await db.delete(STORE_NAME, key);
}
