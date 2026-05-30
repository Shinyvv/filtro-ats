export const SESSION_COOKIE_NAME = "ats_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  uid: string;
  exp: number;
};

function toBase64Url(input: string): string {
  return btoa(input).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  return atob(padded);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return toBase64Url(binary);
}

function base64UrlToBytes(input: string): Uint8Array {
  const binary = fromBase64Url(input);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function signPayload(payloadBase64Url: string): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? "change-this-secret";
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadBase64Url),
  );

  return bytesToBase64Url(new Uint8Array(signatureBuffer));
}

export async function createSessionToken(userId: string): Promise<string> {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };

  const payloadBase64Url = toBase64Url(JSON.stringify(payload));
  const signature = await signPayload(payloadBase64Url);

  return `${payloadBase64Url}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  const [payloadBase64Url, signature] = token.split(".");
  if (!payloadBase64Url || !signature) {
    return null;
  }

  const expectedSignature = await signPayload(payloadBase64Url);
  const actualSignatureBytes = base64UrlToBytes(signature);
  const expectedSignatureBytes = base64UrlToBytes(expectedSignature);

  if (actualSignatureBytes.length !== expectedSignatureBytes.length) {
    return null;
  }

  let isValid = true;
  for (let index = 0; index < actualSignatureBytes.length; index += 1) {
    if (actualSignatureBytes[index] !== expectedSignatureBytes[index]) {
      isValid = false;
    }
  }

  if (!isValid) {
    return null;
  }

  try {
    const payloadJson = fromBase64Url(payloadBase64Url);
    const payload = JSON.parse(payloadJson) as SessionPayload;

    if (!payload.uid || !payload.exp) {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
