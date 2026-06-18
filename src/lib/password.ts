const ITERATIONS = 100000;
const ALGORITHM = "PBKDF2";
const HASH = "SHA-256";
const KEY_LENGTH = 256;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), ALGORITHM, false, ["deriveBits"]);
  const saltBytes = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits({ name: ALGORITHM, salt: saltBytes, iterations: ITERATIONS, hash: HASH }, key, KEY_LENGTH);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt);
  return `pbkdf2_sha256$${ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, iterations, saltBase64, hashBase64] = encoded.split("$");
  if (scheme !== "pbkdf2_sha256" || iterations !== String(ITERATIONS) || !saltBase64 || !hashBase64) return false;
  const actual = await derive(password, base64ToBytes(saltBase64));
  const expected = base64ToBytes(hashBase64);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
