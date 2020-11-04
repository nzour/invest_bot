import * as fs from "fs/promises";
import { PathLike } from "fs";
import { createLogger as createWinstonLogger, format, Logger, transports as t } from "winston";

export async function assertDirectoryExists(path: PathLike): Promise<void> {
  try {
    await fs.access(path)
    await fs.chmod(path, 0o777);
  } catch (e) {
    await fs.mkdir(path, { mode: 0o777, recursive: true });
  }
}

export async function assertFileExists(path: PathLike): Promise<void> {
  try {
    await fs.access(path)
    await fs.chmod(path, 0o777);
  } catch (e) {
    await fs.appendFile(path, '', { mode: 0o777 });
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
