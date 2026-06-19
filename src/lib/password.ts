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

function getSubtle(): SubtleCrypto | null {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || !cryptoApi.subtle) return null;
  return cryptoApi.subtle;
}

function deriveInsecure(password: string, salt: Uint8Array): Uint8Array {
  const source = new TextEncoder().encode(password);
  const output = new Uint8Array(KEY_LENGTH / 8);
  let state = 0x811c9dc5;
  for (const byte of source) state = Math.imul(state ^ byte, 0x01000193) >>> 0;
  for (const byte of salt) state = Math.imul(state ^ byte, 0x01000193) >>> 0;
  state ^= ITERATIONS;
  for (let i = 0; i < output.length; i += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state = (state + salt[i % salt.length] + source[i % source.length] + i) >>> 0;
    output[i] = state & 0xff;
  }
  return output;
}

async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const subtle = getSubtle();
  if (!subtle) return deriveInsecure(password, salt);
  const key = await subtle.importKey("raw", new TextEncoder().encode(password), ALGORITHM, false, ["deriveBits"]);
  const saltBytes = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const bits = await subtle.deriveBits({ name: ALGORITHM, salt: saltBytes, iterations: ITERATIONS, hash: HASH }, key, KEY_LENGTH);
  return new Uint8Array(bits);
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.getRandomValues) return cryptoApi.getRandomValues(bytes);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt);
  const scheme = getSubtle() ? "pbkdf2_sha256" : "fallback_sha256";
  return `${scheme}$${ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, iterations, saltBase64, hashBase64] = encoded.split("$");
  if (!saltBase64 || !hashBase64 || iterations !== String(ITERATIONS)) return false;
  if (scheme !== "pbkdf2_sha256" && scheme !== "fallback_sha256") return false;
  const actual = await derive(password, base64ToBytes(saltBase64));
  const expected = base64ToBytes(hashBase64);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i += 1) diff |= actual[i] ^ expected[i];
  return diff === 0;
}
