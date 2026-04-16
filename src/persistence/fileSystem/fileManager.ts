import { CyrilFile, CyrilProject } from '../../domain/project/types';
import { createDefaultProject, createCyrilFile, generateId } from '../../domain/project/defaults';
import { serializeProject, deserializeProject } from '../serializers/projectSerializer';

// File System Access API approach
// Fallback: local download / input[type=file]

let fileHandle: FileSystemFileHandle | null = null;

const LAST_PROJECT_KEY = 'cyril-last-project-name';
const HANDLE_DB_NAME = 'cyril-file-handles';
const HANDLE_STORE_NAME = 'handles';
const HANDLE_KEY = 'last-project-handle';

// Simple IndexedDB wrapper for storing file handles
async function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HANDLE_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        db.createObjectStore(HANDLE_STORE_NAME);
      }
    };
  });
}

async function storeFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(HANDLE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HANDLE_STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.put(handle, HANDLE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    // IndexedDB storage failed - fall back to localStorage name only
  }
}

async function getStoredFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(HANDLE_STORE_NAME, 'readonly');
    const store = tx.objectStore(HANDLE_STORE_NAME);
    const handle = await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
      const request = store.get(HANDLE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

async function clearStoredFileHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(HANDLE_STORE_NAME, 'readwrite');
    const store = tx.objectStore(HANDLE_STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(HANDLE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    // Ignore cleanup errors
  }
}

export async function tryReopenLastProject(): Promise<CyrilFile | null> {
  try {
    const storedHandle = await getStoredFileHandle();
    if (!storedHandle) return null;
    
    // Try to open the stored handle - this will fail if permission was revoked
    const file = await storedHandle.getFile();
    const contents = await file.text();
    fileHandle = storedHandle;
    return deserializeProject(contents);
  } catch {
    // Stored handle no longer valid (permission revoked or file moved/deleted)
    await clearStoredFileHandle();
    localStorage.removeItem(LAST_PROJECT_KEY);
    return null;
  }
}

export async function openProject(): Promise<CyrilFile | null> {
  try {
    if (!('showOpenFilePicker' in window)) {
      throw new Error('File System Access API not supported in this browser.');
    }

    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Cyril Project Files',
          accept: {
            'application/json': ['.cyril'],
          },
        },
      ],
      excludeAcceptAllOption: true,
      multiple: false,
    });
    
    fileHandle = handle;
    localStorage.setItem(LAST_PROJECT_KEY, handle.name);
    await storeFileHandle(handle);
    const file = await handle.getFile();
    const contents = await file.text();
    return deserializeProject(contents);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // User cancelled picker - return null gracefully
      return null;
    }
    throw new Error(`Failed to open project: ${error.message}`);
  }
}

export function clearLastProject(): void {
  localStorage.removeItem(LAST_PROJECT_KEY);
}

export function getLastProjectName(): string | null {
  return localStorage.getItem(LAST_PROJECT_KEY);
}

export async function saveProject(fileContent: CyrilFile, isSaveAs: boolean = false): Promise<void> {
  try {
    // Refresh updated timestamp
    fileContent.project.updatedAt = new Date().toISOString();

    const serializedData = serializeProject(fileContent);

    if (isSaveAs || !fileHandle) {
      if (!('showSaveFilePicker' in window)) {
        throw new Error('File System Access API not supported.');
      }
      
      fileHandle = await window.showSaveFilePicker({
        suggestedName: `${fileContent.project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled'}.cyril`,
        types: [
          {
            description: 'Cyril Project File',
            accept: { 'application/json': ['.cyril'] },
          },
        ],
      });
      localStorage.setItem(LAST_PROJECT_KEY, fileHandle.name);
      await storeFileHandle(fileHandle);
    }

    const writable = await fileHandle!.createWritable();
    await writable.write(serializedData);
    await writable.close();
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      throw new Error(`Failed to save project: ${error.message}`);
    }
  }
}

export function createNewProject(title?: string, keepHandle = false): CyrilFile {
  if (!keepHandle) {
    fileHandle = null; // Clear old handle
    localStorage.removeItem(LAST_PROJECT_KEY);
  }
  const project = createDefaultProject(title);
  return createCyrilFile(project);
}

export function duplicateProject(existingFile: CyrilFile, newTitle: string): CyrilFile {
  fileHandle = null; // Treat as a new unsaved file
  
  const newProject: CyrilProject = {
    ...existingFile.project,
    id: generateId('proj'),
    title: newTitle,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return createCyrilFile(newProject);
}
