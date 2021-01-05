import { PathLike } from "fs";

export type Uuid = string;

export type DocumentFileWithExternalLink = { title: string, url: PathLike };

export interface Fetcher {
  fetchAllDocuments(url: string): Promise<DocumentFileWithExternalLink[]>;
}
