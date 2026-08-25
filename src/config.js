import "dotenv/config";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..");
const LEGACY_DATA_DIR = path.join(ROOT, "data");

// Production releases are often replaced as a whole during deployment. Keep
// durable application state beside the checkout by default so users, Telegram
// sessions, folders, shares and upload history survive that replacement.
const configuredDataDir = String(process.env.DATA_DIR || "").trim();
export const DATA_DIR = configuredDataDir
  ? path.resolve(ROOT, configuredDataDir)
  : process.env.NODE_ENV === "production"
    ? path.resolve(ROOT, "..", `${path.basename(ROOT)}-data`)
    : LEGACY_DATA_DIR;
export const PUBLIC_DIR = path.join(ROOT, "public");
export const UPLOAD_TMP = path.join(DATA_DIR, "uploads");

fs.mkdirSync(DATA_DIR, { recursive: true });

// One-time, non-destructive upgrade from the old in-repository data directory.
// This runs before SQLite is opened, including its WAL files when present.
if (DATA_DIR !== LEGACY_DATA_DIR && fs.existsSync(LEGACY_DATA_DIR)) {
  const targetDb = path.join(DATA_DIR, "tgdrive.sqlite");
  const legacyDb = path.join(LEGACY_DATA_DIR, "tgdrive.sqlite");
  if (!fs.existsSync(targetDb) && fs.existsSync(legacyDb)) {
    for (const entry of fs.readdirSync(LEGACY_DATA_DIR)) {
      fs.cpSync(path.join(LEGACY_DATA_DIR, entry), path.join(DATA_DIR, entry), {
        recursive: true,
        force: false,
        errorOnExist: false,
      });
    }
    console.log(`[storage] Migrated existing data to persistent directory: ${DATA_DIR}`);
  }
}

fs.mkdirSync(UPLOAD_TMP, { recursive: true });

function secretFromEnvFile(envFile) {
  if (!fs.existsSync(envFile)) return null;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const match = line.match(/^SECRET=(.+)$/);
    if (match && match[1].trim().length >= 32) return match[1].trim();
  }
  return null;
}

function readSecret() {
  const envFile = path.join(ROOT, ".env");
  const secretFile = path.join(DATA_DIR, ".secret");
  if (process.env.SECRET && process.env.SECRET.length >= 32) {
    // Mirror an explicitly configured key into persistent storage so links and
    // sessions remain stable even if a later deployment replaces the .env file.
    const saved = fs.existsSync(secretFile) ? fs.readFileSync(secretFile, "utf8").trim() : "";
    if (saved !== process.env.SECRET) fs.writeFileSync(secretFile, `${process.env.SECRET}\n`, { mode: 0o600 });
    return process.env.SECRET;
  }
  const persisted = fs.existsSync(secretFile) ? fs.readFileSync(secretFile, "utf8").trim() : "";
  if (persisted.length >= 32) return persisted;

  // Preserve the previous installation's key during the storage upgrade.
  const secret = secretFromEnvFile(envFile) || randomBytes(32).toString("hex");
  fs.writeFileSync(secretFile, `${secret}\n`, { mode: 0o600 });
  process.env.SECRET = secret;
  return secret;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  host: process.env.HOST || "127.0.0.1",
  secret: readSecret(),
  publicUrl: (process.env.PUBLIC_URL || "").replace(/\/$/, ""),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES) || 2 * 1024 * 1024 * 1024,
  // Max bytes per Telegram message. Files larger than this are transparently
  // split into multipart entries that reassemble on download. ~1.9 GiB keeps a
  // safe margin under Telegram's 2 GiB per-file cap.
  splitPartBytes: Number(process.env.SPLIT_PART_BYTES) || Math.floor(1.9 * 1024 * 1024 * 1024),
  apiPresets: (process.env.API_PRESETS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [id, hash] = s.split(":");
      return { id: id.trim(), hash: hash.trim() };
    }),
  isProd: process.env.NODE_ENV === "production",
};
