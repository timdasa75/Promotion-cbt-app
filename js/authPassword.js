// authPassword.js - local password hashing helpers

export const LOCAL_PASSWORD_ALGO_V2 = "pbkdf2_sha256";
export const LOCAL_PASSWORD_ITERATIONS = 120000;

function getCryptoProvider() {
  const globalCrypto = globalThis?.crypto;
  if (globalCrypto) return globalCrypto;
  return null;
}

function toHex(buffer) {
  const bytes = Array.from(new Uint8Array(buffer));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function legacyHashFallback(value) {
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(String(value || ""))));
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(String(value || ""), "utf8").toString("base64");
  }
  return String(value || "");
}

export async function hashPasswordLegacy(password) {
  const value = String(password || "");
  if (!value) return "";

  const cryptoProvider = getCryptoProvider();
  if (cryptoProvider?.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await cryptoProvider.subtle.digest("SHA-256", encoded);
    return toHex(digest);
  }

  return legacyHashFallback(value);
}

export function generatePasswordSalt() {
  const cryptoProvider = getCryptoProvider();
  if (cryptoProvider?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoProvider.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

export async function derivePasswordHash(password, salt, iterations = LOCAL_PASSWORD_ITERATIONS) {
  const normalizedPassword = String(password || "");
  const normalizedSalt = String(salt || "");
  if (!normalizedPassword || !normalizedSalt) return "";

  const cryptoProvider = getCryptoProvider();
  if (cryptoProvider?.subtle) {
    const material = await cryptoProvider.subtle.importKey(
      "raw",
      new TextEncoder().encode(normalizedPassword),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await cryptoProvider.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: new TextEncoder().encode(normalizedSalt),
        iterations: Number(iterations) || LOCAL_PASSWORD_ITERATIONS,
      },
      material,
      256,
    );
    return toHex(bits);
  }

  return hashPasswordLegacy(`${normalizedSalt}:${normalizedPassword}`);
}

export async function buildLocalPasswordRecord(password) {
  const salt = generatePasswordSalt();
  const hash = await derivePasswordHash(password, salt, LOCAL_PASSWORD_ITERATIONS);
  return {
    passwordHash: hash,
    passwordSalt: salt,
    passwordAlgo: LOCAL_PASSWORD_ALGO_V2,
    passwordIterations: LOCAL_PASSWORD_ITERATIONS,
  };
}

export async function verifyLocalPasswordRecord(user, password) {
  if (!user || !password) return false;

  if (
    String(user.passwordAlgo || "") === LOCAL_PASSWORD_ALGO_V2 &&
    String(user.passwordSalt || "")
  ) {
    const iterations = Number(user.passwordIterations || LOCAL_PASSWORD_ITERATIONS);
    const hash = await derivePasswordHash(password, user.passwordSalt, iterations);
    return hash === String(user.passwordHash || "");
  }

  const legacyHash = await hashPasswordLegacy(password);
  return legacyHash === String(user.passwordHash || "");
}
