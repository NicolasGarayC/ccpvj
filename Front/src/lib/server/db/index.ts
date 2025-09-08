import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import fs from 'fs';

let dbUrl = env.DATABASE_URL;
console.log('DATABASE_URL:', dbUrl); // Debug: muestra el valor en consola

if (!dbUrl) {
  throw new Error('DATABASE_URL is not set. Define it in /home/user/ccpvj/Front/.env as DATABASE_URL="file:/home/user/ccpvj/Data/ccpvj.db" and restart the dev server.');
}

// Corrige el formato para SQLite si es necesario (Linux normalmente usa 'file:/...')
if (dbUrl.startsWith('file:///')) {
  dbUrl = dbUrl.replace('file:///', 'file:/');
}

// Verifica que el archivo exista antes de conectar
const dbFilePath = dbUrl.replace(/^file:/, '');
if (!fs.existsSync(dbFilePath)) {
  throw new Error(`SQLite database file not found at ${dbFilePath}. Please create the file or check the path.`);
}

const client = createClient({ url: dbUrl });

export const db = drizzle(client, { schema });
