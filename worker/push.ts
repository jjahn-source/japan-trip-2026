// Web Push with WebCrypto alone, so it runs in the Worker (and in Node for the tests): the message is
// encrypted for one phone (RFC 8291, aes128gcm) and the request is signed with the site's VAPID key
// (RFC 8292). Apple, Google and Mozilla's push services all take this format.

const enc = new TextEncoder();
type Bytes = Uint8Array<ArrayBuffer>;

export const b64u = {
  encode: (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  decode: (s: string): Bytes => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0)),
};
const concat = (...parts: Uint8Array[]): Bytes => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
};

/** A phone's subscription, as PushManager gives it (keys base64url). */
export interface Sub { endpoint: string; p256dh: string; auth: string }
/** The site's VAPID key pair: the raw public key (65 bytes) and the private scalar d, base64url. */
export interface Vapid { publicKey: string; privateKey: string; subject: string }

async function hkdf(salt: Bytes, ikm: Bytes, info: Bytes, bytes: number): Promise<Bytes> {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

/** The message body for one subscription: salt, record size, the one-off public key, then the
 *  ciphertext of the payload with its end-of-record byte. */
export async function encrypt(payload: Uint8Array, sub: Pick<Sub, 'p256dh' | 'auth'>, salt: Bytes = crypto.getRandomValues(new Uint8Array(16))): Promise<Bytes> {
  const ua = b64u.decode(sub.p256dh), auth = b64u.decode(sub.auth);
  const local = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair;
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey) as ArrayBuffer);
  const uaKey = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const secret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(auth, secret, concat(enc.encode('WebPush: info\0'), ua, asPub), 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(payload, new Uint8Array([2]))));
  const head = new Uint8Array(21 + asPub.length);
  head.set(salt);
  new DataView(head.buffer).setUint32(16, 4096);
  head[20] = asPub.length;
  head.set(asPub, 21);
  return concat(head, body);
}

const signers = new Map<string, Promise<CryptoKey>>();
function signer(v: Vapid) {
  let k = signers.get(v.privateKey);
  if (!k) {
    const pub = b64u.decode(v.publicKey);
    k = crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', d: v.privateKey, x: b64u.encode(pub.slice(1, 33)), y: b64u.encode(pub.slice(33, 65)), ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    signers.set(v.privateKey, k);
  }
  return k;
}

/** The Authorization header for a push service: a JWT for its origin, signed ES256, and our key. */
export async function vapidAuth(endpoint: string, v: Vapid, now = Date.now()): Promise<string> {
  const part = (o: object) => b64u.encode(enc.encode(JSON.stringify(o)));
  const unsigned = `${part({ typ: 'JWT', alg: 'ES256' })}.${part({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: v.subject })}`;
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, await signer(v), enc.encode(unsigned)));
  return `vapid t=${unsigned}.${b64u.encode(sig)}, k=${v.publicKey}`;
}

export interface Message { title: string; body: string; url: string; tag?: string }
/** Sends one message. `gone` means the phone unsubscribed (or the app was removed): forget it. */
export async function send(sub: Sub, msg: Message, v: Vapid, opts: { ttl?: number; urgency?: 'normal' | 'high' } = {}): Promise<{ ok: boolean; status: number; gone: boolean }> {
  try {
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        Authorization: await vapidAuth(sub.endpoint, v),
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: String(opts.ttl ?? 3600),
        Urgency: opts.urgency ?? 'high',
      },
      body: await encrypt(enc.encode(JSON.stringify(msg)), sub),
    });
    return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
  } catch {
    return { ok: false, status: 0, gone: false };
  }
}

/** A fresh VAPID key pair (npm run live:setup). */
export async function generateVapid(): Promise<{ publicKey: string; privateKey: string }> {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair;
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey) as ArrayBuffer);
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey) as JsonWebKey;
  return { publicKey: b64u.encode(pub), privateKey: jwk.d! };
}
