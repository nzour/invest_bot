import * as fs from 'fs/promises';
import * as listProcesses from 'ps-list';

export interface Locker {
	isAlreadyLocked(): Promise<boolean>;

	createLock(): Promise<void>;

	releaseLock(): Promise<void>;
}

export class FileSystemLocker implements Locker {
	private readonly lockFilePath = `${this.directory}/${this.lockName}.pid`;

	constructor(private lockName: string, private directory: string) { }

	async createLock(): Promise<void> {
		if (await this.isAlreadyLocked()) {
			throw new Error("Unable to create lock, the similar process is already running");
		}

		await fs.writeFile(this.lockFilePath, String(process.pid));
	}

	async isAlreadyLocked(): Promise<boolean> {
		try {
			await fs.access(this.lockFilePath);
		} catch {
			// Файла не существует
			return false;
		}

		const file = await fs.readFile(this.lockFilePath);
		const pid = Number(file.toString());

		return await this.isProcessExists(pid);
	}

	async releaseLock(): Promise<void> {
		await fs.unlink(this.lockFilePath);
	}

	private async isProcessExists(pid: number): Promise<boolean> {
		const processes = await listProcesses({ all: true });

		return !!processes.find(p => p.pid === pid);
	}
}


export async function withLock(locker: Locker, func: () => Promise<void>): Promise<void> {
	if (await locker.isAlreadyLocked()) {
		console.log('The similar process is already exists, skipping...');
		return;
	}

	await locker.createLock();

	try {
		await func();
	} finally {
		await locker.releaseLock();
	}
}
