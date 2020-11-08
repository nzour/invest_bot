import { PathLike } from "fs";
import { Company } from "../workers/core/company";

export type Uuid = string;

export type DocumentFile = { id: Uuid, company: Company, state: 'NEW' | 'PROCESSED' } & DocumentFileWithExternalLink;

export type DocumentFileWithExternalLink = { title: string, url: PathLike };

export interface Fetcher {
  fetchAllDocuments(url: string): Promise<DocumentFileWithExternalLink[]>;
}
