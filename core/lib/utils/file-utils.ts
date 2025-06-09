import * as fs from 'node:fs/promises';
import * as zlib from 'zlib';

import { promisify } from 'util';

export async function readJsonGz(filePath: string) {
  const gunzip = promisify(zlib.gunzip);
  try {
    const data = await fs.readFile(filePath);
    const buffer = await gunzip(data);
    const jsonString = buffer.toString('utf-8');
    return JSON.parse(jsonString);
  } catch (error: any) {
    throw new Error(`Failed to read or decompress file: ${filePath}\n${error.message}`);
  }
}
