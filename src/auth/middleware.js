// Authentication middleware

import { verifyJWT } from './jwt.js';

export async function authenticateRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'No token provided' };
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify JWT
    const claims = await verifyJWT(token, env.JWT_SECRET);
    
    if (!claims) {
      return { authenticated: false, error: 'Invalid token' };
    }

    // Check session in KV
    const session = await env.SESSIONS.get(`session:${claims.sessionId}`);
    
    if (!session) {
      return { authenticated: false, error: 'Session expired' };
    }

    const sessionData = JSON.parse(session);
    
    // Verify user exists and get plan
    const user = await env.DB.prepare(
      'SELECT id, email, username, plan FROM users WHERE id = ? AND is_active = 1'
    ).bind(sessionData.userId).first();

    if (!user) {
      return { authenticated: false, error: 'User not found' };
    }

    return { 
      authenticated: true, 
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: (user.plan || 'free').toLowerCase()
      }
    };
  } catch (error) {
    return { authenticated: false, error: 'Authentication failed' };
  }
}

export function requireAuth(handler) {
  return async (request, env, ctx, ...args) => {
    const auth = await authenticateRequest(request, env);
    
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add user to request context
    request.user = auth.user;
    
    return handler(request, env, ctx, ...args);
  };
}