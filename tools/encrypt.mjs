// Encrypts private/tracks.json and the mp3s it lists into assets/vault/.
//
//   VAULT_PASSWORD='new password' node tools/encrypt.mjs
//
// Every run uses a fresh salt and fresh file names, so re-running with a new
// password is how the password is rotated. The old vault folder is replaced.
//
// Format (read by index.html):
//   assets/vault/vault.json  { v, iterations, salt, manifest }   (salt base64)
//   assets/vault/<id>.bin    12-byte IV || AES-256-GCM ciphertext
// The key is PBKDF2-SHA256(password, salt, iterations). The decrypted manifest is
// [{ title, dur, id }] where id names the .bin holding that track's mp3.

import { webcrypto as crypto } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ITERATIONS = 600_000;
const root = join(import.meta.dirname, "..");
const privateDir = join(root, "private");
const vaultDir = join(root, "assets", "vault");

const password = process.env.VAULT_PASSWORD;
if (!password || password.length < 12) {
  console.error("Set VAULT_PASSWORD to a password of at least 12 characters.");
  process.exit(1);
}

const randomHex = bytes => Buffer.from(crypto.getRandomValues(new Uint8Array(bytes))).toString("hex");

const salt = crypto.getRandomValues(new Uint8Array(16));
const baseKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"],
);

async function seal(bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
  return Buffer.concat([iv, ct]);
}

function duration(file) {
  const s = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

rmSync(vaultDir, { recursive: true, force: true });
mkdirSync(vaultDir, { recursive: true });

const tracks = JSON.parse(readFileSync(join(privateDir, "tracks.json"), "utf8"));
const manifest = [];
for (const t of tracks) {
  const file = join(privateDir, t.file);
  const id = randomHex(8);
  writeFileSync(join(vaultDir, `${id}.bin`), await seal(readFileSync(file)));
  manifest.push({ title: t.title, dur: duration(file), id });
  console.log(`${id}.bin  ${t.title}`);
}

const sealedManifest = await seal(new TextEncoder().encode(JSON.stringify(manifest)));
writeFileSync(
  join(vaultDir, "vault.json"),
  JSON.stringify({ v: 1, iterations: ITERATIONS, salt: Buffer.from(salt).toString("base64"), manifest: sealedManifest.toString("base64") }, null, 2) + "\n",
);
console.log(`Encrypted ${manifest.length} tracks into assets/vault/`);
