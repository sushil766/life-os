// Local single-user token store. Keeps the OAuth refresh token on disk
// at ./data/google-token.json (gitignored). Fine for a local-first app.
// For multi-user / remote deployment, swap this for a DB-backed store.
import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "google-token.json");

// Mirrors google-auth-library's Credentials so type-narrowing isn't fighting us.
export interface StoredToken {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string;
  token_type?: string | null;
  expiry_date?: number | null;
  id_token?: string | null;
}

export async function readToken(): Promise<StoredToken | null> {
  try {
    const buf = await fs.readFile(FILE, "utf8");
    return JSON.parse(buf) as StoredToken;
  } catch {
    return null;
  }
}

export async function writeToken(t: StoredToken): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(t, null, 2), "utf8");
}

export async function clearToken(): Promise<void> {
  try { await fs.unlink(FILE); } catch { /* noop */ }
}
