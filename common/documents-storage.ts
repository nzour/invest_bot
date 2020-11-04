import * as fs from 'fs/promises';
import { createInterface } from 'readline';
import { PathLike, createReadStream } from "fs";
import { assertDirectoryExists, assertFileExists } from "../workers/core/functions";
import { DocumentFile } from "./types";

export interface DocumentsStorage {
  findNonExistentDocuments(titles: string[]): Promise<string[]>;
  save(document: DocumentFile): Promise<void>;
}

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

