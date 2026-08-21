const COOKIE = "aurex_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function expectedEmail() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

function expectedPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sign(data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(sig));
}

export function credentialsConfigured() {
  return Boolean(expectedEmail() && expectedPassword() && secret());
}

export function credentialsMatch(email: string, password: string) {
  const a = email.trim().toLowerCase();
  const b = expectedEmail();
  const p = password;
  const q = expectedPassword();
  if (!a || !b || !p || !q || a.length !== b.length || p.length !== q.length) return false;
  let ok = a === b;
  let diff = 0;
  for (let i = 0; i < p.length; i++) diff |= p.charCodeAt(i) ^ q.charCodeAt(i);
  return ok && diff === 0;
}

export async function createSessionToken(email: string) {
  const payload = toBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        e: email.trim().toLowerCase(),
        exp: Date.now() + MAX_AGE_SEC * 1000,
      })
    )
  );
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

export async function readSessionToken(token: string | undefined | null) {
  if (!token || !secret() || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await sign(payload);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  if (diff !== 0) return null;
  try {
    const json = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      e?: string;
      exp?: number;
    };
    if (!json.e || !json.exp || json.exp < Date.now()) return null;
    if (json.e !== expectedEmail()) return null;
    return { email: json.e };
  } catch {
    return null;
  }
}

export const adminCookie = {
  name: COOKIE,
  maxAge: MAX_AGE_SEC,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  },
};
