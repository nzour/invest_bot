export type Uuid = string;

export type FetcherIntegrationImplementation = () => Promise<void>;

export type DocumentFile = { id: Uuid, title: string };
