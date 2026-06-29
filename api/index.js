import app from '../server/index.js';
import { initDB } from '../server/db.js';

let readyPromise;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = initDB().catch((error) => {
      readyPromise = undefined;
      throw error;
    });
  }
  return readyPromise;
}

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
