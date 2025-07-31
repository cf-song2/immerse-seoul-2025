// Simple JWT implementation for Workers

export async function createJWT(payload, secret, expiresIn = 3600) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(claims)).replace(/=/g, '');
  
  const message = `${encodedHeader}.${encodedPayload}`;
  const signature = await sign(message, secret);
  
  return `${message}.${signature}`;
}

export async function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.');
    
    if (!header || !payload || !signature) {
      return null;
    }

    const message = `${header}.${payload}`;
    const expectedSignature = await sign(message, secret);
    
    if (signature !== expectedSignature) {
      return null;
    }

    const claims = JSON.parse(atob(payload));
    
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return claims;
  } catch (error) {
    return null;
  }
}

async function sign(message, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}