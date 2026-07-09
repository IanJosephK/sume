// Web Push implementation using Web Crypto API (Cloudflare Workers compatible)

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

async function createVapidJwt(
  audience: string,
  subject: string,
  publicKey: string,
  privateKeyBytes: Uint8Array
): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
    sub: subject,
  };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64url(enc.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: uint8ArrayToBase64url(privateKeyBytes),
      x: uint8ArrayToBase64url(base64urlToUint8Array(publicKey).slice(1, 33)),
      y: uint8ArrayToBase64url(base64urlToUint8Array(publicKey).slice(33, 65)),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      enc.encode(unsignedToken)
    )
  );

  return `${unsignedToken}.${uint8ArrayToBase64url(signature)}`;
}

async function encryptPayload(
  payload: string,
  subscriptionPublicKey: Uint8Array,
  authSecret: Uint8Array
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const serverKeyPair = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  )) as CryptoKeyPair;

  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", serverKeyPair.publicKey) as ArrayBuffer
  );

  const clientKey = await crypto.subtle.importKey(
    "raw",
    subscriptionPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey } as unknown as SubtleCryptoDeriveKeyAlgorithm,
      serverKeyPair.privateKey,
      256
    )
  );

  const enc = new TextEncoder();

  // HKDF for auth info
  const authInfo = concatUint8Arrays(
    enc.encode("WebPush: info\0"),
    subscriptionPublicKey,
    serverPublicKeyRaw
  );

  const authHkdfKey = await crypto.subtle.importKey("raw", authSecret, { name: "HKDF" }, false, ["deriveBits"]);
  const prk = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: sharedSecret, info: authInfo },
      authHkdfKey,
      256
    )
  );

  // Derive content encryption key
  const cekInfo = concatUint8Arrays(enc.encode("Content-Encoding: aes128gcm\0"));
  const prkKey = await crypto.subtle.importKey("raw", prk, { name: "HKDF" }, false, ["deriveBits"]);
  const contentKey = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: cekInfo },
      prkKey,
      128
    )
  );

  // Derive nonce
  const nonceInfo = concatUint8Arrays(enc.encode("Content-Encoding: nonce\0"));
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      prkKey,
      96
    )
  );

  // Encrypt
  const paddedPayload = concatUint8Arrays(new Uint8Array([2, 0]), enc.encode(payload));
  const aesKey = await crypto.subtle.importKey("raw", contentKey, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload)
  );

  // Build aes128gcm body
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, encrypted.length + 86);
  const body = concatUint8Arrays(
    salt,
    recordSize,
    new Uint8Array([65]),
    serverPublicKeyRaw,
    encrypted
  );

  return { ciphertext: body, salt, serverPublicKey: serverPublicKeyRaw };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: string,
  vapidSubject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; status: number }> {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const privateKeyBytes = base64urlToUint8Array(vapidPrivateKey);
  const jwt = await createVapidJwt(audience, vapidSubject, vapidPublicKey, privateKeyBytes);

  const subPublicKey = base64urlToUint8Array(subscription.keys.p256dh);
  const authSecret = base64urlToUint8Array(subscription.keys.auth);

  const { ciphertext } = await encryptPayload(payload, subPublicKey, authSecret);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
      TTL: "86400",
      Urgency: "high",
    },
    body: ciphertext,
  });

  return { success: response.status >= 200 && response.status < 300, status: response.status };
}
