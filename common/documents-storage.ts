import * as fs from 'fs/promises';
import { createInterface } from 'readline';
import { createReadStream, PathLike } from "fs";
import { assertDirectoryExists, assertFileExists } from "../workers/core/functions";
import { DocumentFile, DocumentFileWithExternalLink, Uuid } from "./types";

/** @deprecated */
export interface DocumentsStorage {
  findNonExistentDocuments(titles: string[]): Promise<string[]>;
  save(document: DocumentFile): Promise<void>;
}

/** @deprecated */
export class DocumentsStorageFileSystem implements DocumentsStorage {
  private readonly filename = `${this.directoryToStore}/documents.txt`;

  constructor(private directoryToStore: PathLike) { }

  async findNonExistentDocuments(titles: string[]): Promise<string[]> {
    await assertDirectoryExists(this.directoryToStore);
    await assertFileExists(this.filename);

    const setOfTitles = new Set(titles);

    const reader = createInterface(createReadStream(this.filename));

    for await (const line of reader) {
      const document = JSON.parse(line) as DocumentFile;

      if (setOfTitles.has(document.title)) {
        setOfTitles.delete(document.title);
      }
    }

    reader.close();

    return [...setOfTitles];
  }

  async save(document: DocumentFile): Promise<void> {
    await assertDirectoryExists(this.directoryToStore);
    await assertFileExists(this.filename);

    const toSave = JSON.stringify({ id: document.id, title: document.title });

    await fs.appendFile(this.filename, toSave + '\r\n', { flag: 'a' });
  }
}


export interface DocumentRepository {
  filterNonExistentDocuments<T extends DocumentFileWithExternalLink>(documents: T[]): Promise<T[]>;
  saveDocument(document: DocumentFile): Promise<void>;
  deleteDocument<T extends { id: Uuid }>(document: T): Promise<void>;
}

export class InMemoryDocumentRepository implements DocumentRepository {
  private documents = new Array<DocumentFile>();

  async filterNonExistentDocuments<T extends DocumentFileWithExternalLink>(documents: T[]): Promise<T[]> {
    return documents.filter(d => !this.documents.find(d2 => d2.title === d.title));
  }

  async saveDocument(document: DocumentFile): Promise<void> {
    this.documents.push(document);
  }

  async deleteDocument<T extends { id: Uuid }>({ id }: T): Promise<void> {
    this.documents = this.documents.filter(d => d.id !== id);
  }
}
