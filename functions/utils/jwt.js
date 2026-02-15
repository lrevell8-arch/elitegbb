// JWT Utilities - Web Crypto API

export async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerB64, claimsB64, signatureB64] = parts;

  // Verify signature
  const encoder = new TextEncoder();
  const data = `${headerB64}.${claimsB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expectedSignature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  const expectedSignatureB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSignature))).replace(/=/g, '');

  if (signatureB64 !== expectedSignatureB64) {
    throw new Error('Invalid signature');
  }

  // Parse claims
  const claimsJson = atob(claimsB64.replace(/-/g, '+').replace(/_/g, '/'));
  const claims = JSON.parse(claimsJson);

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now) {
    throw new Error('Token expired');
  }

  return claims;
}

export async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 hours
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const claimsB64 = btoa(JSON.stringify(claims)).replace(/=/g, '');
  const data = `${headerB64}.${claimsB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');

  return `${data}.${signatureB64}`;
}
