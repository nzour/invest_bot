import * as fs from "fs/promises";
import { PathLike } from "fs";
import { createLogger as createWinstonLogger, format, Logger, transports as t } from "winston";
import { exec } from "child_process";

export async function assertDirectoryExists(path: PathLike): Promise<void> {
	try {
		await fs.access(path)
		await fs.chmod(path, 0o755);
	} catch (e) {
		await fs.mkdir(path, { mode: 0o755, recursive: true });
	}
}

export async function assertFileExists(path: PathLike): Promise<void> {
	try {
		await fs.access(path)
		await fs.chmod(path, 0o755);
	} catch (e) {
		await fs.appendFile(path, '', { mode: 0o755 });
	}
}

export function createLogger(directory: string): Logger {
	const transports = ['debug', 'info', 'warning', 'error']
		.map(level => new t.File({
			filename: `${directory}/${level}.log`,
			level,
		}));

	return createWinstonLogger({
		level: 'debug',
		format: format.printf(({ level, message }) => `[${level}: ${new Date().toISOString()}] ${message}`),
		transports: [...transports, new t.Console()]
	})
}

export function createConsoleLogger(level = 'debug'): Logger {
	return createWinstonLogger({
		level,
		format: format.printf(({ level, message }) => `[${level}: ${new Date().toISOString()}] ${message}`),
		transports: [new t.Console()]
	})
}

export async function shellExec(cmd: string): Promise<{ stdout: string, stderr: string }> {
	return new Promise(function (resolve, reject) {
		exec(cmd, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			} else {
				resolve({ stdout, stderr });
			}
		});
	});
}

export const defaultDirs = {
	fetcherFiles: `/tmp/invest_bot/fetcher`,
	logs: {
		fetcher: (subDir: string) => `/var/log/invest_bot/${subDir}/fetcher`,
		parser: (subDir: string) => `/var/log/invest_bot/${subDir}/parser`,
	}
}

