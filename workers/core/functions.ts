import * as fs from "fs/promises";
import { PathLike } from "fs";

export async function assertDirectoryExists(path: PathLike): Promise<void> {
	try {
		await fs.access(path)
		await fs.chmod(path, 0o777);
	} catch (e) {
		await fs.mkdir(path, { mode: 0o777, recursive: true });
	}
}
