import { CyrilFile, CyrilProject } from '../../domain/project/types';
import { createDefaultProject, createCyrilFile, generateId } from '../../domain/project/defaults';
import { serializeProject, deserializeProject } from '../serializers/projectSerializer';

// File System Access API approach
// Fallback: local download / input[type=file]

let fileHandle: FileSystemFileHandle | null = null;

export async function openProject(): Promise<CyrilFile> {
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
    const file = await handle.getFile();
    const contents = await file.text();
    return deserializeProject(contents);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // User cancelled picker, just rethrow or ignore upstream
      throw error;
    }
    throw new Error(`Failed to open project: ${error.message}`);
  }
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

export function createNewProject(title?: string): CyrilFile {
  fileHandle = null; // Clear old handle
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
