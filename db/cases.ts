import { env } from 'cloudflare:workers';
import { casesIndexesSql, casesSchemaSql } from './schema';

let schemaReady = false;

export async function getCasesDb() {
  const db = env.DB;
  if (!schemaReady) {
    await db.batch([
      db.prepare(casesSchemaSql),
      ...casesIndexesSql.map((statement) => db.prepare(statement)),
    ]);
    schemaReady = true;
  }
  return db;
}

