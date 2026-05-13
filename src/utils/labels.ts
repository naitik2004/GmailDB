import { GmailEngine } from '../core/engine.js';

export async function ensureLabel(engine: GmailEngine, labelName: string) {
  try {
    return await engine.createLabel(labelName);
  } catch (err) {
    console.error(`Error ensuring label ${labelName}:`, err);
    throw err;
  }
}
